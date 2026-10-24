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

// Toute orientation doit être produite par un modèle Gemma : un autre modèle bloque le démarrage
export function parseModels(primary: string | undefined, fallbacks: string): string[] {
  const models = [...new Set([primary?.trim() || 'gemma-4-26b-a4b-it', ...parseList(fallbacks)])];
  const nonGemma = models.filter((model) => !/^gemma-/i.test(model));
  if (nonGemma.length > 0) {
    throw new Error(
      `Seuls les modèles Gemma sont autorisés dans GEMINI_MODEL et GEMINI_FALLBACK_MODELS (refusé : ${nonGemma.join(', ')}).`
    );
  }
  return models;
}

const apiKey = process.env.GEMINI_API_KEY?.trim() ?? '';

export const config = {
  port: Number(process.env.PORT) || 3001,
  geminiApiKey: apiKey === PLACEHOLDER_KEY ? '' : apiKey,
  // Modèle principal puis modèles de secours, essayés dans cet ordre
  models: parseModels(process.env.GEMINI_MODEL, process.env.GEMINI_FALLBACK_MODELS ?? 'gemma-4-31b-it'),
  // Budget total d'une analyse, tous modèles et tentatives confondus
  timeoutMs: Number(process.env.GEMINI_TIMEOUT_MS) || 60_000,
  // Réflexion minimale par défaut : mesuré sur Gemma 4, ~20 s au lieu de 45 à 110 s, réponses aussi valides
  thinkingLevel: parseThinkingLevel(process.env.GEMINI_THINKING_LEVEL ?? 'minimal'),
  corsOrigins: parseList(
    process.env.CORS_ORIGINS ??
      'http://localhost:5173,http://localhost:5174,http://localhost:4173,http://localhost:3000'
  ),
};

export const isAiConfigured = (): boolean => config.geminiApiKey !== '';
