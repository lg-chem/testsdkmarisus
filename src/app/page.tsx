"use client";

import { useState } from "react";
import { Bot, FileText, Sparkles, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Home() {
  const [knowledgeBase, setKnowledgeBase] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [strategy, setStrategy] = useState<string | null>(null);
  const [posts, setPosts] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<
    "idle" | "strategy" | "content" | "done"
  >("idle");

  const handleRunAgents = async () => {
    if (!knowledgeBase.trim()) {
      toast.error("Dodaj bazę wiedzy o kliencie/marce");
      return;
    }

    setIsProcessing(true);
    setCurrentStep("strategy");
    setStrategy(null);
    setPosts([]);

    try {
      // Step 1: Run Strategy Agent
      toast.info("Agent Strategii analizuje bazę wiedzy...");

      const strategyRes = await fetch("/api/agents/strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ knowledgeBase }),
      });

      if (!strategyRes.ok) {
        throw new Error("Strategy agent failed");
      }

      const strategyData = await strategyRes.json();
      setStrategy(strategyData.strategy);
      toast.success("Strategia gotowa!");

      // Step 2: Run Content Agent
      setCurrentStep("content");
      toast.info("Agent Contentu tworzy posty...");

      const contentRes = await fetch("/api/agents/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strategy: strategyData.strategy,
          knowledgeBase,
        }),
      });

      if (!contentRes.ok) {
        throw new Error("Content agent failed");
      }

      const contentData = await contentRes.json();
      setPosts(contentData.posts);
      setCurrentStep("done");
      toast.success("Posty gotowe!");
    } catch (error) {
      console.error(error);
      toast.error("Wystapil blad podczas przetwarzania");
      setCurrentStep("idle");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Bot className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-slate-800">
              Marketing AI Agents
            </h1>
          </div>
          <p className="text-slate-600 text-lg">
            Multi-agent system: Strategy Agent + Content Agent
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Input */}
          <div className="space-y-6">
            {/* Knowledge Base Input */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-slate-800">
                  Baza Wiedzy
                </h2>
              </div>
              <p className="text-sm text-slate-500 mb-4">
                Wklej informacje o kliencie, marce, produktach, grupie docelowej
                itp.
              </p>
              <textarea
                value={knowledgeBase}
                onChange={(e) => setKnowledgeBase(e.target.value)}
                placeholder="Np. Firma XYZ zajmuje się produkcja ekologicznych kosmetykow. Grupa docelowa to kobiety 25-45 lat, ktore dbaja o srodowisko. Glowne produkty: kremy, serum, olejki..."
                className="w-full h-64 p-4 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                disabled={isProcessing}
              />

              <button
                onClick={handleRunAgents}
                disabled={isProcessing || !knowledgeBase.trim()}
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Przetwarzanie...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Uruchom Agentow
                  </>
                )}
              </button>
            </div>

            {/* Agent Status */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-slate-800 mb-4">
                Status Agentow
              </h3>
              <div className="space-y-3">
                <div
                  className={`flex items-center gap-3 p-3 rounded-lg ${currentStep === "strategy" ? "bg-blue-50 border border-blue-200" : currentStep === "content" || currentStep === "done" ? "bg-green-50 border border-green-200" : "bg-slate-50"}`}
                >
                  <div
                    className={`w-3 h-3 rounded-full ${currentStep === "strategy" ? "bg-blue-500 animate-pulse" : currentStep === "content" || currentStep === "done" ? "bg-green-500" : "bg-slate-300"}`}
                  />
                  <span className="font-medium">Strategy Agent</span>
                  {currentStep === "strategy" && (
                    <span className="text-sm text-blue-600">
                      Analizuje...
                    </span>
                  )}
                  {(currentStep === "content" || currentStep === "done") && (
                    <span className="text-sm text-green-600">Gotowe</span>
                  )}
                </div>
                <div
                  className={`flex items-center gap-3 p-3 rounded-lg ${currentStep === "content" ? "bg-blue-50 border border-blue-200" : currentStep === "done" ? "bg-green-50 border border-green-200" : "bg-slate-50"}`}
                >
                  <div
                    className={`w-3 h-3 rounded-full ${currentStep === "content" ? "bg-blue-500 animate-pulse" : currentStep === "done" ? "bg-green-500" : "bg-slate-300"}`}
                  />
                  <span className="font-medium">Content Agent</span>
                  {currentStep === "content" && (
                    <span className="text-sm text-blue-600">
                      Tworzy posty...
                    </span>
                  )}
                  {currentStep === "done" && (
                    <span className="text-sm text-green-600">Gotowe</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Output */}
          <div className="space-y-6">
            {/* Strategy Output */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h2 className="text-xl font-semibold text-slate-800">
                  Strategia Marketingowa
                </h2>
              </div>
              {strategy ? (
                <div className="prose prose-sm max-w-none">
                  <div className="bg-purple-50 p-4 rounded-lg whitespace-pre-wrap text-slate-700">
                    {strategy}
                  </div>
                </div>
              ) : (
                <div className="text-slate-400 text-center py-8">
                  Strategia pojawi sie tutaj po uruchomieniu agentow
                </div>
              )}
            </div>

            {/* Posts Output */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-green-600" />
                <h2 className="text-xl font-semibold text-slate-800">
                  Wygenerowane Posty
                </h2>
              </div>
              {posts.length > 0 ? (
                <div className="space-y-4">
                  {posts.map((post, index) => (
                    <div
                      key={index}
                      className="bg-green-50 p-4 rounded-lg border border-green-100"
                    >
                      <div className="text-xs text-green-600 font-medium mb-2">
                        Post #{index + 1}
                      </div>
                      <p className="text-slate-700 whitespace-pre-wrap">
                        {post}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-400 text-center py-8">
                  Posty pojawia sie tutaj po zakonczeniu pracy agentow
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
