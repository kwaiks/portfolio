import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export type ContentEntry = {
  slug: string;
  type: string;
  /** Relative file path under content/, e.g. "experience/wilopo-cargo". */
  source: string;
  /** Parsed frontmatter. */
  data: Record<string, unknown>;
  /** Markdown body (without frontmatter). */
  content: string;
};

const CONTENT_DIR = path.join(process.cwd(), "content");

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
    } else if (entry.isFile() && /\.(md|mdx)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

let _cache: ContentEntry[] | null = null;

export function loadAllContent(): ContentEntry[] {
  if (_cache) return _cache;
  const files = walk(CONTENT_DIR);
  const entries: ContentEntry[] = files.map((file) => {
    const raw = fs.readFileSync(file, "utf8");
    const { data, content } = matter(raw);
    const rel = path.relative(CONTENT_DIR, file).replace(/\\/g, "/");
    const slug = (data.slug as string) || rel.replace(/\.(md|mdx)$/, "");
    return {
      slug,
      type: (data.type as string) || "page",
      source: rel.replace(/\.(md|mdx)$/, ""),
      data: data as Record<string, unknown>,
      content: content.trim(),
    };
  });
  _cache = entries;
  return entries;
}

export function getByType(type: string): ContentEntry[] {
  return loadAllContent().filter((e) => e.type === type);
}

const byOrder = (a: ContentEntry, b: ContentEntry) =>
  ((a.data.order as number) ?? 99) - ((b.data.order as number) ?? 99);

export function getExperiences(): ContentEntry[] {
  return getByType("experience").sort(byOrder);
}
export function getProjects(): ContentEntry[] {
  return getByType("project").sort(byOrder);
}
export function getOne(type: string): ContentEntry | undefined {
  return getByType(type)[0];
}
export function getAbout() {
  return getOne("about");
}
export function getStack() {
  return getOne("stack");
}
export function getAiWriteup() {
  return getOne("page"); // ai-writeup.md is type: page
}
export function getEducation() {
  return getOne("education");
}
