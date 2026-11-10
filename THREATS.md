# Threat Model & Security Architecture: BalanceVault

This document details the threat analysis, vulnerability mitigations, and defensive controls implemented within BalanceVault.

---

## 1. Authentication Risks

| Threat | Risk Level | Mitigation Strategy |
| :--- | :--- | :--- |
| **Credential Stuffing & Brute Force** | High | Implemented sliding-window rate limiting on `/api/auth/login` (max 6 requests per minute per IP). Returns HTTP 429 and `Retry-After` header when triggered. |
| **Session Hijacking / Tampering** | High | JWTs signed with server-side HMAC-SHA256 (`JWT_SECRET`). Expiration set to 12 hours. Tokens verified cryptographically on every protected request. |
| **Unauthorized First Admin Creation** | Critical | Public registration strictly hardcodes `role: 'ACCOUNT_HOLDER'`. The master admin can only be initialized via backend bootstrap or safe idempotent startup check. |

---

## 2. Authorization & RBAC Risks

| Threat | Risk Level | Mitigation Strategy |
| :--- | :--- | :--- |
| **Privilege Escalation** | Critical | Client-supplied role parameters are strictly disregarded during registration and profile update endpoints. RBAC is verified by `requireRole('ADMIN')` on the backend. |
| **Insecure Direct Object References (IDOR)** | High | Client endpoints under `/api/users/*` resolve ownership strictly via `req.user.id` extracted from the verified token payload, preventing users from accessing or modifying another account holder's data. |
| **Admin Self-Lockout** | Medium | Administrators cannot deactivate their own active administrator account, preventing denial-of-service on compliance workflows. |

---

## 3. Password Security

- **Hashing Algorithm**: Bcrypt with 10 salt rounds.
- **Complexity Enforcement**: Zod schema validation mandates passwords contain at least 8 characters, an uppercase letter, a lowercase letter, a numerical digit, and a special symbol.
- **Exposure Guard**: Password hashes are stripped before serializing user records to frontend responses.

---

## 4. Rate Limiting Risks

- **Distributed Availability**: Rate limiter handles network disruptions safely with an in-memory token bucket cache, ensuring API endpoints remain responsive while enforcing throttling thresholds.
- **Sensitive Route Coverage**: Rate limits are applied to login, registration, and password change endpoints.

---

## 5. Database & Audit Log Protection

- **Secret Scrubbing**: The audit logging pipeline actively redacts `password`, `token`, `authorization`, `secret`, and `identificationNumber` before writing events to the audit trail.
- **Relational Integrity**: Foreign key constraints enforce parent-child consistency between users, account references, and onboarding records.
- **Tampering Guard**: Audit logs are append-only. There are no delete or update routes for audit entries in the API.

---

## 6. Deployment Security

- **Secure HTTP Headers**: Enabled `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, and `X-XSS-Protection`.
- **Environment Isolation**: Secrets are loaded from environment variables (`process.env`) and never committed to version control.
