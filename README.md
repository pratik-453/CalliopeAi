# Poetry Analyzer & Translator

An interactive, immersive dark-themed web application that provides smart, line-by-line poetic analysis, translation, highlighting of poetic devices, and immediate contextual Q&A using the Gemini API.

## Features

- **Dynamic Interactive Poem Theater**: Render and study poems with line-by-line breakdown, immersive ambient audio soundscapes, and dark celestial backdrops (Nebula Glow, Moving Beam, and Clean Slate).
- **Intelligent Gemini Analysis & Translation**: Retrieve deep insights, theme breakdowns, imagery analysis, rhyme scheme tracking, and dynamic line-by-line translations using specialized fast LLM queries.
- **Poetic Device Highlighting**: Effortlessly visualize and highlight standard poetic devices such as Alliteration, Metaphors, Personification, Assonance, and Imagery.
- **Contextual Poem Q&A**: Speak or type questions and get instant, grounded literary analysis of the current poem by interacting with the Gemini-powered server context.

---

## Architecture Overview

The codebase is structured as a full-stack Node.js application combining a responsive React frontend with a high-performance Express.js backend proxy:

- **Frontend (`/src`)**: Styled with Tailwind CSS, utilizing `lucide-react` for polished visual icons and motion animations via `motion/react`.
- **Backend (`server.ts`)**: Built on Express.js to keep API keys hidden and execute server-side communications with Google GenAI API safely.

---

## Prerequisites

To run this application, you will need:

- **Node.js** (v18 or higher recommended)
- **NPM** (or your preferred package manager)
- A **Gemini API Key** from Google AI Studio.

---

## Installation & Setup

1. **Clone and Navigate to the Repository:**
   ```bash
   git clone <your-repository-url>
   cd poetry-analyzer-translator
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and add your Gemini API Key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
   *(Ensure you do not commit your `.env` file containing actual secrets to public source control.)*

---

## Available Scripts

In the project directory, you can run the following commands:

### Development Mode
Starts both the frontend development proxy and backend API server simultaneously.
```bash
npm run dev
```
Open your browser to the local server URL (e.g., `http://localhost:3000`) to view and interact with the application.

### Production Build
Builds the React client-side assets into the optimized static production folder (`dist/`) and packages the fast backend routing server utilizing Node compiler scripts.
```bash
npm run build
```

### Production Run
Runs the fully bundled, self-contained production server.
```bash
npm run start
```

### Code Verification
Check TypeScript typings and locate potential errors before deploying:
```bash
npm run lint
```

---

## License

This project is licensed under the MIT License. Feel free to use and adapt it for your own educational and poetic pursuits!
