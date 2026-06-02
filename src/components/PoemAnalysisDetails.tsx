import React from "react";
import { PoemAnalysis } from "../types";
import { BookOpen, Compass, Award, Quote, Info } from "lucide-react";

interface PoemAnalysisDetailsProps {
  analysis: PoemAnalysis;
}

export default function PoemAnalysisDetails({ analysis }: PoemAnalysisDetailsProps) {
  return (
    <div className="space-y-8">
      {/* Title block & summary */}
      <div className="rounded-xl border border-stone-800 bg-[#0d0d0d] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Ambient background glow inside cards */}
        <div className="absolute -top-16 -left-16 w-48 h-48 bg-amber-500/5 blur-3xl rounded-full pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-stone-850 pb-5 mb-5 gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-light italic text-stone-100 tracking-wide">
              {analysis.title}
            </h1>
            <p className="font-sans text-[13px] text-stone-400 mt-1">
              By <strong className="text-amber-200 font-medium">{analysis.author}</strong> — Literary Blueprint Report
            </p>
          </div>
          <div className="bg-black/40 rounded px-4 py-2 border border-stone-850 self-start md:self-auto flex items-center gap-2">
            <BookOpen className="h-3.5 w-3.5 text-amber-200" />
            <span className="font-mono text-[10px] text-stone-400 uppercase tracking-widest">
              {analysis.lines.length} Verses Decoded
            </span>
          </div>
        </div>

        <div>
          <h3 className="text-[10px] font-mono text-stone-500 uppercase tracking-widest mb-2.5">
            Thematic Essence & Interpretation
          </h3>
          <p className="font-serif text-base text-stone-200 leading-relaxed italic bg-[#141414] p-4 rounded border border-stone-850">
            "{analysis.summary}"
          </p>
        </div>
      </div>

      {/* Grid of Themes & Imagery */}
      <div>
        <h2 className="font-serif text-lg font-light italic text-stone-100 mb-4 flex items-center gap-2.5">
          <Compass className="h-4.5 w-4.5 text-amber-200" />
          Themes & Metaphorical Portrayal
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {analysis.themes && analysis.themes.length > 0 ? (
            analysis.themes.map((theme, i) => (
              <div
                key={i}
                className="rounded-xl border border-stone-800 bg-[#0d0d0d] p-5 shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-stone-900 text-stone-300 border border-stone-800 text-[10px] font-mono">
                      {i + 1}
                    </span>
                    <h4 className="font-serif italic text-stone-200 text-sm">
                      {theme.theme}
                    </h4>
                  </div>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    {theme.explanation}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center py-6 text-stone-500 italic text-sm">
              No themes extracted for this poem.
            </div>
          )}
        </div>
      </div>

      {/* Overall Poetic Devices & Figures of Speech */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-lg font-light italic text-stone-100 flex items-center gap-2.5">
            <Award className="h-4.5 w-4.5 text-amber-200" />
            Poetic Devices & Structural Mechanics
          </h2>
          <span className="font-mono text-[9px] uppercase tracking-wider text-stone-500">
            {analysis.poeticDevicesOverall?.length || 0} structures detected
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {analysis.poeticDevicesOverall && analysis.poeticDevicesOverall.length > 0 ? (
            analysis.poeticDevicesOverall.map((d, i) => (
              <div
                key={i}
                className="rounded-xl border border-stone-800 bg-[#0d0d0d] p-5 hover:border-stone-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <span className="rounded bg-amber-950/20 border border-amber-900/30 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-amber-200 inline-block mb-3.5">
                    {d.device}
                  </span>
                  <h4 className="font-mono text-[10px] text-stone-500 uppercase tracking-widest mb-1">
                    definition
                  </h4>
                  <p className="text-xs text-stone-400 leading-relaxed mb-4">
                    {d.definition}
                  </p>
                </div>

                {d.example && (
                  <div className="border-t border-stone-900 pt-3 mt-2">
                    <span className="text-[9px] font-mono text-stone-600 block uppercase mb-1 flex items-center gap-1">
                      <Quote className="h-2.5 w-2.5" /> Found In Text
                    </span>
                    <p className="text-xs text-amber-200/90 italic font-serif leading-relaxed">
                      "{d.example}"
                    </p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-6 text-stone-500 italic text-xs">
              No general devices registered. Select and hover over individual lines for line-specific metrics.
            </div>
          )}
        </div>
      </div>

      {/* Callout Info box */}
      <div className="rounded-xl bg-amber-950/5 border border-stone-800 p-4.5 flex gap-3.5 items-start">
        <Info className="h-4.5 w-4.5 text-amber-500/40 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="text-[10px] font-mono uppercase tracking-widest text-stone-350 font-semibold">
            Workspace Navigation Tip
          </h4>
          <p className="text-[11px] text-stone-500 mt-1 leading-relaxed uppercase tracking-wide">
            Scroll down to review overall translation profiles, switch target languages, or trigger line specific observatory readings on the top panels.
          </p>
        </div>
      </div>
    </div>
  );
}
