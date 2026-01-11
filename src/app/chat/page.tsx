"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Loader2,
  Search,
  Database,
  Plus,
  Trash2,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [useGrounding, setUseGrounding] = useState(true);
  const [useRAG, setUseRAG] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversations = async () => {
    try {
      const res = await fetch("/api/chat");
      const data = await res.json();
      if (data.success) {
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error("Failed to load conversations", error);
    }
  };

  const loadConversation = async (convId: string) => {
    try {
      const res = await fetch(`/api/chat?conversationId=${convId}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages || []);
        setConversationId(convId);
      }
    } catch (error) {
      toast.error("Nie udało się załadować rozmowy");
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    setConversationId(null);
  };

  const deleteConversation = async (convId: string) => {
    try {
      await fetch(`/api/chat?conversationId=${convId}`, { method: "DELETE" });
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (conversationId === convId) {
        startNewConversation();
      }
      toast.success("Rozmowa usunięta");
    } catch (error) {
      toast.error("Nie udało się usunąć rozmowy");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          conversationId,
          useGrounding,
          useRAG,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Chat failed");
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.content },
      ]);
      setConversationId(data.conversationId);

      // Refresh conversations list
      loadConversations();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Wystąpił błąd"
      );
      setMessages((prev) => prev.slice(0, -1)); // Remove user message on error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-4">
          <button
            onClick={startNewConversation}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nowa rozmowa
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={cn(
                "flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-slate-50 border-b border-slate-100",
                conversationId === conv.id && "bg-blue-50"
              )}
              onClick={() => loadConversation(conv.id)}
            >
              <MessageSquare className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="flex-1 truncate text-sm text-slate-700">
                {conv.title || "Rozmowa"}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConversation(conv.id);
                }}
                className="p-1 hover:bg-slate-200 rounded opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-3 h-3 text-slate-400" />
              </button>
            </div>
          ))}
        </div>

        {/* Options */}
        <div className="p-4 border-t border-slate-200 space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={useGrounding}
              onChange={(e) => setUseGrounding(e.target.checked)}
              className="rounded"
            />
            <Search className="w-4 h-4 text-slate-500" />
            <span className="text-slate-600">Google Search</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={useRAG}
              onChange={(e) => setUseRAG(e.target.checked)}
              className="rounded"
            />
            <Database className="w-4 h-4 text-slate-500" />
            <span className="text-slate-600">Moje dokumenty</span>
          </label>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <MessageSquare className="w-16 h-16 mb-4" />
              <p className="text-lg">Rozpocznij rozmowę</p>
              <p className="text-sm mt-2">
                AI może szukać w Google i Twoich dokumentach
              </p>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "flex",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[70%] rounded-2xl px-4 py-3",
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-slate-200 text-slate-700"
                )}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-slate-200">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Napisz wiadomość..."
              className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white px-6 py-3 rounded-xl transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
