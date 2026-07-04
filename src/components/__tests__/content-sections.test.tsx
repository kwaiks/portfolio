import { render } from "@testing-library/react";
import { About } from "../About";
import { Experience } from "../Experience";
import { CaseStudies } from "../CaseStudies";
import { Stack } from "../Stack";
import { AiWriteup } from "../AiWriteup";
import { getExperiences, getProjects } from "@/lib/content";

describe("About", () => {
  it("renders the about + education content", () => {
    const { container } = render(<About />);
    expect(container.textContent!.length).toBeGreaterThan(0);
  });
});

describe("Experience", () => {
  it("renders one item per experience entry", () => {
    const { container } = render(<Experience />);
    expect(container.querySelectorAll("li")).toHaveLength(getExperiences().length);
  });
});

describe("CaseStudies", () => {
  it("renders one article per project", () => {
    const { container } = render(<CaseStudies />);
    expect(container.querySelectorAll("article")).toHaveLength(getProjects().length);
  });
});

describe("Stack", () => {
  it("renders the stack section", () => {
    const { container } = render(<Stack />);
    expect(container.textContent!.length).toBeGreaterThan(0);
  });
});

describe("AiWriteup", () => {
  it("renders the writeup card", () => {
    const { container } = render(<AiWriteup />);
    expect(container.querySelector("div")).not.toBeNull();
  });
});
