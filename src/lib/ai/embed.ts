import { config } from "../config";

const EMBED_MODEL = "text-embedding-3-small"; // 1536 dims

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (!texts.length) return [];
  if (!config.openai.apiKey) throw new Error("OPENAI_API_KEY is not set");

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.openai.apiKey}`,
    },
    body: JSON.stringify({ model: EMBED_MODEL, input: texts }),
  });

  if (!res.ok) {
    throw new Error(`Embeddings request failed (${res.status}): ${await res.text()}`);
  }
  const json = (await res.json()) as {
    data: { embedding: number[] }[];
  };
  // OpenAI returns data in input order, but sort by index to be safe.
  return json.data.map((d) => d.embedding);
}

export async function embedText(text: string): Promise<number[]> {
  const [vec] = await embedTexts([text]);
  if (!vec) throw new Error("Empty embedding response");
  return vec;
}
