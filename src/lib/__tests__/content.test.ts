import {
  loadAllContent,
  getByType,
  getExperiences,
  getProjects,
  getAbout,
  getStack,
  getEducation,
  getAiWriteup,
} from "../content";

describe("content loaders", () => {
  it("loads every markdown entry with the expected shape", () => {
    const all = loadAllContent();
    expect(all.length).toBeGreaterThan(0);
    for (const e of all) {
      expect(typeof e.slug).toBe("string");
      expect(typeof e.source).toBe("string");
      expect(typeof e.content).toBe("string");
      expect(e.data).toBeInstanceOf(Object);
    }
  });

  it("filters by type", () => {
    const exp = getByType("experience");
    expect(exp.length).toBeGreaterThan(0);
    expect(exp.every((e) => e.type === "experience")).toBe(true);
  });

  it("getExperiences returns every experience entry, sorted by order", () => {
    const exp = getExperiences();
    expect(exp).toHaveLength(getByType("experience").length);
    expect(exp.every((e) => e.type === "experience")).toBe(true);
    const orders = exp.map((e) => (e.data.order as number) ?? 99);
    expect([...orders]).toEqual([...orders].sort((a, b) => a - b));
  });

  it("returns project entries", () => {
    expect(getProjects().length).toBeGreaterThan(0);
    expect(getProjects().every((p) => p.type === "project")).toBe(true);
  });

  it("resolves the singleton sections used by the page", () => {
    expect(getAbout()).toBeDefined();
    expect(getStack()).toBeDefined();
    expect(getEducation()).toBeDefined();
    expect(getAiWriteup()).toBeDefined();
    expect(getAbout()?.content.length).toBeGreaterThan(0);
  });
});
