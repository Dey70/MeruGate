import Groq from "groq-sdk";

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const CHAT_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
export const CHAT_MAX_TOKENS = 4096;
