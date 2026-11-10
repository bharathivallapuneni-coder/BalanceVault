import express, { type Response } from 'express';
import { db, type UserStatus } from '../db.ts';
import { authenticate, requireRole, type AuthenticatedRequest } from '../auth.ts';
import { logAudit } from '../audit.ts';

const router = express.Router();

// Strictly enforce Admin RBAC for every route in this router
router.use(authenticate);
router.use(requireRole('ADMIN'));

// Dashboard Overview with Real Database Stats
router.get('/dashboard', (req: AuthenticatedRequest, res: Response) => {
  const allUsers = db.getUsers();
  const allAccounts = db.getAccounts();
  const allOnboardings = db.getOnboardings();
  const allAuditLogs = db.getAuditLogs();

  const totalUsers = allUsers.filter((u) => u.role === 'ACCOUNT_HOLDER').length;
  const activeUsers = allUsers.filter((u) => u.role === 'ACCOUNT_HOLDER' && u.status === 'ACTIVE').length;
  const inactiveUsers = allUsers.filter((u) => u.role === 'ACCOUNT_HOLDER' && u.status !== 'ACTIVE').length;

  const pendingOnboarding = allOnboardings.filter((o) => o.status === 'PENDING' || o.status === 'UNDER_REVIEW').length;
  const approvedOnboarding = allOnboardings.filter((o) => o.status === 'APPROVED').length;
  const rejectedOnboarding = allOnboardings.filter((o) => o.status === 'REJECTED').length;

  const recentActivities = allAuditLogs.slice(0, 10);
  const recentUsers = allUsers
    .filter((u) => u.role === 'ACCOUNT_HOLDER')
    .slice(-6)
    .reverse()
    .map((u) => ({
      ...u,
      account: db.findAccountByUserId(u.id),
      onboarding: db.findOnboardingByUserId(u.id),
    }));

  return res.status(200).json({
    stats: {
      totalUsers,
      activeUsers,
      inactiveUsers,
      pendingOnboarding,
      approvedOnboarding,
      rejectedOnboarding,
      totalAccounts: allAccounts.length,
      activeAccounts: allAccounts.filter((a) => a.status === 'ACTIVE').length,
    },
    onboardingBreakdown: [
      { name: 'Pending Review', count: pendingOnboarding },
      { name: 'Approved', count: approvedOnboarding },
      { name: 'Rejected', count: rejectedOnboarding },
    ],
    recentActivities,
    recentUsers,
  });
});

// Users Management
router.get('/users', (req: AuthenticatedRequest, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
  const search = ((req.query.search as string) || '').toLowerCase().trim();
  const role = req.query.role as string;
  const status = req.query.status as string;

  let users = db.getUsers();

  if (search) {
    users = users.filter(
      (u) =>
        u.fullName.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search) ||
        u.phone.toLowerCase().includes(search)
    );
  }

  if (role) {
    users = users.filter((u) => u.role === role);
  }

  if (status) {
    users = users.filter((u) => u.status === status);
  }

  // Sort descending by created date
  users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const total = users.length;
  const paginated = users.slice((page - 1) * limit, page * limit).map((u) => ({
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    phone: u.phone,
    role: u.role,
    status: u.status,
    createdAt: u.createdAt,
    account: db.findAccountByUserId(u.id),
    onboarding: db.findOnboardingByUserId(u.id),
  }));

  return res.status(200).json({
    data: paginated,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
});

router.get('/users/:id', (req: AuthenticatedRequest, res: Response) => {
  const user = db.findUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'Not Found', message: 'User record not found.' });
  }

  const account = db.findAccountByUserId(user.id);
  const onboarding = db.findOnboardingByUserId(user.id);
  const notifications = db.getNotificationsByUserId(user.id);

  return res.status(200).json({
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      account,
      onboarding,
      notifications: notifications.slice(0, 10),
    },
  });
});

router.patch('/users/:id/status', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const validStatuses: UserStatus[] = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      error: 'Invalid Status',
      message: 'Status must be one of: ACTIVE, INACTIVE, SUSPENDED.',
    });
  }

  const targetUser = db.findUserById(id);
  if (!targetUser) {
    return res.status(404).json({ error: 'Not Found', message: 'User not found.' });
  }

  if (targetUser.role === 'ADMIN' && req.user!.id === targetUser.id && status !== 'ACTIVE') {
    return res.status(400).json({
      error: 'Forbidden',
      message: 'Administrators cannot deactivate their own active administrator session.',
    });
  }

  const previousStatus = targetUser.status;
  const updated = db.updateUser(id, { status });

  logAudit({
    req,
    actorId: req.user!.id,
    actorEmail: req.user!.email,
    action: `USER_STATUS_${status}`,
    targetType: 'USER',
    targetId: id,
    result: 'SUCCESS',
    metadata: { previousStatus, newStatus: status, userEmail: targetUser.email },
  });

  db.createNotification(
    id,
    'Account Status Updated',
    `Your account status has been changed from ${previousStatus} to ${status} by administrator ${req.user!.email}.`
  );

  return res.status(200).json({
    message: `User status changed to ${status}.`,
    user: updated,
  });
});

