import React, { useState, useRef, useEffect } from "react";
import { ChatMessage, PoemAnalysis } from "../types";
import { Send, Sparkles, User, HelpCircle, CornerDownLeft } from "lucide-react";

interface PoemChatProps {
  poemText: string;
  analysis: PoemAnalysis | null;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isChatLoading: boolean;
}

export const CHAT_CUES = [
  "What is the overarching tone or mood of this poem?",
  "How does the poet use symbolism/allegory here?",
  "Analyze the emotional shift or structure of the stanzas.",
  "What is the deeper historical/biographical context of this poem?"
];

export default function PoemChat({
  poemText,
  analysis,
  messages,
  onSendMessage,
  isChatLoading,
}: PoemChatProps) {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isChatLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !isChatLoading) {
      onSendMessage(inputText.trim());
      setInputText("");
    }
  };

  const handleCueClick = (cue: string) => {
    if (!isChatLoading) {
      onSendMessage(cue);
    }
  };

  return (
    <div className="rounded-xl border border-stone-800 bg-[#0d0d0d] flex flex-col h-[520px] shadow-2xl relative overflow-hidden">
      {/* Panel Header */}
      <div className="p-4 border-b border-stone-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-amber-200" />
          <span className="text-xs font-bold uppercase tracking-widest text-[#e7e5e4]">
            Ask the Muse
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="font-mono text-[9px] text-stone-500 uppercase tracking-widest">
            Scholar Connected
          </span>
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs scroll-smooth">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-4">
            <div className="h-10 w-10 flex items-center justify-center rounded bg-[#141414] border border-stone-800 text-amber-200">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div className="max-w-xs">
              <h4 className="font-serif italic text-stone-200 text-sm">The Muse is Attuned</h4>
              <p className="text-[11px] text-stone-500 mt-1.5 leading-relaxed">
                Initialize a poetic analysis above, and then consult the Muse about classical metrics, allegories, historical moods, or structures.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${
                  isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                {/* Avatar Icon */}
                <div
                  className={`h-7 w-7 flex-shrink-0 flex items-center justify-center rounded border ${
                    isUser
                      ? "bg-stone-900 border-stone-850 text-stone-400"
                      : "bg-[#141414] border-stone-800 text-amber-200"
                  }`}
                >
                  {isUser ? <User className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`rounded-lg px-3.5 py-2.5 leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? "bg-stone-800 border border-stone-700/40 text-stone-200 rounded-tr-none"
                      : "bg-[#1a1a1a] border border-stone-800/80 text-stone-400 rounded-tl-none"
                  }`}
                >
                  <p className="text-[11px] select-text font-sans">{msg.text}</p>
                  <span className={`block text-[8px] mt-1 text-right ${
                    isUser ? "text-stone-400" : "text-stone-600 font-mono"
                  }`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })
        )}

        {/* Loading Bubble */}
        {isChatLoading && (
          <div className="flex gap-3 max-w-[80%] mr-auto items-center">
            <div className="h-7 w-7 flex-shrink-0 flex items-center justify-center rounded bg-[#141414] border border-stone-800 text-amber-200 animate-pulse">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <div className="bg-[#1a1a1a] border border-stone-800 rounded-lg rounded-tl-none px-3.5 py-2.5 flex items-center gap-2">
              <div className="flex gap-1">
                <div className="h-1 w-1 bg-stone-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="h-1 w-1 bg-stone-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="h-1 w-1 bg-stone-500 rounded-full animate-bounce"></div>
              </div>
              <span className="text-[10px] text-stone-500 font-mono select-none">Synthesizing...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Topic Chips */}
      {analysis && messages.length < 5 && (
        <div className="px-4 pb-3 space-y-1.5">
          <span className="text-[9px] font-mono text-stone-600 uppercase tracking-widest block pl-1">
            Inquire about
          </span>
          <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto pr-1">
            {CHAT_CUES.map((cue, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleCueClick(cue)}
                disabled={isChatLoading}
                className="text-left text-[10px] px-2.5 py-1.5 rounded bg-[#141414] hover:bg-[#1c1c1c] text-stone-400 hover:text-stone-200 border border-stone-800 hover:border-stone-700 transition-all cursor-pointer truncate max-w-full"
              >
                {cue}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message Input Bar */}
      <form onSubmit={handleSubmit} className="p-3 bg-black/30 border-t border-stone-850 mt-auto">
        <div className="relative">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isChatLoading || !analysis}
            placeholder={
              analysis 
                ? "Ask about themes, rhyme, or tone..." 
                : "Analyze a manuscript to trigger chat..."
            }
            className="w-full bg-stone-900 border border-stone-800 focus:border-amber-900 focus:outline-[#00000000] focus:outline-none rounded-lg py-2 ml-0 pl-3 pr-10 text-[11px] text-stone-300 placeholder:text-stone-600 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isChatLoading || !analysis}
            className={`absolute right-2 top-1.5 transition-all ${
              inputText.trim() && !isChatLoading && analysis
                ? "text-amber-200 hover:text-white cursor-pointer"
                : "text-stone-600 pointer-events-none"
            }`}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-1 flex items-center justify-between text-[8px] font-mono text-stone-600 pl-1">
          <span>* Deciphered answers guided by Gemini</span>
          <span className="hidden sm:inline">Press Enter to dispatch</span>
        </div>
      </form>
    </div>
  );
}
