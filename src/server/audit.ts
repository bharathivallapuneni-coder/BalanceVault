import type { Request } from 'express';
import { db } from './db.ts';

export interface AuditParams {
  req?: Request;
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  result: 'SUCCESS' | 'FAILURE' | 'BLOCKED';
  metadata?: Record<string, any>;
}

export function logAudit(params: AuditParams) {
  try {
    const rawIp = params.req
      ? (params.req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
        params.req.socket.remoteAddress ||
        '127.0.0.1'
      : '127.0.0.1';

    const userAgent = params.req ? params.req.headers['user-agent'] || 'unknown' : 'system';

    // Deep scrub confidential secrets
    const sanitizedMetadata: Record<string, any> = { ...(params.metadata || {}) };
    const forbiddenKeys = [
      'password',
      'currentPassword',
      'newPassword',
      'confirmPassword',
      'passwordHash',
      'token',
      'jwt',
      'authorization',
      'secret',
      'identificationNumber',
    ];

    for (const key of Object.keys(sanitizedMetadata)) {
      if (forbiddenKeys.some((f) => key.toLowerCase().includes(f.toLowerCase()))) {
        sanitizedMetadata[key] = '[REDACTED_FOR_SECURITY]';
      }
    }

    db.createAuditLog({
      actorId: params.actorId || null,
      actorEmail: params.actorEmail || null,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId || null,
      result: params.result,
      metadata: sanitizedMetadata,
      ipAddress: rawIp,
      userAgent: typeof userAgent === 'string' ? userAgent.substring(0, 200) : 'unknown',
    });
  } catch (err) {
    console.error('[AUDIT_ERROR] Failed to write audit log:', err);
  }
}
