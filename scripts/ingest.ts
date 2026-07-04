import { createHash } from "node:crypto";
import "./_env";
import { loadAllContent, type ContentEntry } from "../src/lib/content";
import { embedTexts } from "../src/lib/ai/embed";
import { getSupabaseAdmin } from "../src/lib/supabase/admin";

function md5(s: string): string {
  return createHash("md5").update(s).digest("hex");
}

type Chunk = { section: string; content: string };

/** Split one content entry into heading-bounded chunks (~≤800 chars). */
function chunkEntry(entry: ContentEntry): Chunk[] {
  const MAX = 800;
  const lines = entry.content.split("\n");
  const chunks: Chunk[] = [];
  let heading = (entry.data.title as string) || entry.source;
  let buf: string[] = [];
  let bufLen = 0;

  const flush = () => {
    const text = buf.join("\n").trim();
    if (text) chunks.push({ section: heading, content: text });
    buf = [];
    bufLen = 0;
  };

  for (const line of lines) {
    if (/^#{1,6}\s+/.test(line)) {
      flush();
      heading = line.replace(/^#{1,6}\s+/, "").trim();
      continue;
    }
    if (line.trim() === "") {
      if (bufLen >= MAX) flush();
      else if (buf.length) buf.push("");
      continue;
    }
    buf.push(line);
    bufLen += line.length;
    if (bufLen >= MAX * 1.5) flush();
  }
  flush();
  return chunks;
}

async function main() {
  const all = loadAllContent();
  const entries = all.filter((e) => e.data.draft !== true);
  console.log(
    `Loaded ${all.length} content files (${entries.length} to embed${
      all.length - entries.length ? `, ${all.length - entries.length} draft skipped` : ""
    }).`,
  );

  type Pending = { entry: ContentEntry; idx: number; section: string; content: string };
  const pending: Pending[] = [];
  for (const entry of entries) {
    const parts = chunkEntry(entry);
    parts.forEach((p, idx) => pending.push({ entry, idx, section: p.section, content: p.content }));
  }
  console.log(`Produced ${pending.length} chunks. Embedding…`);

  const vectors: number[][] = [];
  const BATCH = 64;
  for (let i = 0; i < pending.length; i += BATCH) {
    const slice = pending.slice(i, i + BATCH);
    const v = await embedTexts(slice.map((c) => c.content));
    vectors.push(...v);
    console.log(`  embedded ${Math.min(i + BATCH, pending.length)}/${pending.length}`);
  }

  const rows = pending.map((c, i) => ({
    id: md5(`${c.entry.source}:${c.idx}`),
    source: c.entry.source,
    section: c.section,
    chunk_index: c.idx,
    content: c.content,
    metadata: {
      type: c.entry.type,
      slug: c.entry.slug,
      title: c.entry.data.title ?? null,
    },
    embedding: vectors[i],
  }));

  // Full refresh: clear stale chunks so renamed/edited/removed content no
  // longer lingers — the corpus stays an exact mirror of content/.
  const { error: delError } = await getSupabaseAdmin()
    .from("documents")
    .delete()
    .neq("source", "__none__"); // predicate matches all rows
  if (delError) throw new Error(`Clear failed: ${delError.message}`);
  console.log("Cleared existing documents.");

  const { error } = await getSupabaseAdmin()
    .from("documents")
    .upsert(rows, { onConflict: "id" });

  if (error) throw new Error(`Upsert failed: ${error.message}`);

  console.log(`✅ Upserted ${rows.length} chunks into documents.`);
  console.log(
    `Sources: ${[...new Set(rows.map((r) => r.source))].length} distinct files.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
