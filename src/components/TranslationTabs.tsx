import React from "react";
import { Translation } from "../types";
import { Globe } from "lucide-react";

interface TranslationTabsProps {
  translations: Translation[];
  activeLanguage: string; // 'none' or iso code
  onChangeLanguage: (code: string) => void;
}

export default function TranslationTabs({
  translations,
  activeLanguage,
  onChangeLanguage,
}: TranslationTabsProps) {
  const options = [
    { code: "none", label: "Original Only", flag: "🇬🇧" },
    ...translations.map((t) => {
      let flag = "🌐";
      if (t.code === "es") flag = "🇪🇸";
      else if (t.code === "fr") flag = "🇫🇷";
      else if (t.code === "de") flag = "🇩🇪";
      else if (t.code === "ja") flag = "🇯🇵";
      else if (t.code === "hi") flag = "🇮🇳";
      else if (t.code === "zh") flag = "🇨🇳";
      return {
        code: t.code,
        label: t.language,
        flag,
      };
    }),
  ];

  return (
    <div className="rounded-xl border border-stone-800 bg-[#0d0d0d] p-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-1 pb-3 border-b border-stone-850 mb-3">
        <label className="text-[10px] font-mono text-stone-400 uppercase tracking-widest flex items-center gap-1.5 py-1">
          <Globe className="h-4 w-4 text-amber-200 animate-pulse" />
          Parallel Translations
        </label>
        <span className="text-[10px] text-stone-500 font-mono uppercase tracking-wider hidden sm:inline">
          Choose a parallel language to render line-by-line along with the original text
        </span>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Labeled Translation Selector Dropdown */}
        <div className="flex flex-col gap-1 min-w-[240px]">
          <span className="text-[9px] font-mono uppercase text-stone-500 tracking-wider">
            Translation Dropdown Selector
          </span>
          <div className="relative w-full">
            <select
              value={activeLanguage}
              onChange={(e) => onChangeLanguage(e.target.value)}
              className="w-full bg-[#141414] border border-stone-800 rounded px-3 py-2.5 text-xs font-mono text-stone-200 hover:text-stone-100 focus:outline-none focus:border-amber-400 cursor-pointer appearance-none uppercase tracking-wider block"
            >
              {options.map((opt) => (
                <option key={opt.code} value={opt.code} className="bg-[#0e0e0e] text-stone-200 font-mono">
                  {opt.flag} &nbsp; {opt.label.toUpperCase()}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-stone-500 border-l border-stone-850">
              <span className="text-xs select-none">▼</span>
            </div>
          </div>
        </div>

        {/* Separator on desktop */}
        <div className="hidden md:block h-10 w-px bg-stone-850"></div>

        {/* Quick Tabs Grid */}
        <div className="flex flex-col gap-1 w-full">
          <span className="text-[9px] font-mono uppercase text-stone-500 tracking-wider hidden md:block">
            Quick Selector Presets
          </span>
          <div className="flex flex-wrap gap-1.5">
            {options.map((opt) => {
              const isActive = activeLanguage === opt.code;
              return (
                <button
                  key={opt.code}
                  onClick={() => onChangeLanguage(opt.code)}
                  className={`flex items-center gap-1.5 rounded-sm px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider transition-all border ${
                    isActive
                      ? "bg-amber-200 text-stone-950 border-amber-300 shadow-[0_2px_10px_rgba(251,191,36,0.15)] font-bold cursor-pointer"
                      : "bg-[#141414] border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700 cursor-pointer"
                  }`}
                >
                  <span className="text-sm select-none">{opt.flag}</span>
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
