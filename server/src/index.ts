import express, { ErrorRequestHandler } from 'express';
import cors from 'cors';
import { config, isAiConfigured } from './config';
import { AppError } from './errors';
import { orientationRouter } from './routes/orientation';

const app = express();

app.disable('x-powered-by');

app.use(cors({
  origin: config.corsOrigins,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json({ limit: '10kb' }));

app.use('/api', orientationRouter);

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    ai: { configured: isAiConfigured(), models: config.models },
  });
});

// Handler 404
app.use((_req, res) => {
  res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Route introuvable' });
});

// Gestion centralisée des erreurs : toujours une réponse JSON, jamais de pile d'appels
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({ success: false, code: err.code, message: err.message });
  }

  // Erreurs de body-parser : JSON mal formé (400), corps trop volumineux (413)
  const status = typeof err?.status === 'number' ? err.status : 500;
  if (status < 500) {
    return res.status(status).json({ success: false, code: 'INVALID_REQUEST', message: 'Requête invalide.' });
  }

  console.error('Erreur serveur :', err);
  res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: 'Erreur interne du serveur.' });
};

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`✅ Serveur Orienteme démarré sur http://localhost:${config.port}`);
  console.log(`📋 Modèles (ordre d'essai) : ${config.models.join(' → ')}`);

  if (!isAiConfigured()) {
    console.warn('⚠️  AVERTISSEMENT: GEMINI_API_KEY non configurée dans server/.env');
    console.warn('   Seul le mode démonstration sera disponible.');
  }
});
