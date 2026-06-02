import React, { useState } from "react";
import { POEM_PRESETS, PoemPreset } from "../presets";
import { Sparkles, FileText, ChevronRight } from "lucide-react";

interface PoemInputProps {
  onAnalyze: (poemText: string) => void;
  isLoading: boolean;
}

export default function PoemInput({ onAnalyze, isLoading }: PoemInputProps) {
  const [poemText, setPoemText] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);

  const handlePresetSelect = (index: number) => {
    setSelectedPreset(index);
    setPoemText(POEM_PRESETS[index].text);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (poemText.trim().length > 0) {
      onAnalyze(poemText);
    }
  };

  return (
    <div className="rounded-xl border border-stone-800 bg-[#0d0d0d] p-6.5 sm:p-8 shadow-2xl relative overflow-hidden">
      {/* Ambient background accent */}
      <div className="absolute -top-16 -left-16 w-36 h-36 bg-amber-500/5 blur-3xl rounded-full pointer-events-none"></div>

      <div className="mb-6">
        <h2 className="font-display text-2xl font-light italic text-stone-100 flex items-center gap-2.5">
          <FileText className="h-5 w-5 text-amber-200" />
          Enter Your Manuscript
        </h2>
        <p className="mt-1.5 text-[13px] text-stone-400">
          Paste your poetry or lyrical draft to explore line-by-line subtextual insights, multi-language translation states, and poetic alignment reports.
        </p>
      </div>

      {/* Preset poem shortcuts */}
      <div className="mb-6">
        <label className="block text-[10px] font-mono text-stone-500 uppercase tracking-widest mb-2.5">
          Or load classical verse presets
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {POEM_PRESETS.map((preset, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handlePresetSelect(index)}
              className={`flex flex-col items-start px-3.5 py-2.5 rounded text-left border transition-all ${
                selectedPreset === index
                  ? "bg-amber-950/25 border-amber-800/40 text-amber-200"
                  : "bg-[#141414] border-stone-800 hover:border-stone-700 text-stone-400 hover:text-stone-200"
              }`}
            >
              <span className="font-display italic text-xs truncate w-full">
                {preset.title}
              </span>
              <span className="text-[9px] font-mono opacity-60 tracking-wider uppercase truncate w-full mt-1">
                {preset.author}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Poem input form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative rounded border border-stone-800 bg-black/40 focus-within:border-amber-800/60 focus-within:ring-1 focus-within:ring-amber-500/5 transition-all">
          <textarea
            id="poem-textarea"
            value={poemText}
            onChange={(e) => {
              setPoemText(e.target.value);
              setSelectedPreset(null);
            }}
            placeholder="Introduce your verses here..."
            rows={10}
            className="w-full resize-none bg-transparent px-4 py-3.5 text-sm font-display leading-relaxed text-stone-200 placeholder:text-stone-700 focus:outline-none"
            style={{ minHeight: "220px" }}
          />
          <div className="absolute bottom-2 right-3 text-[9px] font-mono text-stone-600">
            {poemText.split("\n").filter(Boolean).length} lines counted
          </div>
        </div>

        <button
          id="analyze-poem-button"
          type="submit"
          disabled={isLoading || poemText.trim().length === 0}
          className={`flex w-full items-center justify-center gap-2 rounded px-6 py-4 text-xs font-mono tracking-[0.2em] uppercase transition-all ${
            poemText.trim().length === 0
              ? "bg-stone-900 border border-stone-800 text-stone-600 cursor-not-allowed"
              : isLoading
              ? "bg-[#141414] border border-amber-800/20 text-amber-300/60 animate-pulse cursor-wait"
              : "bg-amber-200 text-stone-950 font-bold hover:bg-amber-100 hover:shadow-[0_0_20px_rgba(251,191,36,0.15)] hover:text-black cursor-pointer"
          }`}
        >
          {isLoading ? (
            <>
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
              Decoding structural meters...
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              Analyze Manuscript with AI
              <ChevronRight className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
