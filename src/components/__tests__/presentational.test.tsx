import { render, screen, fireEvent } from "@testing-library/react";
import { Section } from "../Section";
import { Hero } from "../Hero";
import { Nav } from "../Nav";
import { Footer } from "../Footer";
import { AskAiButton } from "../AskAiButton";

describe("Section", () => {
  it("renders the label, title, id, and children", () => {
    render(
      <Section id="about" label="about" title="About">
        body text
      </Section>,
    );
    expect(screen.getByText("// about")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "About", level: 2 })).toBeInTheDocument();
    expect(screen.getByText("body text")).toBeInTheDocument();
    expect(document.getElementById("about")).not.toBeNull();
  });

  it("applies a custom className", () => {
    const { container } = render(
      <Section label="x" title="T">
        c
      </Section>,
    );
    expect(container.querySelector("section")?.className).toContain("scroll-mt-20");
  });
});

describe("Hero", () => {
  it("renders the name, headline, CTAs, and metrics", () => {
    render(<Hero />);
    expect(
      screen.getByRole("heading", { name: /alexander jacquelline/i, level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText("~73B IDR")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "contact" })).toHaveAttribute("href", "#contact");
    expect(screen.getByRole("button", { name: /ask the AI/i })).toBeInTheDocument();
  });
});

describe("Nav", () => {
  it("renders the anchor links and the resume link", () => {
    render(<Nav />);
    expect(screen.getByText("experience")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /resume/i })).toHaveAttribute(
      "href",
      "/Alexander_Jacquelline_CV_v3.pdf",
    );
  });
});

describe("Footer", () => {
  it("renders social links and the current year", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: "github" })).toHaveAttribute(
      "href",
      "https://github.com/kwaiks",
    );
    const year = new Date().getFullYear();
    expect(screen.getByText(new RegExp(String(year)))).toBeInTheDocument();
  });
});

describe("AskAiButton", () => {
  it("dispatches the open-assistant window event on click", () => {
    const handler = jest.fn();
    window.addEventListener("open-assistant", handler);
    render(<AskAiButton />);
    fireEvent.click(screen.getByRole("button", { name: /ask the AI/i }));
    expect(handler).toHaveBeenCalledTimes(1);
    window.removeEventListener("open-assistant", handler);
  });
});
