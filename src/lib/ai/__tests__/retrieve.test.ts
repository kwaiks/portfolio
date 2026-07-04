import { retrieve, type RetrievedChunk } from "../retrieve";
import { embedText } from "../embed";
import { getSupabaseAdmin } from "../../supabase/admin";

// Mock the two external boundaries of retrieve(): the embedding call and the
// Supabase RPC. retrieve() itself runs for real so the relevance gate is tested.
jest.mock("../embed", () => ({ embedText: jest.fn() }));
jest.mock("../../supabase/admin", () => ({ getSupabaseAdmin: jest.fn() }));

const embedMock = jest.mocked(embedText);
// Supabase client is a big surface; we only need `.rpc`, so cast loosely.
const adminMock = getSupabaseAdmin as unknown as jest.Mock;
let rpc: jest.Mock;

const chunk = (over: Partial<RetrievedChunk> = {}): RetrievedChunk => ({
  id: "c1",
  source: "about",
  section: "",
  content: "stub content",
  metadata: {},
  rrf_score: 0.5,
  semantic_distance: null,
  keyword_rank: null,
  ...over,
});

beforeEach(() => {
  jest.clearAllMocks();
  embedMock.mockResolvedValue([0.1, 0.2, 0.3]);
  rpc = jest.fn();
  adminMock.mockReturnValue({ rpc });
});

describe("retrieve", () => {
  it("passes the query, its embedding, and the fixed k to the hybrid RPC", async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    await retrieve("how fast was the WhatsApp AI?");

    expect(embedMock).toHaveBeenCalledWith("how fast was the WhatsApp AI?");
    expect(rpc).toHaveBeenCalledWith("match_documents_hybrid", {
      p_query_text: "how fast was the WhatsApp AI?",
      p_query_embedding: [0.1, 0.2, 0.3],
      p_k: 20,
      p_match_count: 8,
    });
  });

  it("forwards a custom matchCount as p_match_count", async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    await retrieve("q", 5);
    expect(rpc).toHaveBeenCalledWith(
      "match_documents_hybrid",
      expect.objectContaining({ p_match_count: 5 }),
    );
  });

  it("flags context when the best chunk is within the semantic threshold", async () => {
    rpc.mockResolvedValue({ data: [chunk({ semantic_distance: 0.4 })], error: null });
    const res = await retrieve("q");
    expect(res.hasContext).toBe(true);
    expect(res.chunks).toHaveLength(1);
  });

  it("flags no-context when nothing is close and there is no keyword hit", async () => {
    rpc.mockResolvedValue({
      data: [chunk({ semantic_distance: 0.9, keyword_rank: null })],
      error: null,
    });
    const res = await retrieve("q");
    expect(res.hasContext).toBe(false);
  });

  it("flags context via a strong keyword hit even when semantically far", async () => {
    rpc.mockResolvedValue({
      data: [chunk({ semantic_distance: 0.9, keyword_rank: 2 })],
      error: null,
    });
    const res = await retrieve("q");
    expect(res.hasContext).toBe(true);
  });

  it("does not count a weak keyword rank (rank > 3) as a hit", async () => {
    rpc.mockResolvedValue({
      data: [chunk({ semantic_distance: 0.9, keyword_rank: 5 })],
      error: null,
    });
    const res = await retrieve("q");
    expect(res.hasContext).toBe(false);
  });

  it("throws when the RPC returns an error", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    await expect(retrieve("q")).rejects.toThrow("Retrieval RPC failed: boom");
  });
});
