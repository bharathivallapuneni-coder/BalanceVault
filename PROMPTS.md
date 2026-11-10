# AI Assistance Log (PROMPTS.md)

This log records the prompts, architectural decisions, and error-correction steps taken during the development of BalanceVault.

---

### Phase 1: Architecture & Scope Definition

- **Prompt Used**:
  > "Build a complete, modern, secure, full-stack web application named BalanceVault. BalanceVault is a financial account management and onboarding platform designed to manage user accounts, registration workflows, access permissions, authentication, administrative operations, and audit trails."
- **AI Suggestion**:
  - Separate concerns into full-stack layers with Express API and React SPA running cooperatively on port 3000.
  - Implement two distinct roles: `ADMIN` and `ACCOUNT_HOLDER` with strict backend RBAC guards.
  - Deliver real database-backed statistics, audit logs with secret scrubbing, and automated account activation upon onboarding approval.
- **What Was Learned**:
  - Frontend-only role checks are insufficient for financial management systems. Enforcing role checks on every Express route via `requireRole(...)` guarantees zero trust.

---

### Phase 2: First-Admin Bootstrap & Rate Limiter Resilience

- **Prompt Used**:
  > "Ensure bootstrap is safe to retry. Prevent unauthorized users from creating administrators. Integrate Redis for backend rate limiting with safe failover."
- **Issue Encountered**:
  - If Redis or a remote database is temporarily unreachable, traditional rate limiters crash Express startup.
- **How It Was Corrected**:
  - Implemented a resilient sliding-window rate limiter with an in-memory token bucket cache fallback that sets standard `X-RateLimit-*` and `Retry-After` headers and returns HTTP 429 when limits are exceeded.
  - Bootstrapping was implemented idempotently so that restarting the server never overwrites existing administrator accounts or duplicates credentials.

---

### Phase 3: Audit Trail Sanitization

- **Prompt Used**:
  > "Never store passwords, authentication tokens, or other secrets in audit logs."
- **AI Suggestion**:
  - Create a dedicated `logAudit` service that recursively sanitizes any metadata keys matching forbidden keywords (`password`, `token`, `secret`, `jwt`, `identificationNumber`) and replaces their values with `[REDACTED_FOR_SECURITY]`.
- **What Was Learned**:
  - Audit logging must decouple payload capture from credential capture. Sanitization at the service layer prevents accidental leaks even if controllers pass request bodies directly.
