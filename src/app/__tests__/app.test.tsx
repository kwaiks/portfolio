jest.mock("next/font/google", () => ({
  Inter: () => ({ variable: "--font-sans" }),
  JetBrains_Mono: () => ({ variable: "--font-mono" }),
}));

import { render } from "@testing-library/react";
import RootLayout from "../layout";
import Home from "../page";

describe("RootLayout", () => {
  it("wraps children in the layout body", () => {
    const { container } = render(
      <RootLayout>
        <p>hello world</p>
      </RootLayout>,
    );
    // RTL mounts into a container <div>; <html>/<body> don't nest there, so
    // assert on the wrapped child rather than document.documentElement.
    expect(container.textContent).toContain("hello world");
  });
});

describe("Home page", () => {
  it("renders the hero and all the anchored sections", () => {
    const { container } = render(<Home />);
    expect(container.textContent).toContain("alexander jacquelline");
    // Section ids used by the nav anchors
    for (const id of ["about", "work", "projects", "stack", "ai", "contact"]) {
      expect(document.getElementById(id)).not.toBeNull();
    }
  });
});
