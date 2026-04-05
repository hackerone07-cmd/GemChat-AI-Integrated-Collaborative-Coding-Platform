import { GoogleGenerativeAI } from "@google/generative-ai";

// ── Validate key on startup ────────────────────────────────────────────────
const API_KEY = process.env.GOOGLE_API_KEY;

if (!API_KEY || API_KEY.trim() === "") {
  console.error(
    "\n❌  GOOGLE_API_KEY is missing from your .env file.\n" +
    "   Get a free key at https://aistudio.google.com/app/apikey\n" +
    "   Then add it to BACKEND/.env:  GOOGLE_API_KEY=your_key_here\n"
  );
}

const genAI = new GoogleGenerativeAI(API_KEY || "MISSING_KEY");

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
    temperature: 0.4,
  },
  systemInstruction: `You are an expert full-stack developer with 10+ years of MERN experience.
Always write modular, clean, well-commented code following best practices.
Handle errors and edge cases. Write scalable, maintainable code.

IMPORTANT: Always respond ONLY with valid JSON. No markdown fences. No extra text.

Response format:
{
  "text": "Your explanation here",
  "fileTree": {                          // include ONLY when generating code files
    "filename.js": {
      "file": {
        "contents": "// full file content here"
      }
    }
  },
  "buildCommand": { "mainItem": "npm", "commands": ["install"] },  // optional
  "startCommand": { "mainItem": "node", "commands": ["app.js"] }   // optional
}

For non-code questions, respond:
{ "text": "Your answer here" }

Rules:
- Never use filenames like routes/index.js
- Always include all imports in generated code
- Always handle async/await errors
`,
});

// ── Generate a response from Gemini AI ────────────────────────────────────
export const generateResult = async (prompt) => {
  if (!API_KEY || API_KEY.trim() === "") {
    throw new Error(
      "GOOGLE_API_KEY is not set. Add it to your BACKEND/.env file. " +
      "Get a free key at: https://aistudio.google.com/app/apikey"
    );
  }

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    // Give a human-readable message instead of the raw API error
    if (error.message?.includes("API_KEY_INVALID") || error.message?.includes("API Key not found")) {
      throw new Error(
        "Invalid Gemini API key. Your current key has been revoked or is incorrect. " +
        "Get a new free key at https://aistudio.google.com/app/apikey and update BACKEND/.env"
      );
    }
    if (error.message?.includes("QUOTA_EXCEEDED") || error.message?.includes("429")) {
      throw new Error(
        "Gemini API quota exceeded. Wait a minute and try again, or upgrade your plan at https://ai.google.dev"
      );
    }
    throw error;
  }
};