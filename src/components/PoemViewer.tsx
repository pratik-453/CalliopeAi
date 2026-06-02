import React, { useState, useEffect, useRef } from "react";
import { PoemAnalysis, PoemLine, Translation } from "../types";
import { 
  Play, Pause, SkipForward, SkipBack, RotateCcw, 
  Sparkles, Globe, Tag, PlayCircle, Eye,
  Volume2, VolumeX, Music, Sliders, Upload, Video, Mic, EyeOff, SlidersHorizontal
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

class AmbientSoundscapeGenerator {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private oscillators: any[] = [];
  private nodes: AudioNode[] = [];
  private type: "none" | "drone" | "rain" | "bells" = "none";
  private intervalId: any = null;
  private currentVolume: number = 0.3;

  constructor() {}

  init() {
    if (this.ctx) return;
    try {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.currentVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.warn("Failed to initialize AudioContext:", e);
    }
  }

  setVolume(vol: number) {
    this.currentVolume = vol;
    if (!this.ctx && vol > 0) this.init();
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.05);
    }
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.oscillators.forEach(osc => {
      try { osc.stop(); } catch(e){}
    });
    this.oscillators = [];
    this.nodes.forEach(node => {
      try { node.disconnect(); } catch(e){}
    });
    this.nodes = [];
  }

  playDrone() {
    this.stop();
    this.init();
    if (!this.ctx || !this.masterGain) return;
    
    const freqs = [65.41, 130.81, 196.00, 261.63]; // C2, C3, G3, C4
    freqs.forEach((f, i) => {
      if (!this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();

        osc.type = i % 2 === 0 ? "triangle" : "sine";
        osc.frequency.setValueAtTime(f, this.ctx.currentTime);
        osc.detune.setValueAtTime((i - 1.5) * 5, this.ctx.currentTime);

        const baseGain = 0.08 / (i + 1);
        gain.gain.setValueAtTime(baseGain, this.ctx.currentTime);

        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(250 + (i * 50), this.ctx.currentTime);

        lfo.type = "sine";
        lfo.frequency.setValueAtTime(0.05 + (i * 0.02), this.ctx.currentTime);
        lfoGain.gain.setValueAtTime(baseGain * 0.4, this.ctx.currentTime);

        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain!);

        osc.start();
        lfo.start();
        this.oscillators.push(osc, lfo);
        this.nodes.push(gain, filter, lfoGain);
      } catch (e) {
        console.warn("Drone synthesis step failed:", e);
      }
    });
  }

  playRain() {
    this.stop();
    this.init();
    if (!this.ctx || !this.masterGain) return;

    try {
      const bufferSize = 2 * this.ctx.sampleRate;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = "peaking";
      filter.frequency.setValueAtTime(280, this.ctx.currentTime);
      filter.Q.setValueAtTime(0.8, this.ctx.currentTime);
      filter.gain.setValueAtTime(12, this.ctx.currentTime);

      const lpFilter = this.ctx.createBiquadFilter();
      lpFilter.type = "lowpass";
      lpFilter.frequency.setValueAtTime(1200, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);

      const lfo = this.ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.setValueAtTime(0.07, this.ctx.currentTime);
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(140, this.ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      whiteNoise.connect(lpFilter);
      lpFilter.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      whiteNoise.start();
      lfo.start();
      
      this.oscillators.push(whiteNoise, lfo);
      this.nodes.push(filter, lpFilter, gain, lfoGain);
    } catch(e) {
      console.warn("Rain synthesis failed:", e);
    }
  }

  playBells() {
    this.stop();
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const playBellStrike = () => {
      if (!this.ctx || !this.masterGain) return;
      const strikeTime = this.ctx.currentTime;
      const frequencies = [220.00, 261.63, 293.66, 329.63, 392.00, 440.00]; // Pentatonic scale notes
      const freq = frequencies[Math.floor(Math.random() * frequencies.length)];

      const partials = [1.0, 1.5, 2.0, 2.6, 3.2, 4.0];
      partials.forEach((part, idx) => {
        if (!this.ctx) return;
        try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = "sine";
          osc.frequency.setValueAtTime(freq * part, strikeTime);
          
          const duration = 3.5 / part;
          gain.gain.setValueAtTime(0, strikeTime);
          gain.gain.linearRampToValueAtTime(0.045 / (idx + 1), strikeTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.00001, strikeTime + duration);

          osc.connect(gain);
          gain.connect(this.masterGain!);

          osc.start(strikeTime);
          osc.stop(strikeTime + duration);

          setTimeout(() => {
            try {
              osc.disconnect();
              gain.disconnect();
            } catch(e){}
          }, (duration + 0.5) * 1000);
        } catch(e){}
      });
    };

    playBellStrike();

    this.intervalId = setInterval(() => {
      playBellStrike();
    }, 5000);
  }

  setSoundscape(type: "none" | "drone" | "rain" | "bells") {
    this.type = type;
    if (type === "none") {
      this.stop();
    } else if (type === "drone") {
      this.playDrone();
    } else if (type === "rain") {
      this.playRain();
    } else if (type === "bells") {
      this.playBells();
    }
  }
}

