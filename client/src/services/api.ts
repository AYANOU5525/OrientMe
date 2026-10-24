import axios from 'axios';
import type { ApiResponse, DemandeOrientation } from '../types';

// En développement, Vite relaie /api vers le serveur Express (voir vite.config.ts)
const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  // Un peu plus que le budget côté serveur (GEMINI_TIMEOUT_MS, 60 s par défaut)
  timeout: 75000,
  headers: { 'Content-Type': 'application/json' },
});

// Codes renvoyés par le serveur, plus NETWORK et TIMEOUT détectés côté client
export type CodeErreur =
  | 'AI_NOT_CONFIGURED'
  | 'AI_QUOTA'
  | 'AI_TIMEOUT'
  | 'AI_INVALID_RESPONSE'
  | 'AI_UNAVAILABLE'
  | 'RATE_LIMITED'
  | 'INVALID_INPUT'
  | 'NETWORK'
  | 'TIMEOUT'
  | 'UNKNOWN';

export class ErreurOrientation extends Error {
  readonly code: CodeErreur;

  constructor(message: string, code: CodeErreur) {
    super(message);
    this.name = 'ErreurOrientation';
    this.code = code;
  }
}

function versErreurOrientation(error: unknown): ErreurOrientation {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as { code?: CodeErreur; message?: string } | undefined;
    if (body?.message) {
      return new ErreurOrientation(body.message, body.code ?? 'UNKNOWN');
    }
    if (error.code === 'ECONNABORTED') {
      return new ErreurOrientation(
        'Le serveur met trop de temps à répondre. Réessaie dans un instant.',
        'TIMEOUT'
      );
    }
    // Pas de réponse JSON : serveur arrêté ou injoignable (le proxy Vite répond alors sans corps)
    return new ErreurOrientation(
      'Impossible de joindre le serveur d\'orientation. Vérifie qu\'il est bien démarré.',
      'NETWORK'
    );
  }
  return new ErreurOrientation('Une erreur inattendue est survenue.', 'UNKNOWN');
}

export async function soumettreOrientation(demande: DemandeOrientation): Promise<ApiResponse> {
  try {
    const response = await api.post<ApiResponse>('/orientation', demande);
    return response.data;
  } catch (error) {
    throw versErreurOrientation(error);
  }
}

export async function getDemo(): Promise<ApiResponse> {
  try {
    const response = await api.get<ApiResponse>('/demo');
    return response.data;
  } catch (error) {
    throw versErreurOrientation(error);
  }
}
