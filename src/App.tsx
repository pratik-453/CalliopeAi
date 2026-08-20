import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import PoemInput from "./components/PoemInput";
import PoemViewer from "./components/PoemViewer";
import TranslationTabs from "./components/TranslationTabs";
import PoemAnalysisDetails from "./components/PoemAnalysisDetails";
import PoemChat from "./components/PoemChat";
import { PoemAnalysis, ChatMessage } from "./types";
import { 
  History, Sparkles, Feather, HelpCircle, 
  ArrowLeft, RefreshCw, AlertCircle, Heart 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const LOADING_STATUSES = [
  "Dividing meter and stanza layouts...",
  "Calibrating parallel translation pathways...",
  "Running semantic subtext analysis on each line...",
  "Extracting overarching themes and emotional cues...",
  "Cataloging metaphors, alliterative forms, and enjambments...",
  "Preparing your interactive literary guide..."
];

export default function App() {
  const [poemText, setPoemText] = useState("");
  const [analysis, setAnalysis] = useState<PoemAnalysis | null>(null);
  const [selectedLineIndex, setSelectedLineIndex] = useState(0);
  const [activeLanguage, setActiveLanguage] = useState("none"); // none or iso-code
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatusIndex, setLoadingStatusIndex] = useState(0);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cycle loading messages for standard delight
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingStatusIndex((prev) => (prev + 1) % LOADING_STATUSES.length);
      }, 3000);
    } else {
      setLoadingStatusIndex(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // Main Poem Analysis trigger
  const handleAnalyze = async (text: string) => {
    setIsLoading(true);
    setAnalysis(null);
    setError(null);
    setActiveLanguage("none");
    setChatMessages([]);

    try {
      const response = await fetch("/api/analyze-poem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poemText: text }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to analyze poem.");
      }

      const report: PoemAnalysis = await response.json();
      setAnalysis(report);
      setPoemText(text);
      setSelectedLineIndex(0);

      // Seed welcoming chat tutor message
      const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setChatMessages([
        {
          id: "welcome",
          role: "model",
          text: `Welcome to the study of "${report.title}" by ${report.author || "this expressive poet"}.\n\nI have finished cataloging all poetic devices, generating translations, and decoding line-by-line intent.\n\nType any query or click on the suggestions below to begin discussing the poem!`,
          timestamp: timeString,
        },
      ]);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "An unexpected network or model error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  // Conversational Tutor trigger
  const handleSendMessage = async (text: string) => {
    if (!analysis) return;

    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      text: text,
      timestamp: userTime,
    };

    // Update conversation log local state first
    setChatMessages((prev) => [...prev, userMsg]);
    setIsChatLoading(true);

    try {
      const historyPayload = chatMessages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          poemText: poemText,
          currentAnalysis: analysis,
          message: text,
          history: historyPayload,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Communication failure.");
      }

      const data = await res.json();
      const modelTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      setChatMessages((prev) => [
        ...prev,
        {
          id: `mod-${Date.now()}`,
          role: "model",
          text: data.text,
          timestamp: modelTime,
        },
      ]);
    } catch (err: any) {
      console.error(err);
      const errTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setChatMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "model",
          text: `Apologies, traveler. I hit a small snag retrieving this analysis: ${err.message || "Network Timeout"}. Let's try rephrasing your literary query.`,
          timestamp: errTime,
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Back to input state
  const handleResetWorkspace = () => {
    setAnalysis(null);
    setPoemText("");
    setError(null);
    setChatMessages([]);
  };

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-stone-200 overflow-x-hidden selection:bg-amber-500/25 selection:text-amber-200">
      {/* Background radial art */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="ambient-glow-1 absolute -left-20 -top-20 h-[600px] w-[600px] rounded-full bg-amber-500/5 mix-blend-screen blur-[120px]"></div>
        <div className="ambient-glow-2 absolute right-0 top-1/4 h-[500px] w-[500px] rounded-full bg-stone-500/5 mix-blend-screen blur-[120px]"></div>
      </div>

      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Error Banner */}
        {error && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded border border-rose-900/80 bg-rose-950/20 p-4 text-xs font-mono uppercase tracking-wider text-rose-300 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0" />
              <p className="leading-relaxed">
                <span className="font-semibold text-rose-200">Notice:</span> {error}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {poemText && !isLoading && (
                <button
                  onClick={() => handleAnalyze(poemText)}
                  className="rounded bg-amber-500/10 px-3 py-1.5 text-[10px] font-bold border border-amber-500/30 text-amber-200 hover:bg-amber-500/20 transition-colors uppercase cursor-pointer"
                >
                  Retry Analysis
                </button>
              )}
              <button 
                onClick={() => setError(null)}
                className="rounded bg-rose-950/30 px-2.5 py-1.5 text-[10px] border border-rose-800/60 hover:text-white transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* STATE 1: Analyzing Poetry Loading Deck */}
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex min-h-[450px] flex-col items-center justify-center text-center p-8 space-y-6"
            >
              <div className="relative">
                {/* Visual ripple */}
                <div className="absolute inset-0 h-16 w-16 animate-ping rounded-full bg-amber-500/5 blur-sm"></div>
                <div className="relative flex h-16 w-16 items-center justify-center rounded bg-[#141414] border border-stone-800 text-amber-200 shadow-xl">
                  <Feather className="h-6 w-6 animate-bounce text-amber-200" />
                </div>
              </div>

              <div className="space-y-3.5 max-w-md">
                <h3 className="font-serif text-xl font-light italic text-stone-100">
                  Consulting Calliope AI Muse...
                </h3>
                <p className="text-[10px] font-mono text-amber-300 animate-pulse tracking-widest uppercase">
                  {LOADING_STATUSES[loadingStatusIndex]}
                </p>
                <p className="text-[11px] text-stone-500 max-w-xs mx-auto pt-3 uppercase tracking-wider leading-relaxed">
                  Deciphering historical meters, identifying allegorical forms, plotting emotional shifts, and verifying multi-language alignments.
                </p>
              </div>
            </motion.div>
          )

          /* STATE 2: Empty State landing dashboard (Form Input) */
          : !analysis ? (
            <motion.div
              key="input-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start"
            >
              {/* Form Input Frame */}
              <div className="lg:col-span-8">
                <PoemInput onAnalyze={handleAnalyze} isLoading={isLoading} />
              </div>

              {/* Sidebar Educational Highlights */}
              <div className="lg:col-span-4 space-y-6">
                <div className="rounded-xl border border-stone-800 bg-[#0d0d0d] p-6 shadow-2xl space-y-5">
                  <h3 className="font-serif text-lg font-light italic text-stone-200">
                    Explore Literary Frontiers
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[#141414] border border-stone-800 text-amber-200">
                        <Feather className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-mono font-semibold text-stone-300 uppercase tracking-widest">Subtextual Insights</h4>
                        <p className="text-[11px] text-stone-400 mt-0.5 leading-relaxed">
                          Unveil the poet's underlying motives, thematic signs, and structural choices phrase by phrase.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[#141414] border border-stone-800 text-stone-450">
                        <Sparkles className="h-3.5 w-3.5 text-stone-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-mono font-semibold text-stone-300 uppercase tracking-widest">Parallel Translation</h4>
                        <p className="text-[11px] text-stone-400 mt-0.5 leading-relaxed">
                          Translate lyrics simultaneously into Spanish, French, German, Japanese, Hindi, or Mandarin, aligned line-for-line.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[#141414] border border-stone-800 text-stone-450">
                        <History className="h-3.5 w-3.5 text-stone-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-mono font-semibold text-stone-300 uppercase tracking-widest">Poetics Glossary</h4>
                        <p className="text-[11px] text-stone-400 mt-0.5 leading-relaxed">
                          Deep definitions and direct textual quotes for every figure of speech detected in the work.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[#141414] border border-stone-800 text-stone-450">
                        <HelpCircle className="h-3.5 w-3.5 text-stone-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-mono font-semibold text-stone-300 uppercase tracking-widest">Consulting Q&A</h4>
                        <p className="text-[11px] text-stone-400 mt-0.5 leading-relaxed">
                          An interactive, scholarly companion to answer specific custom questions on structural rhyme, contextual history, or meter.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Micro Footer Citation */}
                <div className="text-center pt-2">
                  <p className="text-[9px] text-stone-600 flex items-center justify-center gap-1.5 font-mono uppercase tracking-widest">
                    Crafted with <Heart className="h-3 w-3 text-stone-700 animate-pulse fill-current" /> by Deep Learning Scholars
                  </p>
                </div>
              </div>
            </motion.div>
          )

          /* STATE 3: Poem Report Analysis Workspace */
          : (
            <motion.div
              key="analysis-workspace"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* Back out Controller action */}
              <div className="flex items-center justify-between bg-[#0d0d0d] border border-stone-800 p-4 rounded-xl shadow-lg">
                <button
                  onClick={handleResetWorkspace}
                  className="flex items-center gap-1.5 rounded-sm bg-[#141414] px-4 py-2 text-[10px] font-mono tracking-widest uppercase text-stone-300 hover:text-stone-100 border border-stone-800 hover:border-stone-700 transition-all cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Different Poem
                </button>

                <div className="flex items-center gap-2 text-xs text-stone-400">
                  <span className="font-mono text-[9px] font-medium text-stone-500 uppercase tracking-widest hidden sm:inline">
                    Currently Viewing:
                  </span>
                  <strong className="text-amber-205 font-serif italic text-amber-200 font-semibold sm:max-w-xs max-w-[120px] truncate">
                    {analysis.title}
                  </strong>
                </div>
              </div>

              {/* Parallel Translation Toolbar block */}
              <TranslationTabs
                translations={analysis.translations}
                activeLanguage={activeLanguage}
                onChangeLanguage={setActiveLanguage}
              />

              {/* SECTION A: Poetry Theater & Line insights sidebar */}
              <PoemViewer
                analysis={analysis}
                selectedLineIndex={selectedLineIndex}
                onSelectLine={setSelectedLineIndex}
                activeLanguage={activeLanguage}
              />

              {/* SECTION B: Conversational Q&A & General Reports */}
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start mt-8">
                {/* Overarching literary summaries */}
                <div className="lg:col-span-7">
                  <PoemAnalysisDetails analysis={analysis} />
                </div>

                {/* Contextual Chatbot */}
                <div className="lg:col-span-5 sticky top-20">
                  <PoemChat
                    poemText={poemText}
                    analysis={analysis}
                    messages={chatMessages}
                    onSendMessage={handleSendMessage}
                    isChatLoading={isChatLoading}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
