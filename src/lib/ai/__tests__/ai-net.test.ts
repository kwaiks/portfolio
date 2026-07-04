jest.mock("../../config", () => ({
  config: {
    deepseek: { apiKey: "test-key", baseURL: "https://api.test.com/v1", model: "test-model" },
    openai: { apiKey: "openai-key" },
  },
}));

import { generate, generateStream, rewriteQuery } from "../generate";
import { embedText, embedTexts } from "../embed";

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});

function jsonResponse(body: unknown, ok = true): Response {
  return {
    ok,
    status: ok ? 200 : 500,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

describe("generate", () => {
  it("returns the message content and posts to the API", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ choices: [{ message: { content: "hello" } }] }));
    expect(await generate([{ role: "user", content: "hi" }])).toBe("hello");
    const [, init] = fetchMock.mock.calls[0];
    expect(init).toMatchObject({ method: "POST" });
  });

  it("throws on a non-ok response", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, false));
    await expect(generate([{ role: "user", content: "hi" }])).rejects.toThrow(/DeepSeek generate failed/);
  });
});

describe("generateStream", () => {
  function sseStream(chunks: string[]): ReadableStream<Uint8Array> {
    return new ReadableStream({
      start(controller) {
        for (const c of chunks) controller.enqueue(new TextEncoder().encode(c));
        controller.close();
      },
    });
  }

  it("yields content deltas and stops at [DONE]", async () => {
    const body = sseStream([
      'data: {"choices":[{"delta":{"content":"Hel"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":"lo"}}]}\n\n',
      "data: [DONE]\n\n",
    ]);
    fetchMock.mockResolvedValue({ ok: true, status: 200, body } as unknown as Response);

    const out: string[] = [];
    for await (const delta of generateStream([{ role: "user", content: "hi" }])) out.push(delta);
    expect(out.join("")).toBe("Hello");
  });

  it("throws on a non-ok response", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 502,
      body: null,
      text: async () => "bad gateway",
    } as unknown as Response);
    await expect(generateStream([]).next()).rejects.toThrow(/DeepSeek stream failed/);
  });
});

describe("rewriteQuery", () => {
  it("returns the question unchanged when there is no history", async () => {
    expect(await rewriteQuery("what is your stack?", [])).toBe("what is your stack?");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("produces a cleaned standalone query from history", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ choices: [{ message: { content: "How fast was the WhatsApp AI response time?" } }] }),
    );
    const rewritten = await rewriteQuery("how fast was it?", [
      { role: "user", content: "tell me about the AI you shipped" },
      { role: "assistant", content: "I shipped a WhatsApp customer-service AI." },
    ]);
    expect(rewritten).toBe("How fast was the WhatsApp AI response time?");
  });

  it("strips surrounding quotes and keeps only the first line", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ choices: [{ message: { content: '"line one"\nignored second line' } }] }),
    );
    expect(await rewriteQuery("it?", [{ role: "user", content: "ctx" }])).toBe("line one");
  });

  it("falls back to the original question when generation fails", async () => {
    fetchMock.mockRejectedValue(new Error("boom"));
    expect(await rewriteQuery("how fast was it?", [{ role: "user", content: "ctx" }])).toBe(
      "how fast was it?",
    );
  });
});

describe("embed", () => {
  it("returns [] for empty input without calling the API", async () => {
    expect(await embedTexts([])).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("maps each text to its embedding, preserving order", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: [{ embedding: [1, 2] }, { embedding: [3, 4] }] }));
    expect(await embedTexts(["a", "b"])).toEqual([[1, 2], [3, 4]]);
  });

  it("throws on a non-ok response", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, false));
    await expect(embedTexts(["a"])).rejects.toThrow(/Embeddings request failed/);
  });

  it("embedText unwraps a single embedding", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: [{ embedding: [9, 9] }] }));
    expect(await embedText("x")).toEqual([9, 9]);
  });
});
