import * as React from "react";

/**
 * Jest stub for `react-markdown` (v9 is ESM-only and won't load under Jest's
 * CommonJS). Renders the markdown source as-is so component tests can assert on
 * the text content. Also mapped to `remark-gfm`: its default export is unused
 * once react-markdown itself is stubbed, so a single file covers both.
 */
function ReactMarkdown({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

export default ReactMarkdown;
