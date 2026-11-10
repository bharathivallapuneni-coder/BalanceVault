import express, { type Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db, type IdType } from '../db.ts';
import { authenticate, type AuthenticatedRequest } from '../auth.ts';
import { rateLimiter } from '../rateLimiter.ts';
import { logAudit } from '../audit.ts';

const router = express.Router();

// Protect all routes with authentication
router.use(authenticate);

const profileUpdateSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: z.string().min(7, 'Phone number must be at least 7 characters').optional(),
});

const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters long')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'New passwords do not match',
    path: ['confirmNewPassword'],
  });

const onboardingSubmitSchema = z.object({
  residentialAddress: z.string().min(5, 'Residential address must be at least 5 characters'),
  dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), 'Valid date of birth required'),
  identificationType: z.enum(['PASSPORT', 'NATIONAL_ID', 'DRIVERS_LICENSE'] as [IdType, ...IdType[]]),
  identificationNumber: z.string().min(4, 'Identification document number is required'),
});

// Profile endpoints
router.get('/profile', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const account = db.findAccountByUserId(user.id);
  const onboarding = db.findOnboardingByUserId(user.id);

  return res.status(200).json({
    profile: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      account,
      onboardingStatus: onboarding?.status || 'NOT_SUBMITTED',
    },
  });
});

router.put('/profile', (req: AuthenticatedRequest, res: Response) => {
  const parseResult = profileUpdateSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: 'Validation Error',
      details: parseResult.error.flatten().fieldErrors,
    });
  }

  const user = req.user!;
  const updatedUser = db.updateUser(user.id, parseResult.data);

  logAudit({
    req,
    actorId: user.id,
    actorEmail: user.email,
    action: 'USER_PROFILE_UPDATED',
    targetType: 'USER',
    targetId: user.id,
    result: 'SUCCESS',
    metadata: { updatedFields: Object.keys(parseResult.data) },
  });

  return res.status(200).json({
    message: 'Personal details updated successfully.',
    user: {
      id: updatedUser?.id,
      fullName: updatedUser?.fullName,
      email: updatedUser?.email,
      phone: updatedUser?.phone,
    },
  });
});

router.post(
  '/change-password',
  rateLimiter({ windowSeconds: 60, maxRequests: 5, keyPrefix: 'rl:pwchange' }),
  async (req: AuthenticatedRequest, res: Response) => {
    const parseResult = passwordChangeSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation Error',
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const user = req.user!;
    const isCurrentMatch = await bcrypt.compare(parseResult.data.currentPassword, user.passwordHash);
    if (!isCurrentMatch) {
      logAudit({
        req,
        actorId: user.id,
        actorEmail: user.email,
        action: 'USER_PASSWORD_CHANGE_FAILED',
        targetType: 'USER',
        targetId: user.id,
        result: 'FAILURE',
        metadata: { reason: 'Incorrect current password' },
      });
      return res.status(400).json({
        error: 'Bad Request',
        message: 'The current password provided does not match our records.',
      });
    }

    const newHash = await bcrypt.hash(parseResult.data.newPassword, 10);
    db.updateUser(user.id, { passwordHash: newHash });

    logAudit({
      req,
      actorId: user.id,
      actorEmail: user.email,
      action: 'USER_PASSWORD_CHANGED',
      targetType: 'USER',
      targetId: user.id,
      result: 'SUCCESS',
    });

    db.createNotification(
      user.id,
      'Security Alert: Password Changed',
      'Your account password was updated successfully. If you did not perform this action, please alert administrator staff immediately.'
    );

    return res.status(200).json({
      message: 'Password changed successfully. Please keep your credentials secure.',
    });
  }
);

// Account endpoints
router.get('/account', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const account = db.findAccountByUserId(user.id);
  return res.status(200).json({ account });
});

// Onboarding endpoints
router.get('/onboarding', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const onboarding = db.findOnboardingByUserId(user.id);
  return res.status(200).json({ onboarding });
});

router.post('/onboarding', (req: AuthenticatedRequest, res: Response) => {
  const parseResult = onboardingSubmitSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: 'Validation Error',
      details: parseResult.error.flatten().fieldErrors,
    });
  }

  const user = req.user!;
  const existingOnboarding = db.findOnboardingByUserId(user.id);

  if (existingOnboarding && existingOnboarding.status === 'APPROVED') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Your onboarding application has already been approved and your account is active.',
    });
  }

  if (existingOnboarding && existingOnboarding.status === 'UNDER_REVIEW') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Your verification submission is currently under active compliance review.',
    });
  }

  const now = new Date().toISOString();
  const updatedOnboarding = db.upsertOnboarding(user.id, {
    residentialAddress: parseResult.data.residentialAddress,
    dateOfBirth: parseResult.data.dateOfBirth,
    identificationType: parseResult.data.identificationType,
    identificationNumber: parseResult.data.identificationNumber,
    status: 'PENDING',
    rejectionReason: null,
    submittedAt: now,
  });

  logAudit({
    req,
    actorId: user.id,
    actorEmail: user.email,
    action: 'ONBOARDING_SUBMITTED',
    targetType: 'ONBOARDING',
    targetId: updatedOnboarding.id,
    result: 'SUCCESS',
    metadata: {
      identificationType: parseResult.data.identificationType,
      isResubmission: !!existingOnboarding && existingOnboarding.status === 'REJECTED',
    },
  });

  db.createNotification(
    user.id,
    'Onboarding Submitted',
    'Your identity documents have been submitted and queued for administrator compliance review.'
  );

  return res.status(200).json({
    message: 'Onboarding application submitted successfully.',
    onboarding: updatedOnboarding,
  });
});

// Notifications
router.get('/notifications', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const notifications = db.getNotificationsByUserId(user.id);
  return res.status(200).json({ notifications });
});

router.patch('/notifications/:id/read', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { id } = req.params;
  const ok = db.markNotificationAsRead(id, user.id);
  if (!ok) {
    return res.status(404).json({ error: 'Not Found', message: 'Notification not found' });
  }
  return res.status(200).json({ message: 'Notification marked as read.' });
});

export default router;
