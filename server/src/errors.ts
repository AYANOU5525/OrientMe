export type AppErrorCode =
  | 'INVALID_INPUT'
  | 'AI_NOT_CONFIGURED'
  | 'AI_QUOTA'
  | 'AI_TIMEOUT'
  | 'AI_INVALID_RESPONSE'
  | 'AI_UNAVAILABLE';

// Erreur métier : `message` est destiné à l'utilisateur final, les détails techniques restent dans les logs
export class AppError extends Error {
  constructor(
    readonly code: AppErrorCode,
    readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}
