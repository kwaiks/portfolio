jest.mock("../supabase/admin", () => ({ getSupabaseAdmin: jest.fn() }));
jest.mock("../config", () => ({
  config: { resend: { apiKey: "resend-key", from: "from@x.com", contactEmail: "to@x.com" } },
}));
jest.mock("resend", () => ({ Resend: jest.fn() }));

import { submitContact } from "../contact";
import { getSupabaseAdmin } from "../supabase/admin";
import { Resend } from "resend";

const adminMock = getSupabaseAdmin as unknown as jest.Mock;
const ResendMock = Resend as unknown as jest.Mock;

function validInput(over: Record<string, unknown> = {}) {
  return { name: "Jane", email: "jane@x.com", message: "Hello there Alexander", ...over };
}

function mockPersist(error: unknown) {
  // Supabase insert resolves to an { error } object; mirroring that shape so
  // `const { error } = await insert(...)` destructures cleanly.
  const insert = jest.fn().mockResolvedValue({ error });
  const from = jest.fn().mockReturnValue({ insert });
  adminMock.mockReturnValue({ from });
}

function mockEmail(send: jest.Mock) {
  ResendMock.mockImplementation(() => ({ emails: { send } }));
}

beforeEach(() => jest.clearAllMocks());

describe("submitContact — validation", () => {
  it("rejects malformed input", async () => {
    const res = await submitContact({ name: "", email: "not-an-email", message: "x" });
    expect(res).toEqual({ ok: false, persisted: false, emailed: false, error: "invalid" });
  });

  it("rejects a filled honeypot (the schema's max(0) treats it as invalid)", async () => {
    const res = await submitContact(validInput({ website: "http://spam.example" }));
    expect(res.ok).toBe(false);
    expect(res.error).toBe("invalid");
    expect(adminMock).not.toHaveBeenCalled();
  });
});

describe("submitContact — persistence + email", () => {
  it("persists and emails on full success", async () => {
    mockPersist(null);
    const send = jest.fn().mockResolvedValue({});
    mockEmail(send);

    const res = await submitContact(validInput());
    expect(res).toEqual({ ok: true, persisted: true, emailed: true });
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0]).toMatchObject({ to: "to@x.com", replyTo: "jane@x.com" });
  });

  it("still reports ok when email fails but persistence succeeded", async () => {
    mockPersist(null);
    mockEmail(jest.fn().mockRejectedValue(new Error("resend down")));

    const res = await submitContact(validInput());
    expect(res).toEqual({ ok: true, persisted: true, emailed: false });
  });

  it("reports ok via email when persistence fails but email succeeds", async () => {
    mockPersist({ message: "db down" });
    mockEmail(jest.fn().mockResolvedValue({}));

    const res = await submitContact(validInput());
    expect(res).toEqual({ ok: true, persisted: false, emailed: true });
  });

  it("returns server_error when both persistence and email fail", async () => {
    mockPersist({ message: "db down" });
    mockEmail(jest.fn().mockRejectedValue(new Error("down")));

    const res = await submitContact(validInput());
    expect(res).toEqual({ ok: false, persisted: false, emailed: false, error: "server_error" });
  });
});
