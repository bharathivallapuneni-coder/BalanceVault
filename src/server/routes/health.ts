import express, { type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.ts';
import { isRateLimiterHealthy } from '../rateLimiter.ts';
import { logAudit } from '../audit.ts';

const router = express.Router();

// Health Check
router.get('/health', (req: Request, res: Response) => {
  return res.status(200).json({
    status: 'UP',
    uptimeSeconds: Math.floor(process.uptime()),
    service: 'BalanceVault Core API',
    timestamp: new Date().toISOString(),
  });
});

// Readiness Probe
router.get('/ready', (req: Request, res: Response) => {
  const isDbReady = db.isHealthy();
  const isRateLimitReady = isRateLimiterHealthy();

  const isSystemReady = isDbReady && isRateLimitReady;

  const payload = {
    status: isSystemReady ? 'READY' : 'NOT_READY',
    checks: {
      database: isDbReady ? 'UP' : 'DOWN',
      rateLimiter: isRateLimitReady ? 'UP' : 'DOWN',
    },
    timestamp: new Date().toISOString(),
  };

  if (!isSystemReady) {
    return res.status(503).json(payload);
  }

  return res.status(200).json(payload);
});

// Protected or Idempotent Administrator Bootstrap Information / Trigger
router.post('/system/bootstrap-admin', async (req: Request, res: Response) => {
  const existingAdmins = db.getUsers().filter((u) => u.role === 'ADMIN');
  if (existingAdmins.length > 0) {
    return res.status(200).json({
      message: 'Initial administrator is already provisioned.',
      adminEmail: existingAdmins[0].email,
      alreadyExists: true,
    });
  }

  const email = (process.env.BOOTSTRAP_ADMIN_EMAIL || 'admin@balancevault.internal').toLowerCase().trim();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD || 'VaultAdmin@2026!';
  const name = process.env.BOOTSTRAP_ADMIN_NAME || 'Platform Master Admin';

  const passwordHash = await bcrypt.hash(password, 10);
  const newAdmin = db.createUser({
    fullName: name,
    email,
    phone: '+1 (555) 019-2831',
    passwordHash,
    role: 'ADMIN',
    status: 'ACTIVE',
  });

  logAudit({
    req,
    actorId: newAdmin.id,
    actorEmail: newAdmin.email,
    action: 'BOOTSTRAP_FIRST_ADMIN_CREATED',
    targetType: 'SYSTEM',
    targetId: newAdmin.id,
    result: 'SUCCESS',
    metadata: { source: 'api_bootstrap_trigger' },
  });

  return res.status(201).json({
    message: 'Master administrator successfully initialized.',
    adminEmail: newAdmin.email,
    alreadyExists: false,
  });
});

export default router;