// Onboarding Queue & Decisions
router.get('/onboarding', (req: AuthenticatedRequest, res: Response) => {
  const status = req.query.status as string;
  const search = ((req.query.search as string) || '').toLowerCase().trim();
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));

  let onboardings = db.getOnboardings();

  if (status) {
    onboardings = onboardings.filter((o) => o.status === status);
  }

  // Join with user data
  let enriched = onboardings.map((o) => {
    const user = db.findUserById(o.userId);
    return {
      ...o,
      user: user
        ? {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            createdAt: user.createdAt,
            status: user.status,
          }
        : null,
    };
  });

  if (search) {
    enriched = enriched.filter(
      (item) =>
        item.user?.fullName.toLowerCase().includes(search) ||
        item.user?.email.toLowerCase().includes(search) ||
        item.residentialAddress.toLowerCase().includes(search) ||
        item.identificationType.toLowerCase().includes(search)
    );
  }

  enriched.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  const total = enriched.length;
  const paginated = enriched.slice((page - 1) * limit, page * limit);

  return res.status(200).json({
    data: paginated,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
});

router.get('/onboarding/:id', (req: AuthenticatedRequest, res: Response) => {
  const onboarding = db.findOnboardingById(req.params.id);
  if (!onboarding) {
    return res.status(404).json({ error: 'Not Found', message: 'Onboarding record not found.' });
  }

  const user = db.findUserById(onboarding.userId);
  const account = db.findAccountByUserId(onboarding.userId);

  return res.status(200).json({
    onboarding: {
      ...onboarding,
      user,
      account,
    },
  });
});

router.patch('/onboarding/:id/approve', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const onboarding = db.findOnboardingById(id);

  if (!onboarding) {
    return res.status(404).json({ error: 'Not Found', message: 'Onboarding application not found.' });
  }

  const now = new Date().toISOString();
  db.updateOnboarding(id, {
    status: 'APPROVED',
    reviewedAt: now,
    reviewedBy: req.user!.email,
    rejectionReason: null,
  });

  // Activate the associated financial account
  db.updateAccountByUserId(onboarding.userId, {
    status: 'ACTIVE',
  });

  logAudit({
    req,
    actorId: req.user!.id,
    actorEmail: req.user!.email,
    action: 'ONBOARDING_APPROVED',
    targetType: 'ONBOARDING',
    targetId: id,
    result: 'SUCCESS',
    metadata: { applicantUserId: onboarding.userId },
  });

  db.createNotification(
    onboarding.userId,
    'Onboarding Approved!',
    'Congratulations! Your identification documents have been verified and approved. Your financial account reference is now ACTIVE.'
  );

  return res.status(200).json({
    message: 'Onboarding application successfully approved and account activated.',
  });
});

router.patch('/onboarding/:id/reject', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'A clear rejection reason of at least 5 characters is required for applicant guidance.',
    });
  }

  const onboarding = db.findOnboardingById(id);
  if (!onboarding) {
    return res.status(404).json({ error: 'Not Found', message: 'Onboarding application not found.' });
  }

  const now = new Date().toISOString();
  const trimmedReason = reason.trim();

  db.updateOnboarding(id, {
    status: 'REJECTED',
    rejectionReason: trimmedReason,
    reviewedAt: now,
    reviewedBy: req.user!.email,
  });

  logAudit({
    req,
    actorId: req.user!.id,
    actorEmail: req.user!.email,
    action: 'ONBOARDING_REJECTED',
    targetType: 'ONBOARDING',
    targetId: id,
    result: 'SUCCESS',
    metadata: { applicantUserId: onboarding.userId, reason: trimmedReason },
  });

  db.createNotification(
    onboarding.userId,
    'Action Required: Onboarding Application Rejected',
    `Your onboarding submission was rejected: "${trimmedReason}". Please review and resubmit your details with updated records.`
  );

  return res.status(200).json({
    message: 'Onboarding application marked as rejected.',
  });
});

// Accounts Overview
router.get('/accounts', (req: AuthenticatedRequest, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
  const search = ((req.query.search as string) || '').toLowerCase().trim();

  const accounts = db.getAccounts();
  let enriched = accounts.map((acc) => {
    const user = db.findUserById(acc.userId);
    const onboarding = db.findOnboardingByUserId(acc.userId);
    return {
      ...acc,
      user: user
        ? {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            status: user.status,
          }
        : null,
      onboardingStatus: onboarding?.status || 'NOT_SUBMITTED',
    };
  });

  if (search) {
    enriched = enriched.filter(
      (a) =>
        a.accountReference.toLowerCase().includes(search) ||
        a.user?.fullName.toLowerCase().includes(search) ||
        a.user?.email.toLowerCase().includes(search)
    );
  }

  enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const total = enriched.length;
  const paginated = enriched.slice((page - 1) * limit, page * limit);

  return res.status(200).json({
    data: paginated,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
});

// Audit Logs
router.get('/audit-logs', (req: AuthenticatedRequest, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const search = ((req.query.search as string) || '').toLowerCase().trim();
  const action = req.query.action as string;
  const result = req.query.result as string;

  let logs = db.getAuditLogs();

  if (action) {
    logs = logs.filter((l) => l.action.toLowerCase() === action.toLowerCase());
  }

  if (result) {
    logs = logs.filter((l) => l.result === result);
  }

  if (search) {
    logs = logs.filter(
      (l) =>
        (l.actorEmail && l.actorEmail.toLowerCase().includes(search)) ||
        l.action.toLowerCase().includes(search) ||
        l.targetType.toLowerCase().includes(search) ||
        (l.targetId && l.targetId.toLowerCase().includes(search)) ||
        l.ipAddress.includes(search)
    );
  }

  const total = logs.length;
  const paginated = logs.slice((page - 1) * limit, page * limit);

  return res.status(200).json({
    data: paginated,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
});

export default router;
