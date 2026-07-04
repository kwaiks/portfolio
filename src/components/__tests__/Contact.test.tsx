import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Contact } from "../Contact";

type User = ReturnType<typeof userEvent.setup>;

// Single fetch mock, reset and (re)installed before every test so no state
// leaks between cases and we never hit jsdom's non-existent network.
const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});

function res(body: unknown, ok = true): Response {
  return { ok, json: async () => body } as unknown as Response;
}

async function fillAndSubmit(user: User) {
  await user.type(screen.getByLabelText(/^name$/i), "John Doe");
  await user.type(screen.getByLabelText(/email/i), "john@company.com");
  await user.type(screen.getByLabelText(/message/i), "Hello Alexander — great portfolio.");
  await user.click(screen.getByRole("button", { name: /send message/i }));
}

describe("Contact", () => {
  it("shows the success state when the API accepts the submission", async () => {
    fetchMock.mockResolvedValue(res({ ok: true }));
    const user = userEvent.setup();
    render(<Contact />);
    await fillAndSubmit(user);

    await waitFor(() => expect(screen.getByText("// message sent")).toBeInTheDocument());
  });

  it("shows an error message when the API rejects the submission", async () => {
    fetchMock.mockResolvedValue(res({ ok: false }, false));
    const user = userEvent.setup();
    render(<Contact />);
    await fillAndSubmit(user);

    await waitFor(() => expect(screen.getByText(/something went wrong/i)).toBeInTheDocument());
  });

  it("shows a network error when fetch throws", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));
    const user = userEvent.setup();
    render(<Contact />);
    await fillAndSubmit(user);

    await waitFor(() => expect(screen.getByText(/network error/i)).toBeInTheDocument());
  });

  it("can reset from success back to the form", async () => {
    fetchMock.mockResolvedValue(res({ ok: true }));
    const user = userEvent.setup();
    render(<Contact />);
    await fillAndSubmit(user);
    expect(await screen.findByText("// message sent")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /send another/i }));
    expect(screen.queryByText("// message sent")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send message/i })).toBeInTheDocument();
  });
});
