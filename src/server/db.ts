import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

export type Role = 'ADMIN' | 'ACCOUNT_HOLDER';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type AccountStatus = 'PENDING_ONBOARDING' | 'ACTIVE' | 'FROZEN' | 'CLOSED';
export type OnboardingStatus = 'NOT_SUBMITTED' | 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
export type IdType = 'PASSPORT' | 'NATIONAL_ID' | 'DRIVERS_LICENSE';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Account {
  id: string;
  accountReference: string;
  userId: string;
  accountType: string;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Onboarding {
  id: string;
  userId: string;
  residentialAddress: string;
  dateOfBirth: string;
  identificationType: IdType;
  identificationNumber: string;
  status: OnboardingStatus;
  rejectionReason: string | null;
  reviewedBy: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  result: 'SUCCESS' | 'FAILURE' | 'BLOCKED';
  metadata: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface DatabaseSchema {
  users: User[];
  accounts: Account[];
  onboarding: Onboarding[];
  auditLogs: AuditLog[];
  notifications: Notification[];
}

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DB_DIR, 'balancevault_db.json');

class DatabaseService {
  private data: DatabaseSchema = {
    users: [],
    accounts: [],
    onboarding: [],
    auditLogs: [],
    notifications: [],
  };

  private initialized = false;

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.seedInitialData();
        this.save();
      }
      this.initialized = true;
    } catch (err) {
      console.error('[DB] Failed to initialize file database, fallback to memory', err);
      this.seedInitialData();
      this.initialized = true;
    }
  }

  private save() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DB] Failed to save database file:', err);
    }
  }

  private seedInitialData() {
    const now = new Date().toISOString();
    const adminPasswordHash = bcrypt.hashSync(process.env.BOOTSTRAP_ADMIN_PASSWORD || 'VaultAdmin@2026!', 10);
    const userPasswordHash = bcrypt.hashSync('VaultClient@2026!', 10);

    const adminUser: User = {
      id: 'usr_admin_001',
      fullName: process.env.BOOTSTRAP_ADMIN_NAME || 'Platform Master Admin',
      email: (process.env.BOOTSTRAP_ADMIN_EMAIL || 'admin@balancevault.internal').toLowerCase().trim(),
      phone: '+1 (555) 019-2831',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };

    const demoUser1: User = {
      id: 'usr_client_001',
      fullName: 'Sarah Jenkins',
      email: 'sarah.jenkins@example.com',
      phone: '+1 (555) 342-8901',
      passwordHash: userPasswordHash,
      role: 'ACCOUNT_HOLDER',
      status: 'ACTIVE',
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      updatedAt: now,
    };

    const demoAccount1: Account = {
      id: 'acc_001',
      accountReference: 'BV-782910-4102',
      userId: demoUser1.id,
      accountType: 'STANDARD_CHECKING',
      status: 'ACTIVE',
      createdAt: demoUser1.createdAt,
      updatedAt: now,
    };

    const demoOnboarding1: Onboarding = {
      id: 'onb_001',
      userId: demoUser1.id,
      residentialAddress: '742 Evergreen Terrace, Springfield, OR',
      dateOfBirth: '1990-04-12',
      identificationType: 'PASSPORT',
      identificationNumber: 'P-984729104',
      status: 'APPROVED',
      rejectionReason: null,
      reviewedBy: adminUser.email,
      submittedAt: new Date(Date.now() - 2.8 * 86400000).toISOString(),
      reviewedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      createdAt: demoUser1.createdAt,
      updatedAt: now,
    };

    const demoUser2: User = {
      id: 'usr_client_002',
      fullName: 'Michael Vance',
      email: 'michael.vance@example.com',
      phone: '+1 (555) 782-9912',
      passwordHash: userPasswordHash,
      role: 'ACCOUNT_HOLDER',
      status: 'ACTIVE',
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      updatedAt: now,
    };

    const demoAccount2: Account = {
      id: 'acc_002',
      accountReference: 'BV-194038-8921',
      userId: demoUser2.id,
      accountType: 'PREMIUM_VAULT',
      status: 'PENDING_ONBOARDING',
      createdAt: demoUser2.createdAt,
      updatedAt: now,
    };

    const demoOnboarding2: Onboarding = {
      id: 'onb_002',
      userId: demoUser2.id,
      residentialAddress: '100 Wall Street, 24th Floor, New York, NY',
      dateOfBirth: '1987-11-03',
      identificationType: 'NATIONAL_ID',
      identificationNumber: 'ID-550192837',
      status: 'PENDING',
      rejectionReason: null,
      reviewedBy: null,
      submittedAt: new Date(Date.now() - 0.5 * 86400000).toISOString(),
      reviewedAt: null,
      createdAt: demoUser2.createdAt,
      updatedAt: now,
    };

    const initialLogs: AuditLog[] = [
      {
        id: 'aud_001',
        actorId: adminUser.id,
        actorEmail: adminUser.email,
        action: 'BOOTSTRAP_FIRST_ADMIN_CREATED',
        targetType: 'SYSTEM',
        targetId: adminUser.id,
        result: 'SUCCESS',
        metadata: { source: 'system_initialization' },
        ipAddress: '127.0.0.1',
        userAgent: 'Internal-Daemon',
        createdAt: now,
      },
      {
        id: 'aud_002',
        actorId: demoUser1.id,
        actorEmail: demoUser1.email,
        action: 'USER_REGISTERED',
        targetType: 'USER',
        targetId: demoUser1.id,
        result: 'SUCCESS',
        metadata: { role: 'ACCOUNT_HOLDER' },
        ipAddress: '192.168.1.45',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        createdAt: demoUser1.createdAt,
      },
      {
        id: 'aud_003',
        actorId: adminUser.id,
        actorEmail: adminUser.email,
        action: 'ONBOARDING_APPROVED',
        targetType: 'ONBOARDING',
        targetId: demoOnboarding1.id,
        result: 'SUCCESS',
        metadata: { applicantUserId: demoUser1.id },
        ipAddress: '10.0.0.2',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        createdAt: demoOnboarding1.reviewedAt!,
      },
      {
        id: 'aud_004',
        actorId: demoUser2.id,
        actorEmail: demoUser2.email,
        action: 'ONBOARDING_SUBMITTED',
        targetType: 'ONBOARDING',
        targetId: demoOnboarding2.id,
        result: 'SUCCESS',
        metadata: { idType: 'NATIONAL_ID' },
        ipAddress: '192.168.1.88',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
        createdAt: demoOnboarding2.submittedAt,
      },
    ];

    const initialNotifications: Notification[] = [
      {
        id: 'notif_001',
        userId: demoUser1.id,
        title: 'Application Approved!',
        message: 'Your identity onboarding application has been approved. Your account reference is now ACTIVE.',
        isRead: true,
        createdAt: demoOnboarding1.reviewedAt!,
      },
      {
        id: 'notif_002',
        userId: demoUser2.id,
        title: 'Onboarding Received',
        message: 'Your verification submission has been received and is queued for compliance verification.',
        isRead: false,
        createdAt: demoOnboarding2.submittedAt,
      },
    ];

    this.data.users = [adminUser, demoUser1, demoUser2];
    this.data.accounts = [demoAccount1, demoAccount2];
    this.data.onboarding = [demoOnboarding1, demoOnboarding2];
    this.data.auditLogs = initialLogs;
    this.data.notifications = initialNotifications;
  }

  // --- Users API ---
  getUsers(): User[] {
    return [...this.data.users];
  }

  findUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  findUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User {
    const now = new Date().toISOString();
    const newUser: User = {
      ...user,
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
      updatedAt: now,
    };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return undefined;
    this.data.users[idx] = {
      ...this.data.users[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.users[idx];
  }

  // --- Accounts API ---
  getAccounts(): Account[] {
    return [...this.data.accounts];
  }

  findAccountByUserId(userId: string): Account | undefined {
    return this.data.accounts.find((a) => a.userId === userId);
  }

  createAccount(account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Account {
    const now = new Date().toISOString();
    const newAccount: Account = {
      ...account,
      id: `acc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
      updatedAt: now,
    };
    this.data.accounts.push(newAccount);
    this.save();
    return newAccount;
  }

  updateAccountByUserId(userId: string, updates: Partial<Account>): Account | undefined {
    const idx = this.data.accounts.findIndex((a) => a.userId === userId);
    if (idx === -1) return undefined;
    this.data.accounts[idx] = {
      ...this.data.accounts[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.accounts[idx];
  }

  // --- Onboarding API ---
  getOnboardings(): Onboarding[] {
    return [...this.data.onboarding];
  }

  findOnboardingById(id: string): Onboarding | undefined {
    return this.data.onboarding.find((o) => o.id === id);
  }

  findOnboardingByUserId(userId: string): Onboarding | undefined {
    return this.data.onboarding.find((o) => o.userId === userId);
  }

  upsertOnboarding(userId: string, data: Partial<Onboarding>): Onboarding {
    const now = new Date().toISOString();
    const idx = this.data.onboarding.findIndex((o) => o.userId === userId);

    if (idx !== -1) {
      this.data.onboarding[idx] = {
        ...this.data.onboarding[idx],
        ...data,
        updatedAt: now,
      };
      this.save();
      return this.data.onboarding[idx];
    }

    const newRecord: Onboarding = {
      id: `onb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      residentialAddress: data.residentialAddress || '',
      dateOfBirth: data.dateOfBirth || '',
      identificationType: data.identificationType || 'NATIONAL_ID',
      identificationNumber: data.identificationNumber || '',
      status: data.status || 'PENDING',
      rejectionReason: data.rejectionReason || null,
      reviewedBy: data.reviewedBy || null,
      submittedAt: data.submittedAt || now,
      reviewedAt: data.reviewedAt || null,
      createdAt: now,
      updatedAt: now,
    };
    this.data.onboarding.push(newRecord);
    this.save();
    return newRecord;
  }

  updateOnboarding(id: string, updates: Partial<Onboarding>): Onboarding | undefined {
    const idx = this.data.onboarding.findIndex((o) => o.id === id);
    if (idx === -1) return undefined;
    this.data.onboarding[idx] = {
      ...this.data.onboarding[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.onboarding[idx];
  }

  // --- Audit Logs ---
  getAuditLogs(): AuditLog[] {
    return [...this.data.auditLogs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  createAuditLog(log: Omit<AuditLog, 'id' | 'createdAt'>): AuditLog {
    const newLog: AuditLog = {
      ...log,
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(newLog);
    // Keep max 1000 audit logs
    if (this.data.auditLogs.length > 1000) {
      this.data.auditLogs.pop();
    }
    this.save();
    return newLog;
  }

  // --- Notifications ---
  getNotificationsByUserId(userId: string): Notification[] {
    return this.data.notifications
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  createNotification(userId: string, title: string, message: string): Notification {
    const newNotification: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      title,
      message,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    this.data.notifications.unshift(newNotification);
    this.save();
    return newNotification;
  }

  markNotificationAsRead(id: string, userId: string): boolean {
    const item = this.data.notifications.find((n) => n.id === id && n.userId === userId);
    if (!item) return false;
    item.isRead = true;
    this.save();
    return true;
  }

  isHealthy(): boolean {
    return this.initialized;
  }
}

export const db = new DatabaseService();
