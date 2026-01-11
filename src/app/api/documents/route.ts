import { NextRequest, NextResponse } from "next/server";
import {
  processDocument,
  listDocuments,
  deleteDocument,
  DocumentType,
} from "@/services/rag";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST - Upload document
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const url = formData.get("url") as string | null;

    if (!file && !url) {
      return NextResponse.json(
        { success: false, error: "File or URL required" },
        { status: 400 }
      );
    }

    let result;

    if (url) {
      // Process URL
      result = await processDocument(url, "url", url);
    } else if (file) {
      // Process file
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileType = file.name.endsWith(".pdf") ? "pdf" : "txt";
      result = await processDocument(
        file.name,
        fileType as DocumentType,
        buffer
      );
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Document upload error:", error);
    const message =
      error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// GET - List documents
export async function GET() {
  try {
    const docs = await listDocuments();
    return NextResponse.json({ success: true, documents: docs });
  } catch (error) {
    console.error("List documents error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to list documents" },
      { status: 500 }
    );
  }
}

// DELETE - Delete document
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("documentId");

    if (!documentId) {
      return NextResponse.json(
        { success: false, error: "documentId required" },
        { status: 400 }
      );
    }

    await deleteDocument(documentId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete document error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
