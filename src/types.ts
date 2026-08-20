export interface Theme {
  theme: string;
  explanation: string;
}

export interface PoeticDeviceOverall {
  device: string;
  definition: string;
  example: string;
}

export interface Translation {
  language: string;
  code: string;
  translatedLines: string[];
}

export interface PoemLine {
  lineIndex: number;
  text: string;
  insight: string;
  devices: string[];
  explanation: string;
}

export interface PoemAnalysis {
  title: string;
  author: string;
  summary: string;
  themes: Theme[];
  poeticDevicesOverall: PoeticDeviceOverall[];
  translations: Translation[];
  lines: PoemLine[];
  isInstantFallback?: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
}
