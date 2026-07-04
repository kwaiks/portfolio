import { answerQuery } from "../answer";
import { generate } from "../generate";
import { embedText } from "../embed";
import { getSupabaseAdmin } from "../../supabase/admin";
import { SCOPE_REFUSAL, NO_CONTEXT_REFUSAL } from "../prompts";

// Full pipeline: answerQuery → isOffTopic → retrieve(embed + Supabase) →
// buildSystemPrompt → generate. Mock only the three external boundaries
// (OpenAI embeddings, Supabase RPC, DeepSeek generate); everything else real.
jest.mock("../embed", () => ({ embedText: jest.fn() }));
jest.mock("../../supabase/admin", () => ({ getSupabaseAdmin: jest.fn() }));
jest.mock("../generate", () => ({ generate: jest.fn() }));

const embedMock = jest.mocked(embedText);
const generateMock = jest.mocked(generate);
const adminMock = getSupabaseAdmin as unknown as jest.Mock;
let rpc: jest.Mock;

const stubChunk = (over: Record<string, unknown> = {}) => ({
  id: "c1",
  source: "projects/payment-integrity",
  section: "overview",
  content: "Alexander led the migration of the payments platform to GKE.",
  metadata: {},
  rrf_score: 0.5,
  semantic_distance: 0.3,
  keyword_rank: null,
  ...over,
});

beforeEach(() => {
  jest.clearAllMocks();
  embedMock.mockResolvedValue([0.1, 0.2, 0.3]);
  rpc = jest.fn();
  adminMock.mockReturnValue({ rpc });
});

describe("answerQuery (full pipeline)", () => {
  it("refuses off-topic input before any retrieval or generation", async () => {
    const res = await answerQuery("write me a function that sorts a list");

    expect(res.reason).toBe("off-topic");
    expect(res.refused).toBe(true);
    expect(res.hasContext).toBe(false);
    expect(res.text).toBe(SCOPE_REFUSAL);
    expect(embedMock).not.toHaveBeenCalled();
    expect(generateMock).not.toHaveBeenCalled();
  });

  it("refuses with no-context when retrieval finds nothing relevant", async () => {
    rpc.mockResolvedValue({
      data: [stubChunk({ semantic_distance: 0.9, keyword_rank: null })],
      error: null,
    });

    const res = await answerQuery("what is the meaning of life");

    expect(res.reason).toBe("no-context");
    expect(res.refused).toBe(true);
    expect(res.hasContext).toBe(false);
    expect(res.text).toBe(NO_CONTEXT_REFUSAL);
    expect(generateMock).not.toHaveBeenCalled();
  });

  it("answers when context is semantically close and builds the prompt from chunks", async () => {
    rpc.mockResolvedValue({ data: [stubChunk({ semantic_distance: 0.3 })], error: null });
    generateMock.mockResolvedValue("Alexander migrated the payments platform to GKE.");

    const res = await answerQuery("what did alexander do with payments?");

    expect(res.reason).toBe("answered");
    expect(res.refused).toBe(false);
    expect(res.hasContext).toBe(true);
    expect(res.text).toBe("Alexander migrated the payments platform to GKE.");

    // generate received a system prompt built from the retrieved chunk, plus
    // the original user question verbatim.
    const messages = generateMock.mock.calls[0][0];
    const system = messages.find((m) => m.role === "system");
    const user = messages.find((m) => m.role === "user");
    expect(system?.content).toContain(
      "Alexander led the migration of the payments platform to GKE.",
    );
    expect(user?.content).toBe("what did alexander do with payments?");
  });

  it("answers via a keyword hit even when semantically far", async () => {
    rpc.mockResolvedValue({
      data: [stubChunk({ semantic_distance: 0.9, keyword_rank: 1 })],
      error: null,
    });
    generateMock.mockResolvedValue("Alexander handled payment integrity.");

    const res = await answerQuery("payments");

    expect(res.reason).toBe("answered");
    expect(res.refused).toBe(false);
    expect(res.hasContext).toBe(true);
    expect(generateMock).toHaveBeenCalledTimes(1);
  });
});