interface PoemViewerProps {
  analysis: PoemAnalysis;
  selectedLineIndex: number;
  onSelectLine: (index: number | ((prev: number) => number)) => void;
  activeLanguage: string;
}

export default function PoemViewer({
  analysis,
  selectedLineIndex,
  onSelectLine,
  activeLanguage,
}: PoemViewerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(4000); // ms per line
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Custom animation controls requested by the user
  const [animationStyle, setAnimationStyle] = useState<"typewriter" | "fade" | "slide" | "zoom">("typewriter");
  const [animationDuration, setAnimationDuration] = useState<number>(0.8);
  const [accentColor, setAccentColor] = useState<string>("#fde047");
  const [showAnimationSettings, setShowAnimationSettings] = useState<boolean>(true);

  // New Studio & Multimedia controls added
  const [activeStudioTab, setActiveStudioTab] = useState<"typography" | "backdrop" | "audio">("typography");
  
  // Backdrops states
  const [backdropType, setBackdropType] = useState<"none" | "nebula" | "digital">("none");
  const [backdropOpacity, setBackdropOpacity] = useState<number>(30); // 0 - 100
  const [backdropBlur, setBackdropBlur] = useState<number>(3); // 0 - 20

  // Audio / Synth / reading states
  const [soundscapeType, setSoundscapeType] = useState<"none" | "drone" | "rain" | "bells">("none");
  const [soundVolume, setSoundVolume] = useState<number>(0.3);
  const [isTtsEnabled, setIsTtsEnabled] = useState<boolean>(false);
  const [ttsRate, setTtsRate] = useState<number>(0.95);
  const [ttsPitch, setTtsPitch] = useState<number>(1.0);

  const synthRef = useRef<AmbientSoundscapeGenerator | null>(null);

  useEffect(() => {
    synthRef.current = new AmbientSoundscapeGenerator();
    return () => {
      if (synthRef.current) {
        synthRef.current.stop();
      }
    };
  }, []);

  // Synchronize sound properties
  useEffect(() => {
    if (synthRef.current) {
      synthRef.current.setVolume(soundVolume);
    }
  }, [soundVolume]);

  useEffect(() => {
    if (synthRef.current) {
      synthRef.current.setSoundscape(soundscapeType);
    }
  }, [soundscapeType]);

  const speakLineText = (text: string, rate: number, pitch: number) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      if (!text) return;
      const cleaned = text.replace(/[\[\]]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.rate = rate;
      utterance.pitch = pitch;

      const voices = window.speechSynthesis.getVoices();
      const optimalVoice = voices.find(v => v.lang.startsWith("en") || v.lang.startsWith("en-US"));
      if (optimalVoice) {
        utterance.voice = optimalVoice;
      }
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("TTS Error:", e);
    }
  };

  // TTS line read-out on line changes
  useEffect(() => {
    if (isTtsEnabled) {
      const activeLine = analysis.lines[selectedLineIndex];
      if (activeLine && activeLine.text) {
        speakLineText(activeLine.text, ttsRate, ttsPitch);
      }
    }
  }, [selectedLineIndex, isTtsEnabled, ttsRate, ttsPitch, analysis]);

  // Silence talk when playback paused
  useEffect(() => {
    if (!isPlaying) {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }
  }, [isPlaying]);

  const renderBackdropStyle = () => {
    return (
      <>
        {/* Base dark backdrop background container */}
        <div className="absolute inset-0 bg-[#0e0e0e] -z-25 pointer-events-none" />

        {backdropType === "nebula" && (
          <div 
            className="absolute inset-0 w-full h-full pointer-events-none transition-all duration-500 -z-10"
            style={{
              opacity: backdropOpacity / 100,
              filter: `blur(${backdropBlur}px)`,
              background: "radial-gradient(circle at 20% 20%, rgba(245, 158, 11, 0.15) 0%, transparent 60%), radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.22) 0%, transparent 70%), radial-gradient(circle at 40% 60%, rgba(20, 184, 166, 0.1) 0%, transparent 50%)"
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/5 via-transparent to-purple-500/10 animate-pulse duration-[8000ms]"></div>
          </div>
        )}

        {backdropType === "digital" && (
          <div 
            className="absolute inset-0 w-full h-full pointer-events-none transition-all duration-500 -z-10 bg-gradient-to-br from-black via-stone-950 to-stone-900"
            style={{
              opacity: backdropOpacity / 100,
              filter: `blur(${backdropBlur}px)`,
            }}
          >
            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_bottom,rgba(251,191,36,0)_0%,rgba(251,191,36,0.2)_50%,rgba(251,191,36,0)_100%)] bg-[length:100%_400px] animate-[backdrop_15s_infinite_linear]"></div>
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes backdrop {
                0% { background-position-y: -400px; }
                100% { background-position-y: 800px; }
              }
            `}} />
          </div>
        )}
      </>
    );
  };

  const totalLines = analysis.lines.length;
  const currentLine = analysis.lines[selectedLineIndex] || analysis.lines[0];

  // Map of language codes to flag emojis or short icons
  const langLanguage = analysis.translations.find((t) => t.code === activeLanguage);

  // Playback timer loop
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        onSelectLine((prevIndex) => {
          const nextIndex = prevIndex + 1;
          if (nextIndex >= totalLines) {
            setIsPlaying(false);
            return 0; // Wrap back to start
          }
          return nextIndex;
        });
      }, playbackSpeed);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, totalLines]);

  // Auto-scroll logic to keep the active line centered
  useEffect(() => {
    const activeEl = document.getElementById(`poem-line-${selectedLineIndex}`);
    if (activeEl && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const topOffset = activeEl.offsetTop - container.offsetTop - (container.clientHeight / 2) + (activeEl.clientHeight / 2);
      container.scrollTo({
        top: Math.max(0, topOffset),
        behavior: "smooth"
      });
    }
  }, [selectedLineIndex]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const resetPlayback = () => {
    setIsPlaying(false);
    onSelectLine(0);
  };
  const goNext = () => {
    setIsPlaying(false);
    onSelectLine((prev) => Math.min(totalLines - 1, prev + 1));
  };
  const goPrev = () => {
    setIsPlaying(false);
    onSelectLine((prev) => Math.max(0, prev - 1));
  };

  const getTranslationForLine = (lang: Translation | undefined, index: number) => {
    if (!lang || !lang.translatedLines || lang.translatedLines.length <= index) {
      return null;
    }
    return lang.translatedLines[index];
  };

  // Helper to render active lines with customizable entry animations
  const renderAnimatedLineText = (text: string) => {
    if (!text) return <span className="opacity-15 font-sans italic text-sm">Stanza Break</span>;

    const duration = animationDuration;

    if (animationStyle === "typewriter") {
      const letters = Array.from(text);
      const containerVariants = {
        hidden: { opacity: 1 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.03 * (duration / 0.8),
          },
        },
      };
      
      const childVariants = {
        hidden: { opacity: 0, y: 1 },
        visible: { 
          opacity: 1, 
          y: 0,
          transition: {
            type: "spring",
            damping: 12,
            stiffness: 100,
          }
        },
      };

      return (
        <motion.span
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="inline-block"
          style={{ color: accentColor }}
        >
          {letters.map((char, idx) => (
            <motion.span
              key={idx}
              variants={childVariants}
              className="inline-block whitespace-pre"
            >
              {char}
            </motion.span>
          ))}
        </motion.span>
      );
    }

    if (animationStyle === "slide") {
      return (
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: duration, ease: "easeOut" }}
          className="inline-block"
          style={{ color: accentColor }}
        >
          {text}
        </motion.span>
      );
    }

    if (animationStyle === "zoom") {
      return (
        <motion.span
          initial={{ opacity: 0.4, scale: 0.94, filter: "blur(3px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: duration, ease: "easeInOut" }}
          className="inline-block"
          style={{ color: accentColor }}
        >
          {text}
        </motion.span>
      );
    }

    // Default "fade" 
    return (
      <motion.span
        initial={{ opacity: 0, letterSpacing: "-0.03em" }}
        animate={{ opacity: 1, letterSpacing: "0.01em" }}
        transition={{ duration: duration, ease: "easeOut" }}
        className="inline-block"
        style={{ color: accentColor }}
      >
        {text}
      </motion.span>
    );
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* LEFT COLUMN: Animated Poem Theater */}
      <div 
        className="rounded-xl border border-stone-800 p-5 sm:p-7 shadow-2xl lg:col-span-7 flex flex-col justify-between h-[620px] relative overflow-hidden isolate transition-all duration-300 bg-transparent"
      >
        {/* Render Background Backdrop Loop */}
        {renderBackdropStyle()}

        {/* Header toolbar */}
        <div className="flex items-center justify-between border-b border-stone-900 pb-3 flex-wrap gap-2 z-10">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping"></span>
            <span className="font-mono text-[10px] text-stone-300 uppercase tracking-widest bg-black/40 px-2 py-0.5 rounded border border-stone-900/60 font-medium">
              Manuscript Stage — Theater Mode
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAnimationSettings(!showAnimationSettings)}
              className={`px-2 py-1 rounded text-[9px] font-mono border uppercase tracking-wider transition-all cursor-pointer ${
                showAnimationSettings
                  ? "bg-amber-950/30 border-amber-800/60 text-amber-200"
                  : "bg-stone-900/40 border-stone-850 text-stone-400 hover:text-stone-200"
              }`}
            >
              Configure Theater 🎬
            </button>
            <div className="h-3 w-px bg-stone-800 font-bold"></div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPlaybackSpeed(6000)}
                className={`px-1.5 py-1 rounded text-[9px] font-mono border uppercase tracking-wider transition-colors cursor-pointer ${
                  playbackSpeed === 6000
                    ? "bg-amber-950/40 border-amber-800/40 text-amber-200"
                    : "bg-transparent border-transparent text-stone-500 hover:text-stone-300"
                }`}
              >
                Slow
              </button>
              <button
                onClick={() => setPlaybackSpeed(4000)}
                className={`px-1.5 py-1 rounded text-[9px] font-mono border uppercase tracking-wider transition-colors cursor-pointer ${
                  playbackSpeed === 4000
                    ? "bg-amber-950/40 border-amber-800/40 text-amber-200"
                    : "bg-transparent border-transparent text-stone-500 hover:text-stone-300"
                }`}
              >
                Medium
              </button>
              <button
                onClick={() => setPlaybackSpeed(2500)}
                className={`px-1.5 py-1 rounded text-[9px] font-mono border uppercase tracking-wider transition-colors cursor-pointer ${
                  playbackSpeed === 2500
                    ? "bg-amber-950/40 border-amber-800/40 text-amber-200"
                    : "bg-transparent border-transparent text-stone-500 hover:text-stone-300"
                }`}
              >
                Fast
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Studio Configuration Console (Tabbed selector for visual backend synthesis & layout transitions) */}
        <AnimatePresence>
          {showAnimationSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-b border-stone-900 bg-black/80 backdrop-blur-md p-3 z-10"
            >
              <div className="max-h-[260px] overflow-y-auto pr-1 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-stone-800 scrollbar-track-transparent">
                {/* Internal Tab selectors */}
              <div className="flex gap-2 border-b border-stone-850 pb-2">
                {[
                  { id: "typography", label: "Motions & Style", icon: SlidersHorizontal },
                  { id: "backdrop", label: "Backdrop Vis 🎥", icon: Video },
                  { id: "audio", label: "Sound & Speak 🌌", icon: Music }
                ].map((tab) => {
                  const IconComp = tab.icon;
                  const isActive = activeStudioTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveStudioTab(tab.id as any)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-sm text-[10px] uppercase font-mono tracking-wider transition-all cursor-pointer ${
                        isActive 
                          ? "bg-amber-200 text-stone-950 font-bold" 
                          : "bg-stone-900/60 text-stone-400 hover:text-stone-200"
                      }`}
                    >
                      <IconComp className="h-3.5 w-3.5 shrink-0" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab Content 1: Transition Styles & Color Highlights */}
              {activeStudioTab === "typography" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Transition Select */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-mono uppercase text-stone-500 tracking-wider">
                      Transition style
                    </span>
                    <select
                      value={animationStyle}
                      onChange={(e) => setAnimationStyle(e.target.value as any)}
                      className="bg-stone-900 border border-stone-800 px-2.5 py-2 rounded text-[11px] text-stone-300 font-mono focus:outline-none focus:border-amber-500 cursor-pointer uppercase"
                    >
                      <option value="typewriter">Character Typewriter</option>
                      <option value="fade">Elegant Smooth Fade</option>
                      <option value="slide">Kinetic Slide Up</option>
                      <option value="zoom">Cinematic Focus Zoom</option>
                    </select>
                  </div>

                  {/* Transition Duration */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-mono uppercase text-stone-500 tracking-wider">
                      Duration Timer
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0.1"
                        max="5.0"
                        step="0.1"
                        value={animationDuration}
                        onChange={(e) => setAnimationDuration(Math.max(0.1, parseFloat(e.target.value) || 0.8))}
                        className="w-full bg-[#141414] border border-stone-800 px-2.5 py-1.5 rounded text-xs text-amber-300 font-mono text-center focus:outline-none focus:border-amber-500"
                      />
                      <span className="text-[9px] font-mono text-stone-500">sec</span>
                    </div>
                  </div>

                  {/* Color Selector */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-mono uppercase text-stone-500 tracking-wider">
                      Text Highlighter Color
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="w-7 h-7 bg-transparent border-0 rounded cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        placeholder="#fde047"
                        className="w-full bg-[#141414] border border-stone-800 px-2 py-1.5 rounded text-[11px] text-stone-300 font-mono text-center focus:outline-none focus:border-amber-500 uppercase"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Content 2: Atmospheric Backdrop Visual Modifiers */}
              {activeStudioTab === "backdrop" && (
                <div className="space-y-3.5 w-full">
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { type: "none", label: "Clean Slate" },
                      { type: "nebula", label: "Nebula Glow" },
                      { type: "digital", label: "Moving Beam" }
                    ].map((b) => (
                      <button
                        key={b.type}
                        onClick={() => setBackdropType(b.type as any)}
                        className={`px-2 py-1.5 rounded text-[9px] font-mono uppercase border transition-all text-center flex flex-col items-center justify-center gap-1 cursor-pointer ${
                          backdropType === b.type
                            ? "bg-amber-950/40 border-amber-500/60 text-amber-200 shadow-sm"
                            : "bg-stone-900/30 border-stone-850 text-stone-400 hover:border-stone-800 hover:text-stone-300"
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>

                  {backdropType !== "none" && (
                    <div className="space-y-2 border-t border-stone-900/60 pt-2 flex flex-col sm:flex-row gap-4 items-center justify-between">
                      <div className="flex items-center gap-2 w-full sm:w-1/2">
                        <span className="text-[8px] font-mono uppercase text-stone-500 tracking-wider w-12 shrink-0">
                          Opacity
                        </span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={backdropOpacity}
                          onChange={(e) => setBackdropOpacity(parseInt(e.target.value))}
                          className="w-full accent-amber-400 bg-stone-900 h-1 rounded-full cursor-ew-resize"
                        />
                        <span className="text-[9px] font-mono text-stone-400 shrink-0 w-6 text-right">
                          {backdropOpacity}%
                        </span>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-1/2">
                        <span className="text-[8px] font-mono uppercase text-stone-500 tracking-wider w-12 shrink-0">
                          Blurring
                        </span>
                        <input
                          type="range"
                          min="0"
                          max="20"
                          value={backdropBlur}
                          onChange={(e) => setBackdropBlur(parseInt(e.target.value))}
                          className="w-full accent-amber-400 bg-stone-900 h-1 rounded-full cursor-ew-resize"
                        />
                        <span className="text-[9px] font-mono text-stone-400 shrink-0 w-6 text-right">
                          {backdropBlur}px
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab Content 3: Soundboards & Speech Synthesiser Controls */}
              {activeStudioTab === "audio" && (
                <div className="space-y-3.5 w-full">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Soundscape presets */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-mono uppercase text-stone-400 tracking-wider flex items-center gap-1.5 text-amber-200">
                        <Music className="h-3 w-3" />
                        Ambience Soundscape loop
                      </label>
                      <select
                        value={soundscapeType}
                        onChange={(e) => setSoundscapeType(e.target.value as any)}
                        className="w-full bg-stone-900 border border-stone-800 px-2 py-1.5 rounded text-[11px] text-stone-200 font-mono focus:outline-none focus:border-amber-400 uppercase cursor-pointer"
                      >
                        <option value="none">🔇 Soundscape Off</option>
                        <option value="drone">🌌 Cosmic Space pads</option>
                        <option value="rain">🌧️ Warm Forest rain</option>
                        <option value="bells">🔔 Zen Chiming bowls</option>
                      </select>
                    </div>

                    {/* Speech TTS narrator toggles */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center bg-stone-900/40 border border-stone-850 px-3 py-1 rounded">
                        <label className="text-[9px] font-mono uppercase text-stone-400 tracking-wider flex items-center gap-1 text-amber-200">
                          <Mic className="h-3.5 w-3.5" />
                          Narrator Voice Readout (TTS)
                        </label>
                        <label className="relative inline-flex items-center cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isTtsEnabled}
                            onChange={(e) => setIsTtsEnabled(e.target.checked)}
                            className="sr-only peer cursor-pointer"
                          />
                          <div className="w-8 h-4.5 bg-stone-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-stone-300 after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-amber-300 peer-checked:after:bg-stone-950 cursor-pointer"></div>
                        </label>
                      </div>
                      <div className="text-[8px] font-mono text-stone-500 uppercase tracking-widest text-right">
                        {isTtsEnabled ? "🟢 Read-aloud ON on line navigation" : "🔴 Reader currently silent"}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-between pt-2 border-t border-stone-900/60">
                    <div className="flex items-center gap-2 w-full sm:w-1/3">
                      <span className="text-[8px] font-mono uppercase text-stone-500 tracking-wider shrink-0 w-10">
                        Volume
                      </span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={soundVolume}
                        onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
                        className="w-full accent-amber-400 bg-stone-900 h-1 rounded-full cursor-ew-resize"
                      />
                      <span className="text-[10px] font-mono text-stone-400 w-8 text-right font-bold">
                        {Math.round(soundVolume * 100)}%
                      </span>
                    </div>

                    {isTtsEnabled && (
                      <div className="flex flex-wrap gap-4 w-full sm:w-2/3 justify-end items-center">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[8px] font-mono uppercase text-stone-500 tracking-wider">
                            Voice Speed
                          </span>
                          <input
                            type="number"
                            min="0.5"
                            max="2.0"
                            step="0.1"
                            value={ttsRate}
                            onChange={(e) => setTtsRate(Math.max(0.5, parseFloat(e.target.value) || 1.0))}
                            className="w-12 bg-[#141414] border border-stone-800 px-1 py-0.5 rounded text-[10px] text-amber-300 font-mono text-center focus:outline-none focus:border-amber-400"
                          />
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[8px] font-mono uppercase text-stone-500 tracking-wider">
                            Voice Pitch
                          </span>
                          <input
                            type="number"
                            min="0.5"
                            max="2.0"
                            step="0.1"
                            value={ttsPitch}
                            onChange={(e) => setTtsPitch(Math.max(0.5, parseFloat(e.target.value) || 1.0))}
                            className="w-12 bg-[#141414] border border-stone-850 px-1 py-0.5 rounded text-[10px] text-amber-300 font-mono text-center focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scrollable Poem Text Stage */}
        <div 
          ref={scrollContainerRef}
          className="my-3 flex-1 overflow-y-auto pr-2 space-y-3 relative"
          style={{ minHeight: "180px" }}
        >
          {/* Fading overlay at top and bottom */}
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-8 w-full bg-gradient-to-b from-[#0e0e0e]/30 to-transparent"></div>
          
          {analysis.lines.map((line, index) => {
            const isSelected = selectedLineIndex === index;
            const lineTranslation = getTranslationForLine(langLanguage, index);

            return (
              <div
                key={index}
                id={`poem-line-${index}`}
                onClick={() => {
                  setIsPlaying(false);
                  onSelectLine(index);
                }}
                onMouseEnter={() => {
                  if (!isPlaying) {
                    onSelectLine(index);
                  }
                }}
                className={`group relative cursor-pointer rounded p-3 transition-all duration-300 select-none ${
                  isSelected
                    ? "bg-amber-500/5 border-l-2 border-amber-500/80 pl-4 shadow-[0_1px_8px_rgba(0,0,0,0.2)]"
                    : "border-l-2 border-transparent hover:border-stone-700 hover:bg-[#141414]/25 pl-4 text-stone-400 hover:text-stone-200"
                }`}
              >
                {/* Micro device pill indicator on hover or selected */}
                {line.devices && line.devices.length > 0 && (
                  <span className={`absolute right-4 top-3 flex gap-1 transform transition-all text-[8px] font-mono tracking-wider ${
                    isSelected ? "opacity-100 scale-100" : "opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100"
                  }`}>
                    {line.devices.slice(0, 2).map((device, i) => (
                      <span key={i} className="rounded bg-stone-900 border border-stone-800 text-stone-300 px-1.5 py-0.5 uppercase">
                        {device}
                      </span>
                    ))}
                  </span>
                )}

                {/* Main poem text */}
                <span className="absolute left-1 top-3.5 font-mono text-[9px] text-stone-600 select-none">
                  {(index + 1).toString().padStart(2, "0")}
                </span>

                <h3 className={`font-serif text-base md:text-lg tracking-wide break-words leading-relaxed transition-all ${
                  isSelected ? "font-medium scale-[1.01] transform origin-left" : ""
                }`}>
                  {isSelected ? (
                    renderAnimatedLineText(line.text)
                  ) : (
                    line.text || <span className="opacity-15 font-sans italic text-sm">Stanza Break</span>
                  )}
                </h3>

                {/* Overlay translation if active */}
                {lineTranslation && line.text && (
                  <div className={`mt-1 font-sans text-xs transition-opacity duration-300 ${
                    isSelected ? "text-stone-400 opacity-100 font-light" : "text-stone-500 opacity-60 group-hover:opacity-100 font-light"
                  }`}>
                    {lineTranslation}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Video-style Controller Deck */}
        <div className="border-t border-stone-900/50 pt-3 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Progress bar */}
          <div className="w-full bg-stone-900 rounded-full h-1 relative overflow-hidden">
            <div 
              className="bg-amber-400 h-1 rounded-full transition-all duration-300"
              style={{ width: `${((selectedLineIndex + 1) / totalLines) * 100}%` }}
            />
          </div>

          <div className="flex w-full justify-between items-center">
            {/* Playback info counter */}
            <div className="font-mono text-[9px] uppercase tracking-wider text-stone-500">
              Verse {selectedLineIndex + 1} / {totalLines} ({(Math.round((selectedLineIndex + 1) / totalLines * 100))}% deciphered)
            </div>

            {/* Core control buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={goPrev}
                title="Previous Verse"
                className="p-1.5 rounded bg-[#141414] text-stone-400 hover:text-stone-200 hover:bg-[#1a1a1a] border border-stone-800 transition-colors"
              >
                <SkipBack className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={togglePlay}
                title={isPlaying ? "Pause Decoding" : "Play Autoplay"}
                className={`p-2 rounded-full transition-all ${
                  isPlaying 
                    ? "bg-amber-200 text-stone-950 hover:bg-amber-100 shadow-[0_0_12px_rgba(251,191,36,0.15)]" 
                    : "bg-[#141414] text-amber-205 hover:bg-[#1a1a1a] border border-stone-800"
                }`}
              >
                {isPlaying ? <Pause className="h-4.5 w-4.5 text-stone-950" /> : <Play className="h-4.5 w-4.5 text-stone-300 fill-current" />}
              </button>

              <button
                onClick={goNext}
                title="Next Verse"
                className="p-1.5 rounded bg-[#141414] text-stone-400 hover:text-stone-200 hover:bg-[#1a1a1a] border border-stone-800 transition-colors"
              >
                <SkipForward className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={resetPlayback}
                title="Restart Reading"
                className="p-1.5 rounded bg-[#141414] text-stone-400 hover:text-stone-200 hover:bg-[#1a1a1a] border border-stone-800 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Line Insight Observatory */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        {/* Active Line Card */}
        <div className="rounded-xl border border-stone-800 bg-[#0d0d0d] p-6.5 shadow-2xl flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-stone-850 pb-3.5 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-200 animate-pulse" />
                <h3 className="font-display text-base font-light italic text-stone-200">
                  Observe Metaphor
                </h3>
              </div>
              <span className="font-mono text-[9px] uppercase tracking-wider rounded bg-stone-900 border border-stone-800 px-2 py-0.5 text-stone-400">
                Verse {selectedLineIndex + 1}
              </span>
            </div>

            {/* Focused Text */}
            <div className="mb-5 bg-black/40 rounded border border-stone-900 p-4">
              <span className="text-[9px] font-mono text-stone-500 uppercase tracking-widest block mb-1">
                Active Selection
              </span>
              <p className="font-serif text-lg text-amber-200/90 italic leading-relaxed">
                "{currentLine?.text || "..."}"
              </p>
              
              {/* Active Subtitle overlay */}
              {langLanguage && currentLine?.text && (
                <div className="mt-2.5 text-xs text-stone-400 border-t border-stone-903 pt-2 flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-stone-500 flex-shrink-0" />
                  <span className="font-light">
                    <strong>{langLanguage.language}:</strong>{" "}
                    {getTranslationForLine(langLanguage, selectedLineIndex)}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {/* Poetic Devices discovered inside this specific line */}
              {currentLine?.devices && currentLine.devices.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-mono text-stone-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Tag className="h-3 w-3 text-amber-200" />
                    Line Poetics
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {currentLine.devices.map((device, di) => (
                      <span
                        key={di}
                        className="rounded bg-amber-950/20 text-amber-200 border border-amber-900/30 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider"
                      >
                        {device}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Literary subtext and insights */}
              <div>
                <h4 className="text-[10px] font-mono text-stone-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-stone-400" />
                  Conceptual Insight
                </h4>
                <p className="text-xs text-stone-300 leading-relaxed bg-[#141414] p-3 rounded border border-stone-800/80">
                  {currentLine?.insight || "Select or hover over an active line in the theater panel to load insights automatically."}
                </p>
              </div>

              {/* What the poet is trying to portray */}
              <div>
                <h4 className="text-[10px] font-mono text-stone-500 uppercase tracking-widest mb-1.5">
                  Poet's Metaphorical Intent
                </h4>
                <p className="text-xs text-stone-300 leading-relaxed bg-[#141414] p-3 rounded border border-stone-800/80">
                  {currentLine?.explanation || "The underlying intent and emotional undertone will render here as you navigate."}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-stone-900 pt-4 text-center">
            <p className="text-[9px] font-mono text-stone-600 uppercase tracking-wider">
              * Hover/select any verse line in the theater panel to trigger observatory readouts
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
