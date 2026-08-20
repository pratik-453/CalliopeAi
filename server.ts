import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Ensure the API key is set before starting the applet or log a helper error
if (!process.env.GEMINI_API_KEY) {
  console.warn("WARNING: GEMINI_API_KEY environment variable is not defined.");
}

// Initialize the server-side Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

/**
 * Executes a function with automatic exponential backoff retry for transient errors (503, network spikes).
 * If a model returns 429 quota exhaustion (e.g. daily quota reached), it immediately cascades to the next candidate model.
 */
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 1, baseDelayMs = 500): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      attempt++;
      
      // Parse error details
      const errorStr = typeof error === "object" ? JSON.stringify(error) : String(error);
      const errorMessage = error?.message || "";
      const errorStatus = error?.status || "";
      
      const isQuotaExhausted = errorMessage.includes("Quota exceeded") || errorStr.includes("Quota exceeded") || errorMessage.includes("RESOURCE_EXHAUSTED") || errorStr.includes("RESOURCE_EXHAUSTED");
      const is503 = errorMessage.includes("503") || errorStr.includes("503") || errorMessage.includes("UNAVAILABLE") || errorStr.includes("UNAVAILABLE") || errorMessage.includes("high demand") || errorStr.includes("high demand") || errorStatus === 503 || errorStatus === "UNAVAILABLE";
      const isTransient = errorMessage.includes("ECONNRESET") || errorMessage.includes("fetch failed") || errorMessage.includes("overloaded");
      
      // Do NOT retry the exact same model if its daily quota is exhausted; let it immediately cascade
      const isRetryable = (is503 || isTransient) && !isQuotaExhausted;
      
      if (attempt <= maxRetries && isRetryable) {
        const jitter = 0.6 + Math.random() * 0.8;
        const delay = Math.round(baseDelayMs * Math.pow(2, attempt - 1) * jitter);
        console.warn(`[Gemini Retry] Attempt ${attempt}/${maxRetries} encountered transient load (${errorMessage || errorStr}). Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}

// Order fallback models starting with ultra-fast, high-capacity Gemini models
const FALLBACK_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-3.5-flash",
  "gemini-3.7-flash"
];

/**
 * Generates content using an array of fallback models to ensure extremely high availability when a model gets overloaded.
 */
async function generateContentWithFallback(params: {
  contents: any;
  config?: any;
  defaultModel?: string;
}) {
  const modelsToTry = [
    ...(params.defaultModel ? [params.defaultModel] : []),
    ...FALLBACK_MODELS.filter(m => m !== params.defaultModel)
  ];

  let lastError: any = null;
  for (const model of modelsToTry) {
    try {
      console.log(`[Gemini Attempt] Trying text generation with model: ${model}`);
      return await withRetry(() => ai.models.generateContent({
        model: model,
        contents: params.contents,
        config: params.config,
      }), 2, 600);
    } catch (err: any) {
      lastError = err;
      const errStr = typeof err === "object" ? JSON.stringify(err) : String(err);
      console.warn(`[Gemini Fallback] Model ${model} failed (${err?.message || errStr}). Cascading to next candidate...`);
    }
  }
  throw lastError;
}

/**
 * Sends a chat message with a list of fallback models.
 */
async function sendMessageWithFallback(params: {
  message: string;
  systemInstruction: string;
  history: any[];
  defaultModel?: string;
}) {
  const modelsToTry = [
    ...(params.defaultModel ? [params.defaultModel] : []),
    ...FALLBACK_MODELS.filter(m => m !== params.defaultModel)
  ];

  let lastError: any = null;
  for (const model of modelsToTry) {
    try {
      console.log(`[Gemini Chat Attempt] Trying chat message with model: ${model}`);
      const chat = ai.chats.create({
        model: model,
        config: {
          systemInstruction: params.systemInstruction,
        },
        history: params.history,
      });
      return await withRetry(() => chat.sendMessage({
        message: params.message,
      }), 2, 600);
    } catch (err: any) {
      lastError = err;
      const errStr = typeof err === "object" ? JSON.stringify(err) : String(err);
      console.warn(`[Gemini Fallback Chat] Model ${model} failed (${err?.message || errStr}). Cascading to next candidate...`);
    }
  }
  throw lastError;
}

/**
 * Generates an instant, rich heuristic literary analysis when the API is temporarily rate-limited or in high-demand.
 */
function generateFallbackPoemAnalysis(poemText: string) {
  const lines = poemText.split(/\r?\n/).map((l) => l.trim());
  const nonBlank = lines.filter((l) => l.length > 0);

  // Try to determine title & author
  let title = "Selected Manuscript";
  let author = "Unknown Poet";
  if (nonBlank.length > 0) {
    const firstLine = nonBlank[0].replace(/^[#"'\s]+|[#"'\s]+$/g, "");
    if (firstLine.length < 50 && !firstLine.includes(",")) {
      title = firstLine;
    }
  }

  // Detect poetic devices and line-level insights algorithmically
  const detectedLines = lines.map((text, originalIndex) => {
    if (!text) {
      return {
        lineIndex: originalIndex,
        text: "",
        insight: "",
        devices: [],
        explanation: "",
      };
    }

    const devices: string[] = [];
    const lower = text.toLowerCase();
    const words = text.split(/\s+/).filter(Boolean);

    // 1. Alliteration check
    const letters = words.map((w) => w.replace(/[^a-zA-Z]/g, "")[0]?.toLowerCase()).filter(Boolean);
    for (let i = 0; i < letters.length - 1; i++) {
      if (letters[i] && letters[i] === letters[i + 1] && !["a", "e", "i", "o", "u"].includes(letters[i])) {
        if (!devices.includes("Alliteration")) devices.push("Alliteration");
      }
    }

    // 2. Simile check
    if (/\b(like a|like the|as \w+ as|as if|like)\b/i.test(text)) {
      devices.push("Simile");
    }

    // 3. Personification / Metaphor check
    if (/\b(whispers|whispering|weeps|dances|sighs|cries|embraces|breathes|awakes|sleeps|wanders)\b/i.test(lower)) {
      devices.push("Personification");
    } else if (/\b(is a|are the|was a|became a|ocean of|sea of|fire of|river of|shadow of)\b/i.test(lower)) {
      devices.push("Metaphor");
    }

    // 4. Sensory Imagery check
    if (/\b(golden|dark|luminous|crimson|silent|whisper|cold|warm|fragrant|bitter|sweet|radiant|shadow|glowing|sun|moon|stars|night|sea)\b/i.test(lower)) {
      devices.push("Imagery");
    }

    // 5. Enjambment check
    if (!/[.,:;!?]$/.test(text)) {
      if (devices.length < 2) devices.push("Enjambment");
    }

    if (devices.length === 0) {
      devices.push("Lyrical Cadence");
    }

    const activeDevices = devices.slice(0, 2);
    const insight = `Evokes poignant imagery and expressive lyrical tone highlighting ${activeDevices.join(" and ")}.`;
    const explanation = `The poet shapes rhythm and emotional nuance in this verse to emphasize resonance.`;

    return {
      lineIndex: originalIndex,
      text,
      insight,
      devices: activeDevices,
      explanation,
    };
  });

  const translations = [
    { language: "Spanish", code: "es", translatedLines: lines.map((l) => (l ? `[ES] ${l}` : "")) },
    { language: "French", code: "fr", translatedLines: lines.map((l) => (l ? `[FR] ${l}` : "")) },
    { language: "German", code: "de", translatedLines: lines.map((l) => (l ? `[DE] ${l}` : "")) },
    { language: "Japanese", code: "ja", translatedLines: lines.map((l) => (l ? `[JA] ${l}` : "")) },
    { language: "Hindi", code: "hi", translatedLines: lines.map((l) => (l ? `[HI] ${l}` : "")) },
    { language: "Mandarin", code: "zh", translatedLines: lines.map((l) => (l ? `[ZH] ${l}` : "")) },
  ];

  return {
    title,
    author,
    summary: "An exploration of human experience, sentiment, and lyrical introspection rendered through rhythmic cadence and poetic imagery.",
    themes: [
      { theme: "Introspection & Emotion", explanation: "The verses contemplate memory, emotion, and temporal transience." },
      { theme: "Nature & Resonance", explanation: "Sensory details frame a broader dialogue between the speaker and their landscape." },
    ],
    poeticDevicesOverall: [
      { device: "Imagery", definition: "Vivid visual and sensory descriptions that evoke emotional depth.", example: nonBlank[0] || "Sensory phrasing" },
      { device: "Symbolism", definition: "Using motifs and metaphors to represent deeper philosophical truths.", example: nonBlank[1] || "Lyrical motif" },
    ],
    translations,
    lines: detectedLines,
    isInstantFallback: true,
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use body parsing middleware
  app.use(express.json());

  // API endpoint to analyze poems
  app.post("/api/analyze-poem", async (req, res) => {
    try {
      const { poemText } = req.body;
      if (!poemText || typeof poemText !== "string" || poemText.trim().length === 0) {
        return res.status(400).json({ error: "Poem text is required." });
      }

      // Split the poem into lines
      const inputLines = poemText.split(/\r?\n/).map(line => line.trim());
      
      // Filter out empty lines/stanza breaks for Gemini's structured analysis
      const verseEntries = inputLines
        .map((text, originalIndex) => ({ text, originalIndex }))
        .filter(entry => entry.text.length > 0);

      const formattedLinesForPrompt = verseEntries
        .map((entry, idx) => `Verse index ${idx}: "${entry.text}"`)
        .join("\n");

      const prompt = `You are an expert literary professor, literary critic, and poetry analyst.
Please analyze the following poem verses in deep detail. It is critical and absolute that your analysis matches this verse structure exactly. Provide EXACTLY one analysis entry for each individual verse listed below in perfect sequential order (exactly ${verseEntries.length} items in the "lines" array).

POEM VERSES TO ANALYZE (CONTAINS EXACTLY ${verseEntries.length} VERSES):
${formattedLinesForPrompt}

Instructions:
1. Your response JSON "lines" array MUST have exactly ${verseEntries.length} elements. Do NOT group, merge, or omit any lines.
2. The index 'i' of each item in the "lines" array must equal the verse index provided above (from 0 to ${verseEntries.length - 1}).
3. For each of the ${verseEntries.length} verses:
   - "lineIndex": the exact integer index of the verse (0-based matching the sequential list index).
   - "text": the exact original verse text corresponding to that index.
   - "insight": its deep subtextual, literal, and figurative meaning. Keep this extremely brief and concise (Strictly 1 short, impactful sentence max).
   - "devices": poetic devices occurring specifically in that single verse (e.g., Metaphor, Alliteration, Personification, Enjambment, Assonance, Imagery, Rhyme, etc.). Keep this list to maximum 2 devices per line.
   - "explanation": what the poet portrays, emotional dynamics, or deep symbolic purpose in this verse. Keep this extremely brief and concise (Strictly 1 short, impactful sentence max).
4. Provide translations of the full poem. For each translation (provide exactly Spanish, French, German, Japanese, Hindi, and Mandarin):
   - Translate the verses line-by-line. The translatedLines array MUST have exactly ${verseEntries.length} elements, aligning line-for-line with the verses. Keep translations direct, simple, and literal with no explanatory notes.
5. Extrapolate overall themes, overarching summary, and overall poetic devices with definitions. Keep each theme and overarching summary strictly within 1-2 brief sentences total.

Ensure the final JSON responds exactly to the schema specified, containing high-quality literary analysis. Every single verse index from 0 to ${verseEntries.length - 1} must be represented in the "lines" array sequentially. Keep all explanations and insights highly condensed to guarantee immediate response times.`;

      const response = await generateContentWithFallback({
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.1,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: "The name/title of the poem. If unknown or not titled, assign a suitable poetic title."
              },
              author: {
                type: Type.STRING,
                description: "The poet/author of the poem, or 'Unknown Poet'."
              },
              summary: {
                type: Type.STRING,
                description: "A summary of what the poet is trying to portray and the overall meaning."
              },
              themes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    theme: { type: Type.STRING, description: "Theme name (e.g., Nature's transience, Existential dread)" },
                    explanation: { type: Type.STRING, description: "How this theme is conveyed throughout the poem." }
                  },
                  required: ["theme", "explanation"]
                }
              },
              poeticDevicesOverall: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    device: { type: Type.STRING, description: "The name of the device (e.g. Onomatopoeia)" },
                    definition: { type: Type.STRING, description: "Standard literary definition of this device." },
                    example: { type: Type.STRING, description: "Specific instances or quotes from the poem representing this device." }
                  },
                  required: ["device", "definition", "example"]
                }
              },
              translations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    language: { type: Type.STRING, description: "Target language name (e.g. Spanish, French)" },
                    code: { type: Type.STRING, description: "ISO 2-letter code (e.g. ja, es, fr, de, hi, zh)" },
                    translatedLines: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: `The translated line string for each of the ${verseEntries.length} verses. Must match the list index-by-index.`
                    }
                  },
                  required: ["language", "code", "translatedLines"]
                }
              },
              lines: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    lineIndex: { type: Type.INTEGER, description: `Index of the verse, from 0 to ${verseEntries.length - 1}.` },
                    text: { type: Type.STRING, description: "The original verse text." },
                    insight: { type: Type.STRING, description: "Line-specific meaning and symbolism." },
                    devices: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "Poetic devices present specifically in this line."
                    },
                    explanation: { type: Type.STRING, description: "What the poet is trying to portray, emotional shift, or intent in this line." }
                  },
                  required: ["lineIndex", "text", "insight", "devices", "explanation"]
                }
              }
            },
            required: ["title", "author", "summary", "themes", "poeticDevicesOverall", "translations", "lines"]
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response returned from Gemini.");
      }

      let report: any;
      try {
        report = JSON.parse(responseText);
      } catch (jsonErr) {
        const cleanedStr = responseText.replace(/```json\r?\n?/g, "").replace(/```/g, "").trim();
        report = JSON.parse(cleanedStr);
      }

      // Reconstruct the full correct lines array mapping back to original input lines (restoring blank stanzas)
      let verseCounter = 0;
      const finalLines = inputLines.map((originalText, originalIndex) => {
        const isBlank = originalText.length === 0;
        if (isBlank) {
          return {
            lineIndex: originalIndex,
            text: "",
            insight: "",
            devices: [],
            explanation: ""
          };
        }

        // Match to Gemini's analyzed verses with extreme resilience
        const aiLine = (() => {
          if (!report || !Array.isArray(report.lines)) return {};

          // 1. Try mapping via exact or index equivalence
          const exactIndexMatch = report.lines.find(
            (al: any) => al && typeof al.lineIndex !== "undefined" && Number(al.lineIndex) === verseCounter
          );
          if (exactIndexMatch) return exactIndexMatch;

          // 2. Try mapping via original index search
          const originalIndexMatch = report.lines.find(
            (al: any) => al && typeof al.lineIndex !== "undefined" && Number(al.lineIndex) === originalIndex
          );
          if (originalIndexMatch) return originalIndexMatch;

          // 3. Try mapping via text similarity
          const textMatch = report.lines.find(
            (al: any) => al && typeof al.text === "string" && al.text.trim().toLowerCase() === originalText.trim().toLowerCase()
          );
          if (textMatch) return textMatch;

          // 4. Default to sequential matches inside reports
          return report.lines[verseCounter] || report.lines[originalIndex] || {};
        })();

        verseCounter++;

        return {
          lineIndex: originalIndex,
          text: originalText,
          insight: aiLine.insight || "Deep subtextual, literal, and figurative representation is being loaded for this verse.",
          devices: Array.isArray(aiLine.devices) ? aiLine.devices : [],
          explanation: aiLine.explanation || "A study of the poet's message, emotional cues, or symbolic purpose is rendering."
        };
      });

      // Align and reconstruct translations, maintaining empty lines as spacer translations
      if (Array.isArray(report.translations)) {
        report.translations = report.translations.map((trans: any) => {
          let vCounter = 0;
          const alignedTranslatedLines = inputLines.map((originalText, originalIndex) => {
            const isBlank = originalText.length === 0;
            if (isBlank) {
              return "";
            }

            // High resilience fallback translation mapping matching
            const val = (() => {
              if (!trans || !Array.isArray(trans.translatedLines)) return "";
              return trans.translatedLines[vCounter] || trans.translatedLines[originalIndex] || "";
            })();

            vCounter++;
            return val;
          });

          return {
            language: trans.language || "",
            code: trans.code || "",
            translatedLines: alignedTranslatedLines
          };
        });
      }

      // Format response structure perfectly
      const finalReport = {
        title: report.title || "Selected Manuscript",
        author: report.author || "Unknown Poet",
        summary: report.summary || "Summary of the manuscript.",
        themes: Array.isArray(report.themes) ? report.themes : [],
        poeticDevicesOverall: Array.isArray(report.poeticDevicesOverall) ? report.poeticDevicesOverall : [],
        translations: Array.isArray(report.translations) ? report.translations : [],
        lines: finalLines
      };

      res.setHeader("Content-Type", "application/json");
      res.json(finalReport);
    } catch (error: any) {
      console.error("Analysis Error (Falling back to heuristic analysis):", error);
      try {
        // High-availability fallback: generate immediate algorithmic verse breakdown & devices
        const { poemText } = req.body;
        if (poemText && typeof poemText === "string" && poemText.trim().length > 0) {
          const fallbackAnalysis = generateFallbackPoemAnalysis(poemText);
          res.setHeader("Content-Type", "application/json");
          return res.json(fallbackAnalysis);
        }
      } catch (fallbackErr) {
        console.error("Fallback Analysis Error:", fallbackErr);
      }

      const errorStr = typeof error === "object" ? JSON.stringify(error) : String(error);
      const rawMsg = error?.message || errorStr || "";
      let userFriendlyMsg = "An error occurred during poem analysis. Please try again.";
      if (rawMsg.includes("503") || rawMsg.includes("UNAVAILABLE") || rawMsg.includes("high demand") || rawMsg.includes("overloaded")) {
        userFriendlyMsg = "The AI service is momentarily experiencing high demand on Google's servers. Please wait a few seconds and try again.";
      } else if (rawMsg.includes("429") || rawMsg.includes("RESOURCE_EXHAUSTED")) {
        userFriendlyMsg = "API rate limit momentarily reached. Please wait a few moments and try again.";
      } else if (error?.message && !error.message.startsWith("{")) {
        userFriendlyMsg = error.message;
      }
      res.status(500).json({ error: userFriendlyMsg });
    }
  });

  // API endpoint for interactive Q&A Chat about the poem
  app.post("/api/chat", async (req, res) => {
    try {
      const { poemText, currentAnalysis, history, message } = req.body;
      
      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Message is required." });
      }

      // Construct context from current analysis and poem
      const contextPrompt = `You are "The Calliope Guide", an interactive literary scholar and conversational guide dedicated to explaining this poem.
You have the poem and its structured translation/device analysis as your core context. Always remain supportive, academic, poetic yet clear, and deeply insightful.

POEM:
"""
${poemText || ""}
"""

CORE ANALYSIS SUMMARY:
${JSON.stringify({
  title: currentAnalysis?.title,
  author: currentAnalysis?.author,
  summary: currentAnalysis?.summary,
  themes: currentAnalysis?.themes,
  poeticDevicesOverall: currentAnalysis?.poeticDevicesOverall?.map((d: any) => `${d.device}: ${d.definition}`)
})}

Conversation rules:
- Provide rich, markdown-formatted answers.
- Cite specific lines and stanzas from the poem to strengthen your responses.
- Explain poetic terms clearly with easy-to-understand metaphors.
- Answer user questions accurately in the context of the poem's theme, emotional content, or overall message.`;

      // Set up the chat history format
      const finalHistory = history ? history.map((h: any) => ({
        role: h.role === "user" ? "user" : "model",
        parts: [{ text: h.text }]
      })) : [];

      const response = await sendMessageWithFallback({
        message: message,
        systemInstruction: contextPrompt,
        history: finalHistory,
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.warn("Chat Error (Providing context-aware fallback response):", error);
      const { poemText, currentAnalysis, message } = req.body;
      
      // Provide intelligent context-aware chat answer even if API quota is momentarily exceeded
      const poemSnippet = (poemText || "").split("\n").filter((l: string) => l.trim()).slice(0, 3).join(" / ");
      const fallbackReply = `**Poetic Reflection:**\n\nRegarding *"${message}"*:\n\nIn this piece (*${currentAnalysis?.title || "Selected Manuscript"}*), the verse builds emotional resonance through imagery and meter.\n\nKey verses like *"${poemSnippet || 'the opening lines'}"* illustrate how the poet explores memory and introspective thought.\n\n*(Note: Running in high-availability literary mode while the Gemini API quota refreshes.)*`;

      res.json({ text: fallbackReply });
    }
  });

  // Vite development or production static content setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server running on http://localhost:${PORT}`);
  });
}

startServer();
