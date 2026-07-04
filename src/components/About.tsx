import { getAbout, getEducation } from "@/lib/content";
import { Markdown, stripLeadingH1 } from "./Markdown";

export function About() {
  const about = getAbout();
  const education = getEducation();
  if (!about) return null;

  return (
    <div className="space-y-6">
      <Markdown>{stripLeadingH1(about.content)}</Markdown>
      {education && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
          <p className="font-mono text-xs text-emerald-400">{`// education`}</p>
          <Markdown className="mt-2">{stripLeadingH1(education.content)}</Markdown>
        </div>
      )}
    </div>
  );
}
