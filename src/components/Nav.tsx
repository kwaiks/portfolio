"use client";

import { useEffect, useState } from "react";

const LINKS = [
  { href: "#about", label: "about", id: "about" },
  { href: "#work", label: "experience", id: "work" },
  { href: "#projects", label: "work", id: "projects" },
  { href: "#stack", label: "stack", id: "stack" },
  { href: "#ai", label: "how-AI-works", id: "ai" },
  { href: "#contact", label: "contact", id: "contact" },
];

export function Nav() {
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const sections = LINKS.map((l) => document.getElementById(l.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (!sections.length) return;

    // Treat a thin band near the top as the "active" line; the section
    // crossing it is the one the reader is looking at.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur">
      <nav className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
        <a href="#top" className="font-mono text-sm">
          <span className="text-emerald-400">kwaiks</span>
        </a>
        <div className="hidden items-center gap-5 sm:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={
                active === l.id
                  ? "font-mono text-xs text-emerald-400"
                  : "font-mono text-xs text-zinc-400 transition-colors hover:text-emerald-400"
              }
            >
              {l.label}
            </a>
          ))}
        </div>
        <a
          href="/Alexander_Jacquelline_CV_v3.pdf"
          className="font-mono text-xs text-zinc-300 transition-colors hover:text-emerald-400"
        >
          resume ↗
        </a>
      </nav>
    </header>
  );
}
