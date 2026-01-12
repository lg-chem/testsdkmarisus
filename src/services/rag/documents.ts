import { db, documents, documentChunks } from "@/db";
import { eq } from "drizzle-orm";
import { generateEmbedding, splitIntoChunks } from "./embeddings";
import * as cheerio from "cheerio";

// Dynamic import for pdf-parse to avoid DOMMatrix error in serverless
async function getPdfParse() {
  const { PDFParse } = await import("pdf-parse");
  return PDFParse;
}

export type DocumentType = "pdf" | "txt" | "url";

interface ProcessedDocument {
  documentId: string;
  chunksCount: number;
}

/**
 * Extract text from PDF buffer
 */
async function extractPdfText(buffer: Buffer): Promise<string> {
  const PDFParse = await getPdfParse();
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const textResult = await parser.getText();
  return textResult.text;
}

/**
 * Extract text from URL
 */
async function extractUrlText(url: string): Promise<string> {
  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);

  // Remove scripts, styles, nav, footer
  $("script, style, nav, footer, header, aside").remove();

  // Get main content
  const mainContent =
    $("main").text() || $("article").text() || $("body").text();

  return mainContent.replace(/\s+/g, " ").trim();
}

/**
 * Process and store a document with embeddings
 */
export async function processDocument(
  filename: string,
  fileType: DocumentType,
  content: Buffer | string
): Promise<ProcessedDocument> {
  let textContent: string;

  // Extract text based on file type
  switch (fileType) {
    case "pdf":
      textContent = await extractPdfText(content as Buffer);
      break;
    case "url":
      textContent = await extractUrlText(content as string);
      break;
    case "txt":
    default:
      textContent = content.toString();
  }

  // Store document
  const [doc] = await db
    .insert(documents)
    .values({
      filename,
      fileType,
      fileSize: Buffer.byteLength(content),
      content: textContent,
      metadata: { processedAt: new Date().toISOString() },
    })
    .returning();

  // Split into chunks
  const chunks = splitIntoChunks(textContent);

  // Generate embeddings and store chunks
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embedding = await generateEmbedding(chunk);

    await db.insert(documentChunks).values({
      documentId: doc.id,
      content: chunk,
      embedding,
      chunkIndex: i,
      metadata: { charCount: chunk.length },
    });
  }

  return {
    documentId: doc.id,
    chunksCount: chunks.length,
  };
}

/**
 * Delete a document and its chunks
 */
export async function deleteDocument(documentId: string): Promise<void> {
  await db.delete(documents).where(eq(documents.id, documentId));
}

/**
 * List all documents
 */
export async function listDocuments() {
  return db.select().from(documents).orderBy(documents.createdAt);
}
