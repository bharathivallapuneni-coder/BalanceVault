import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import authRoutes from './src/server/routes/auth.js';
import userRoutes from './src/server/routes/users.js';
import adminRoutes from './src/server/routes/admin.js';
import healthRoutes from './src/server/routes/health.js';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';

// Express Security & Parsers
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Custom Security Headers
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// REST API Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// API 404 handler for undefined API routes
app.all('/api/*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `API endpoint '${req.method} ${req.originalUrl}' does not exist.`,
  });
});

// Centralized Error Boundary
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  console.error('[SERVER_ERROR]', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: isProduction ? 'An unexpected server error occurred.' : err.message || 'Server error',
  });
});

async function startServer() {
  if (!isProduction) {
    // Mount Vite development server middlewares
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve built frontend from dist
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[BALANCEVAULT] Full-stack application running on port ${PORT} (dev=${!isProduction})`);
  });
}

startServer().catch((err) => {
  console.error('[FATAL] Failed to boot BalanceVault server:', err);
  process.exit(1);
});
