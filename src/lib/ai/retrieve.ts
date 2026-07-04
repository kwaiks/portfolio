import { getSupabaseAdmin } from "../supabase/admin";
import { embedText } from "./embed";

export type RetrievedChunk = {
  id: string;
  source: string;
  section: string;
  content: string;
  metadata: Record<string, unknown>;
  rrf_score: number;
  semantic_distance: number | null;
  keyword_rank: number | null;
};

export type RetrievalResult = {
  chunks: RetrievedChunk[];
  hasContext: boolean;
};

/**
 * Cosine-distance cutoff below which a chunk is considered relevant.
 * Loosened to 0.60 to cut false refusals on borderline / broad questions; the
 * model still self-limits via "answer only from context". Tunable.
 */
const SEMANTIC_THRESHOLD = 0.6;

export async function retrieve(
  query: string,
  matchCount = 8,
): Promise<RetrievalResult> {
  const embedding = await embedText(query);

  const { data, error } = await getSupabaseAdmin().rpc("match_documents_hybrid", {
    p_query_text: query,
    p_query_embedding: embedding,
    p_k: 20,
    p_match_count: matchCount,
  });

  if (error) throw new Error(`Retrieval RPC failed: ${error.message}`);

  const chunks = (data ?? []) as RetrievedChunk[];

  // Relevance gate: relevant if the best chunk is semantically close OR a
  // strong exact-keyword hit exists. Otherwise we treat it as "no context"
  // and the assistant refuses instead of guessing.
  const best = chunks[0];
  const semanticClose =
    !!best &&
    best.semantic_distance != null &&
    best.semantic_distance <= SEMANTIC_THRESHOLD;
  const keywordHit = chunks.some(
    (c) => c.keyword_rank != null && c.keyword_rank <= 3,
  );
  const hasContext = semanticClose || keywordHit;

  return { chunks, hasContext };
}
