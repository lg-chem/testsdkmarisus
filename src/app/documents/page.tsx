"use client";

import { useState, useEffect } from "react";
import {
  Upload,
  FileText,
  Link as LinkIcon,
  Trash2,
  Loader2,
  File,
  Globe,
} from "lucide-react";
import { toast } from "sonner";

interface Document {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [activeTab, setActiveTab] = useState<"file" | "url">("file");

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      if (data.success) {
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error("Failed to load documents", error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const allowedTypes = [".pdf", ".txt"];
    const ext = file.name.substring(file.name.lastIndexOf("."));
    if (!allowedTypes.includes(ext)) {
      toast.error("Dozwolone formaty: PDF, TXT");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      toast.success(
        `Dokument przetworzony! Utworzono ${data.chunksCount} fragmentów.`
      );
      loadDocuments();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Błąd podczas uploadu"
      );
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    // Validate URL
    try {
      new URL(urlInput);
    } catch {
      toast.error("Nieprawidłowy URL");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("url", urlInput);

    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to process URL");
      }

      toast.success(
        `Strona przetworzona! Utworzono ${data.chunksCount} fragmentów.`
      );
      setUrlInput("");
      loadDocuments();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Błąd podczas przetwarzania URL"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm("Czy na pewno chcesz usunąć ten dokument?")) return;

    try {
      await fetch(`/api/documents?documentId=${documentId}`, {
        method: "DELETE",
      });
      setDocuments((prev) => prev.filter((d) => d.id !== documentId));
      toast.success("Dokument usunięty");
    } catch (error) {
      toast.error("Nie udało się usunąć dokumentu");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (fileType: string) => {
    if (fileType === "url") return Globe;
    return File;
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-slate-800 mb-2">
        Baza Dokumentów
      </h1>
      <p className="text-slate-600 mb-8">
        Wgraj dokumenty, z których AI będzie korzystać podczas rozmów (RAG)
      </p>

      {/* Upload section */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("file")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "file"
                ? "bg-blue-100 text-blue-700"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Upload className="w-4 h-4" />
            Plik
          </button>
          <button
            onClick={() => setActiveTab("url")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "url"
                ? "bg-blue-100 text-blue-700"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            URL
          </button>
        </div>

        {activeTab === "file" ? (
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center">
            <input
              type="file"
              accept=".pdf,.txt"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
              disabled={isUploading}
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              {isUploading ? (
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
              ) : (
                <FileText className="w-12 h-12 text-slate-400 mb-4" />
              )}
              <p className="text-slate-600 font-medium">
                {isUploading
                  ? "Przetwarzanie..."
                  : "Kliknij aby wybrać plik"}
              </p>
              <p className="text-sm text-slate-400 mt-2">
                PDF lub TXT, max 10MB
              </p>
            </label>
          </div>
        ) : (
          <form onSubmit={handleUrlSubmit} className="flex gap-3">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/article"
              className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isUploading}
            />
            <button
              type="submit"
              disabled={isUploading || !urlInput.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              {isUploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Globe className="w-5 h-5" />
                  Pobierz
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Documents list */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">
            Dokumenty ({documents.length})
          </h2>
        </div>

        {documents.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-4" />
            <p>Brak dokumentów</p>
            <p className="text-sm mt-1">Wgraj pierwszy dokument powyżej</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {documents.map((doc) => {
              const Icon = getFileIcon(doc.fileType);
              return (
                <div
                  key={doc.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50"
                >
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate">
                      {doc.filename}
                    </p>
                    <p className="text-sm text-slate-400">
                      {doc.fileType.toUpperCase()} •{" "}
                      {formatFileSize(doc.fileSize || 0)} •{" "}
                      {new Date(doc.createdAt).toLocaleDateString("pl-PL")}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
