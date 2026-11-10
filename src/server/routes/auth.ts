import express, { type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '../db.ts';
import { authenticate, generateToken, type AuthenticatedRequest } from '../auth.ts';
import { rateLimiter } from '../rateLimiter.ts';
import { logAudit } from '../audit.ts';

const router = express.Router();

const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Full legal name must be at least 2 characters'),
    email: z.string().email('Valid email address required'),
    phone: z.string().min(7, 'Valid contact phone number required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Z]/, 'Password must include at least one uppercase letter')
      .regex(/[a-z]/, 'Password must include at least one lowercase letter')
      .regex(/[0-9]/, 'Password must include at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must include at least one special character'),
    confirmPassword: z.string(),
    residentialAddress: z.string().min(5, 'Residential address must be at least 5 characters'),
    dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), 'Valid date of birth required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const loginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required'),
});

// Registration Endpoint
router.post(
  '/register',
  rateLimiter({ windowSeconds: 60, maxRequests: 8, keyPrefix: 'rl:register' }),
  async (req: Request, res: Response) => {
    try {
      const parseResult = registerSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'One or more required registration fields failed validation.',
          details: parseResult.error.flatten().fieldErrors,
        });
      }

      const { fullName, email, phone, password, residentialAddress, dateOfBirth } = parseResult.data;
      const normalizedEmail = email.toLowerCase().trim();

      const existingUser = db.findUserByEmail(normalizedEmail);
      if (existingUser) {
        logAudit({
          req,
          actorEmail: normalizedEmail,
          action: 'USER_REGISTRATION_FAILED',
          targetType: 'USER',
          result: 'FAILURE',
          metadata: { reason: 'Email already registered' },
        });
        return res.status(409).json({
          error: 'Conflict',
          message: 'An account with this email address already exists. Please sign in.',
        });
      }

      // Salt and hash password (bcrypt)
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // ALWAYS assign ACCOUNT_HOLDER role for public registration
      const newUser = db.createUser({
        fullName: fullName.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        passwordHash,
        role: 'ACCOUNT_HOLDER',
        status: 'ACTIVE',
      });

      // Create linked account record
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const accountRef = `BV-${Date.now().toString().slice(-6)}-${randomSuffix}`;
      const newAccount = db.createAccount({
        accountReference: accountRef,
        userId: newUser.id,
        accountType: 'STANDARD_CHECKING',
        status: 'PENDING_ONBOARDING',
      });

      // Create pending onboarding application
      const newOnboarding = db.upsertOnboarding(newUser.id, {
        residentialAddress,
        dateOfBirth,
        identificationType: 'NATIONAL_ID',
        identificationNumber: 'PENDING_VERIFICATION',
        status: 'PENDING',
        rejectionReason: null,
      });

      // Create initial notification
      db.createNotification(
        newUser.id,
        'Welcome to BalanceVault!',
        `Your account profile has been created with Reference #${accountRef}. Please submit your identity verification documents to finalize onboarding.`
      );

      logAudit({
        req,
        actorId: newUser.id,
        actorEmail: newUser.email,
        action: 'USER_REGISTERED',
        targetType: 'USER',
        targetId: newUser.id,
        result: 'SUCCESS',
        metadata: { role: 'ACCOUNT_HOLDER', accountRef },
      });

      return res.status(201).json({
        message: 'Account registration completed successfully.',
        user: {
          id: newUser.id,
          fullName: newUser.fullName,
          email: newUser.email,
          role: newUser.role,
          accountReference: newAccount.accountReference,
          onboardingStatus: newOnboarding.status,
        },
      });
    } catch (err: any) {
      console.error('[AUTH_REGISTER_ERROR]', err);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to process user registration.',
      });
    }
  }
);

// Login Endpoint
router.post(
  '/login',
  rateLimiter({ windowSeconds: 60, maxRequests: 6, keyPrefix: 'rl:login' }),
  async (req: Request, res: Response) => {
    try {
      const parseResult = loginSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Please provide both valid email and password.',
          details: parseResult.error.flatten().fieldErrors,
        });
      }

      const { email, password } = parseResult.data;
      const normalizedEmail = email.toLowerCase().trim();

      const user = db.findUserByEmail(normalizedEmail);
      if (!user) {
        logAudit({
          req,
          actorEmail: normalizedEmail,
          action: 'USER_LOGIN_FAILED',
          targetType: 'AUTH',
          result: 'FAILURE',
          metadata: { reason: 'User not found' },
        });
        return res.status(401).json({
          error: 'Invalid Credentials',
          message: 'Invalid email address or password provided.',
        });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        logAudit({
          req,
          actorId: user.id,
          actorEmail: user.email,
          action: 'USER_LOGIN_FAILED',
          targetType: 'AUTH',
          targetId: user.id,
          result: 'FAILURE',
          metadata: { reason: 'Password mismatch' },
        });
        return res.status(401).json({
          error: 'Invalid Credentials',
          message: 'Invalid email address or password provided.',
        });
      }

      if (user.status !== 'ACTIVE') {
        logAudit({
          req,
          actorId: user.id,
          actorEmail: user.email,
          action: 'USER_LOGIN_BLOCKED',
          targetType: 'AUTH',
          targetId: user.id,
          result: 'BLOCKED',
          metadata: { status: user.status },
        });
        return res.status(403).json({
          error: 'Account Suspended',
          message: `Your account status is ${user.status}. Please contact compliance administration.`,
        });
      }

      const token = generateToken(user);
      const account = db.findAccountByUserId(user.id);
      const onboarding = db.findOnboardingByUserId(user.id);

      logAudit({
        req,
        actorId: user.id,
        actorEmail: user.email,
        action: 'USER_LOGIN_SUCCESS',
        targetType: 'AUTH',
        targetId: user.id,
        result: 'SUCCESS',
        metadata: { role: user.role },
      });

      return res.status(200).json({
        message: 'Login successful.',
        token,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          status: user.status,
          account,
          onboardingStatus: onboarding?.status || 'NOT_SUBMITTED',
        },
      });
    } catch (err: any) {
      console.error('[AUTH_LOGIN_ERROR]', err);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to process login.',
      });
    }
  }
);

// Logout Endpoint
router.post('/logout', authenticate, (req: AuthenticatedRequest, res: Response) => {
  if (req.user) {
    logAudit({
      req,
      actorId: req.user.id,
      actorEmail: req.user.email,
      action: 'USER_LOGOUT',
      targetType: 'AUTH',
      targetId: req.user.id,
      result: 'SUCCESS',
    });
  }
  return res.status(200).json({ message: 'Session logged out successfully.' });
});

// Current User Endpoint
router.get('/me', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const account = db.findAccountByUserId(user.id);
  const onboarding = db.findOnboardingByUserId(user.id);

  return res.status(200).json({
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      account,
      onboarding,
    },
  });
});

export default router;
