import React from "react";
import { Feather, Sparkles, HelpCircle, GraduationCap } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-stone-800 bg-[#0d0d0d]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo and title */}
        <div className="flex items-center gap-3.5">
          <div className="w-8 h-8 bg-gradient-to-tr from-amber-200 to-stone-500 rounded-sm rotate-45 flex items-center justify-center border border-amber-300/20 shadow-md">
            <Feather id="logo-icon" className="h-4 w-4 text-[#0a0a0a] -rotate-45" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-lg font-light tracking-widest uppercase text-stone-100">
                Calliope<span className="font-semibold text-amber-200">AI</span>
              </span>
              <span className="rounded bg-amber-950/40 px-1.5 py-0.5 text-[9px] font-mono font-medium text-amber-300 border border-amber-800/30">
                LITERARY STUDY
              </span>
            </div>
            <p className="text-[10px] uppercase tracking-wider font-mono text-stone-500">
              Interactive Translations & Line-by-Line Insights
            </p>
          </div>
        </div>

        {/* Feature badges */}
        <div className="hidden md:flex items-center gap-6 text-xs uppercase tracking-wider font-mono text-stone-400">
          <div className="flex items-center gap-1.5 hover:text-amber-200 transition-colors cursor-default">
            <Sparkles className="h-3.5 w-3.5 text-stone-500" />
            <span>Insights</span>
          </div>
          <div className="flex items-center gap-1.5 hover:text-amber-200 transition-colors cursor-default">
            <GraduationCap className="h-3.5 w-3.5 text-stone-500" />
            <span>Poetics</span>
          </div>
          <div className="flex items-center gap-1.5 hover:text-amber-200 transition-colors cursor-default">
            <HelpCircle className="h-3.5 w-3.5 text-stone-500" />
            <span>Ask Muse</span>
          </div>
        </div>

        {/* Action Status Indicator */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400/40 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-300"></span>
          </span>
          <span className="font-mono text-[9px] text-stone-500 uppercase tracking-widest hidden sm:inline-block">
            Workspace Active
          </span>
        </div>
      </div>
    </header>
  );
}
