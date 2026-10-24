import { RequestHandler } from 'express';

// Limiteur simple en mémoire, par adresse IP (suffisant pour une seule instance du serveur)
export function rateLimit({ limit, windowMs }: { limit: number; windowMs: number }): RequestHandler {
  const hits = new Map<string, { count: number; resetTime: number }>();

  // Purge des fenêtres expirées pour que la Map ne grossisse pas indéfiniment
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of hits) {
      if (now > entry.resetTime) hits.delete(ip);
    }
  }, windowMs).unref();

  return (req, res, next) => {
    const ip = req.ip || 'unknown';
    const now = Date.now();
    const entry = hits.get(ip);

    if (!entry || now > entry.resetTime) {
      hits.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (entry.count >= limit) {
      res.setHeader('Retry-After', Math.ceil((entry.resetTime - now) / 1000));
      return res.status(429).json({
        success: false,
        code: 'RATE_LIMITED',
        message: 'Trop de requêtes. Patiente une minute avant de réessayer.',
      });
    }

    entry.count++;
    next();
  };
}
