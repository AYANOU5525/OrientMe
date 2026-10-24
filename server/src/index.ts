import express, { ErrorRequestHandler } from 'express';
import cors from 'cors';
import { existsSync } from 'fs';
import { join } from 'path';
import { config, isAiConfigured } from './config';
import { AppError } from './errors';
import { orientationRouter } from './routes/orientation';

const app = express();

app.disable('x-powered-by');
if (config.trustProxy) app.set('trust proxy', 1);

app.use(cors({
  origin: config.corsOrigins,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Assez pour une discussion avec son historique (12 messages au plus)
app.use(express.json({ limit: '64kb' }));

app.use('/api', orientationRouter);

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    ai: { configured: isAiConfigured(), models: config.models },
  });
});

// En production, le serveur distribue aussi l'interface compilée (client/dist) : un seul service à héberger
const clientDist = join(__dirname, '../../client/dist');
if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^(?!\/api\/|\/health$).*/, (_req, res) => {
    res.sendFile(join(clientDist, 'index.html'));
  });
}

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
  if (existsSync(clientDist)) console.log('🌐 Interface distribuée depuis client/dist');

  if (!isAiConfigured()) {
    console.warn('⚠️  AVERTISSEMENT: GEMINI_API_KEY non configurée dans server/.env');
    console.warn('   Aucune orientation ne pourra être générée.');
  }
  if (!config.adminToken) {
    console.log('ℹ️  Espace conseillers désactivé (ADMIN_TOKEN non défini).');
  }
});
