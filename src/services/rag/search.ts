import { db, documentChunks, documents } from "@/db";
import { sql, desc, eq } from "drizzle-orm";
import { generateEmbedding } from "./embeddings";

export interface SearchResult {
  content: string;
  documentId: string;
  filename: string;
  similarity: number;
  chunkIndex: number;
}

/**
 * Search for relevant document chunks using vector similarity
 */
export async function searchDocuments(
  query: string,
  limit: number = 5,
  minSimilarity: number = 0.7
): Promise<SearchResult[]> {
  // Generate embedding for query
  const queryEmbedding = await generateEmbedding(query);

  // Search using cosine similarity
  const results = await db
    .select({
      content: documentChunks.content,
      documentId: documentChunks.documentId,
      filename: documents.filename,
      chunkIndex: documentChunks.chunkIndex,
      similarity: sql<number>`1 - (${documentChunks.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector)`,
    })
    .from(documentChunks)
    .innerJoin(documents, eq(documentChunks.documentId, documents.id))
    .where(
      sql`1 - (${documentChunks.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector) > ${minSimilarity}`
    )
    .orderBy(
      desc(
        sql`1 - (${documentChunks.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector)`
      )
    )
    .limit(limit);

  return results;
}

/**
 * Build context string from search results
 */
export function buildContext(results: SearchResult[]): string {
  if (results.length === 0) {
    return "";
  }

  const contextParts = results.map(
    (r, i) =>
      `[Źródło ${i + 1}: ${r.filename}]\n${r.content}`
  );

  return `KONTEKST Z DOKUMENTÓW:\n\n${contextParts.join("\n\n---\n\n")}`;
}
