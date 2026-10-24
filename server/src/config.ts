import dotenv from 'dotenv';
import { ThinkingLevel } from '@google/genai';

dotenv.config();

const PLACEHOLDER_KEY = 'YOUR_GEMINI_API_KEY_HERE';

function parseList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseThinkingLevel(value: string | undefined): ThinkingLevel | undefined {
  const level = value?.trim().toUpperCase();
  if (!level) return undefined;
  if (level in ThinkingLevel) return ThinkingLevel[level as keyof typeof ThinkingLevel];
  console.warn(`⚠️  GEMINI_THINKING_LEVEL="${value}" inconnu (minimal, low, medium ou high) — ignoré.`);
  return undefined;
}

const apiKey = process.env.GEMINI_API_KEY?.trim() ?? '';
const primaryModel = process.env.GEMINI_MODEL?.trim() || 'gemma-4-26b-a4b-it';
const fallbackModels = parseList(process.env.GEMINI_FALLBACK_MODELS ?? 'gemma-4-31b-it');

export const config = {
  port: Number(process.env.PORT) || 3001,
  geminiApiKey: apiKey === PLACEHOLDER_KEY ? '' : apiKey,
  // Modèle principal puis modèles de secours, essayés dans cet ordre
  models: [...new Set([primaryModel, ...fallbackModels])],
  // Budget total d'une analyse, tous modèles et tentatives confondus
  timeoutMs: Number(process.env.GEMINI_TIMEOUT_MS) || 60_000,
  thinkingLevel: parseThinkingLevel(process.env.GEMINI_THINKING_LEVEL),
  corsOrigins: parseList(
    process.env.CORS_ORIGINS ??
      'http://localhost:5173,http://localhost:5174,http://localhost:4173,http://localhost:3000'
  ),
};

export const isAiConfigured = (): boolean => config.geminiApiKey !== '';
