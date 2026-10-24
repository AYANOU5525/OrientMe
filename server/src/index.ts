import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { orientationRouter } from './routes/orientation';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json({ limit: '10kb' }));

// Rate limiting simple (en mémoire)
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW = 60 * 1000; // 1 minute

app.use('/api', (req, res, next) => {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const entry = requestCounts.get(ip);

  if (!entry || now > entry.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return next();
  }

  if (entry.count >= RATE_LIMIT) {
    return res.status(429).json({
      error: 'Trop de requêtes. Veuillez patienter une minute avant de réessayer.',
    });
  }

  entry.count++;
  next();
});

app.use('/api', orientationRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Handler 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Route introuvable' });
});

app.listen(PORT, () => {
  console.log(`✅ Serveur OrientaTogo AI démarré sur http://localhost:${PORT}`);
  console.log(`📋 Modèle Gemini: ${process.env.GEMINI_MODEL || 'gemini-2.0-flash'}`);

  if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️  AVERTISSEMENT: GEMINI_API_KEY non configurée dans server/.env');
    console.warn('   Le mode démonstration sera utilisé automatiquement.');
  }
});
