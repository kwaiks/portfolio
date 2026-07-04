jest.mock("../supabase/admin", () => ({ getSupabaseAdmin: jest.fn() }));

import { hashSession, logAiEvent } from "../analytics";
import { getSupabaseAdmin } from "../supabase/admin";

const adminMock = getSupabaseAdmin as unknown as jest.Mock;

describe("hashSession", () => {
  it("is deterministic for the same input", () => {
    expect(hashSession("session-1")).toBe(hashSession("session-1"));
  });

  it("differs for different inputs", () => {
    expect(hashSession("a")).not.toBe(hashSession("b"));
  });

  it("produces a 16-char hex digest (no raw id stored)", () => {
    expect(hashSession("super-secret-session-id")).toMatch(/^[0-9a-f]{16}$/);
  });
});

describe("logAiEvent", () => {
  beforeEach(() => jest.clearAllMocks());

  function mockInsert(resolver: () => Promise<unknown>) {
    const insert = jest.fn(resolver);
    const from = jest.fn().mockReturnValue({ insert });
    adminMock.mockReturnValue({ from });
    return { from, insert };
  }

  it("inserts a metadata-only row — never raw text or PII", async () => {
    const { from, insert } = mockInsert(async () => ({}));
    await logAiEvent({ sessionHash: "abc123", theme: "ai", page: "/", hasContext: true });

    expect(from).toHaveBeenCalledWith("ai_events");
    expect(insert).toHaveBeenCalledWith({
      session_hash: "abc123",
      theme: "ai",
      page: "/",
      has_context: true,
    });
  });

  it("nulls out optional fields when not provided", async () => {
    const { insert } = mockInsert(async () => ({}));
    await logAiEvent({ sessionHash: "h", theme: "other" });
    expect(insert).toHaveBeenCalledWith({
      session_hash: "h",
      theme: "other",
      page: null,
      has_context: null,
    });
  });

  it("swallows errors so analytics never breaks the request path", async () => {
    mockInsert(async () => {
      throw new Error("db down");
    });
    await expect(logAiEvent({ sessionHash: "h", theme: "other" })).resolves.toBeUndefined();
  });
});
