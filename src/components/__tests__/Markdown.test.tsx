import { render } from "@testing-library/react";
import { Markdown, stripLeadingH1 } from "../Markdown";

describe("stripLeadingH1", () => {
  it("removes a single leading # heading", () => {
    expect(stripLeadingH1("# Title\nbody")).toBe("body");
  });

  it("leaves content unchanged when there is no leading h1", () => {
    expect(stripLeadingH1("body\nmore")).toBe("body\nmore");
  });

  it("only strips the first h1, leaving later ones intact", () => {
    expect(stripLeadingH1("# First\n## Keep\nbody")).toBe("## Keep\nbody");
  });

  it("returns empty when only a heading is present", () => {
    expect(stripLeadingH1("# Only")).toBe("");
  });
});

describe("Markdown component", () => {
  it("renders the markdown source into its container", () => {
    // react-markdown is stubbed (ESM-only under Jest) to render children verbatim,
    // so we assert the source string reaches the DOM and the wrapper applies.
    const { container } = render(<Markdown>{"# Hello\nworld"}</Markdown>);
    expect(container.textContent).toContain("# Hello");
    expect(container.textContent).toContain("world");
    expect(container.querySelector("div")).not.toBeNull();
  });

  it("honours a custom className", () => {
    const { container } = render(<Markdown className="my-cls">x</Markdown>);
    expect(container.querySelector("div")?.className).toContain("my-cls");
  });
});
