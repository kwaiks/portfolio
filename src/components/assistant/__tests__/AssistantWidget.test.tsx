import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AssistantWidget } from "../AssistantWidget";

function streamBody(chunks: string[]): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      for (const c of chunks) controller.enqueue(new TextEncoder().encode(c));
      controller.close();
    },
  });
}

function mockChatStream(chunks: string[]) {
  global.fetch = jest
    .fn()
    .mockResolvedValue({ ok: true, body: streamBody(chunks) }) as unknown as typeof fetch;
}

beforeEach(() => {
  jest.restoreAllMocks();
  localStorage.clear();
  // jsdom may not expose crypto.randomUUID; ensure it does.
  if (!global.crypto?.randomUUID) {
    Object.defineProperty(global, "crypto", {
      value: { ...global.crypto, randomUUID: () => "test-uuid" },
      configurable: true,
    });
  }
});

async function openAndSend(user: userEvent.UserEvent, text: string) {
  await user.click(screen.getByRole("button", { name: /open AI assistant/i }));
  await user.type(screen.getByPlaceholderText(/ask a question/i), text);
  await user.click(screen.getByRole("button", { name: "↵" }));
}

describe("AssistantWidget", () => {
  it("opens on launcher click and renders suggestions", async () => {
    const user = userEvent.setup();
    render(<AssistantWidget />);
    await user.click(screen.getByRole("button", { name: /open AI assistant/i }));
    expect(screen.getByText(/What AI system did you ship/i)).toBeInTheDocument();
  });

  it("streams the assistant reply into the panel", async () => {
    mockChatStream(["Alexander ", "shipped a RAG system."]);
    const user = userEvent.setup();
    render(<AssistantWidget />);
    await openAndSend(user, "what did you ship?");

    expect(await screen.findByText(/shipped a RAG system/i)).toBeInTheDocument();
  });

  it("shows a Contact button when the reply carries the [CONTACT_CTA] marker", async () => {
    mockChatStream(["Use the form below.\n", "[CONTACT_CTA]"]);
    const user = userEvent.setup();
    render(<AssistantWidget />);
    await openAndSend(user, "how do I reach you?");

    expect(await screen.findByRole("button", { name: /contact Alexander/i })).toBeInTheDocument();
  });

  it("opens the panel in response to the open-assistant window event", async () => {
    render(<AssistantWidget />);
    window.dispatchEvent(new Event("open-assistant"));
    expect(await screen.findByPlaceholderText(/ask a question/i)).toBeInTheDocument();
  });
});
