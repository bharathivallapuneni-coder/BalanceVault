import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db, User, Role } from './db.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'balancevault_master_jwt_secret_key_2026';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '12h' }
  );
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication token missing or invalid.',
      });
    }

    const token = authHeader.substring(7).trim();
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: Role };

    const user = db.findUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Account not found or session revoked.',
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Account is ${user.status.toLowerCase()}. Please contact an administrator.`,
      });
    }

    req.user = user;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication session expired. Please log in again.',
      });
    }
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid session token signature.',
    });
  }
}

export function requireRole(...allowedRoles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied: You do not possess the required permissions.',
      });
    }
    next();
  };
}
