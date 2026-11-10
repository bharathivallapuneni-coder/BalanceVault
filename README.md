# BalanceVault — Financial Account Management & Onboarding Platform

BalanceVault is a production-grade financial account management and onboarding platform designed to manage user accounts, registration workflows, access permissions, authentication, administrative operations, and audit trails.

> **Note**: This is an account management and compliance onboarding platform for demonstration purposes. It does not process real-money transactions.

---

## 1. Core Architecture & Features

### Role-Based Access Control (RBAC)
- **ADMIN**:
  - Overview dashboard with real database metrics and analytics breakdown (Recharts).
  - User Directory with search, filtering, and activation/deactivation toggles.
  - Onboarding Review Queue: Inspect submitted ID details and address, approve to activate accounts, or reject with required explanation.
  - Accounts Register: Unified view of account references, client identities, and standing.
  - Security Audit Trail: Searchable event stream tracking logins, state modifications, and admin actions.
  - System Health & Readiness monitor (`/api/health`, `/api/ready`).
- **ACCOUNT HOLDER**:
  - Secure registration (automatically assigned `ACCOUNT_HOLDER` role, never administrator).
  - Multi-stage onboarding lifecycle (Registration → KYC Submission → Compliance Review → Account Activation).
  - Profile & password management with bcrypt salted hashing.
  - Live notification feed with unread indicators and read-toggle actions.

### Security Hardening
- **Password Protection**: Salted Bcrypt (10 rounds) hashing. Passwords never returned in API responses.
- **Backend-Enforced RBAC**: Never trusts client-supplied roles. Middleware verifies verified database user role on every protected route.
- **Rate Limiting**: Sliding window rate limiter returning HTTP 429 when limits are exceeded on sensitive authentication routes (`/api/auth/login`, `/api/auth/register`, `/api/users/change-password`).
- **Audit Secret Scrubbing**: Passwords, tokens, authorization headers, and confidential document identifiers are systematically scrubbed before audit log persistence.
- **First Admin Bootstrap**: Secure first-admin creation with safe idempotent execution.

---

## 2. Technology Stack

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS, React Router, Lucide React, Recharts.
- **Backend**: Node.js, Express.js, TypeScript, REST API architecture, JWT authentication.
- **Persistence**: Relational schema persistence with transactional writes, foreign key relationships, and data indexing.
- **Rate Limiting**: Sliding window token bucket with Redis compatibility and fail-safe memory fallback.
- **Testing**: End-to-end integration test suite (`src/scripts/testSuite.ts`).

---

## 3. Quick Start & Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Run Development Server
```bash
npm run dev
```
The application will boot on `http://localhost:3000`.

### 4. Default Demo Accounts
- **Master Administrator**:
  - Email: `admin@balancevault.internal`
  - Password: `VaultAdmin@2026!`
- **Demo Account Holder (Approved)**:
  - Email: `sarah.jenkins@example.com`
  - Password: `VaultClient@2026!`
- **Demo Account Holder (Pending Review)**:
  - Email: `michael.vance@example.com`
  - Password: `VaultClient@2026!`

*(1-click login buttons are also provided directly on the landing page and login screen).*

---

## 4. API Endpoints

### Authentication
- `POST /api/auth/register` — Register new Account Holder
- `POST /api/auth/login` — Authenticate and receive JWT
- `POST /api/auth/logout` — Revoke session and log audit event
- `GET /api/auth/me` — Retrieve current user profile & account

### Account Holder
- `GET /api/users/profile` — Get personal details
- `PUT /api/users/profile` — Update permitted personal details
- `POST /api/users/change-password` — Change password securely
- `GET /api/users/account` — Get account reference & status
- `GET /api/users/onboarding` — Get onboarding application
- `POST /api/users/onboarding` — Submit or resubmit identity records
- `GET /api/users/notifications` — Retrieve notifications
- `PATCH /api/users/notifications/:id/read` — Mark notification read

### Administrator
- `GET /api/admin/dashboard` — Platform overview & metrics
- `GET /api/admin/users` — Paginated user directory with search/filters
- `GET /api/admin/users/:id` — Detailed user view
- `PATCH /api/admin/users/:id/status` — Activate/deactivate user
- `GET /api/admin/onboarding` — Onboarding review queue
- `PATCH /api/admin/onboarding/:id/approve` — Approve KYC and activate account
- `PATCH /api/admin/onboarding/:id/reject` — Reject with required reason
- `GET /api/admin/accounts` — Accounts inventory
- `GET /api/admin/audit-logs` — Security audit logs

### System
- `GET /api/health` — Process status & uptime
- `GET /api/ready` — Database and rate limiter readiness checks
