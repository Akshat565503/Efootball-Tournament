# 🔐 Pre-Deployment Security Checklist for SaaS & Vibecoded Apps

> A comprehensive, practical checklist for indie hackers, solo founders, and AI-assisted ("vibecoded") developers to run **before shipping any app to production**. Written to be understandable by both humans and AI coding assistants (Claude, Cursor, Copilot, etc.) so it can be pasted directly into a prompt or used as a repo README / audit skill.

---

## How to Use This Document

1. Treat this as a **checklist, not a lecture** — go item by item.
2. If you're using an AI coding assistant, paste a section into chat and ask: *"Audit my codebase against this checklist and tell me what's missing."*
3. Nothing here is optional for a real product handling user data or payments. If you're skipping something, do it consciously and document why.
4. Run this checklist **before every major release**, not just once.

---

## Table of Contents

1. [Authentication & Session Security](#1-authentication--session-security)
2. [Authorization & Access Control](#2-authorization--access-control)
3. [Input Validation & Injection Prevention](#3-input-validation--injection-prevention)
4. [API & Backend Security](#4-api--backend-security)
5. [Secrets & Credentials Management](#5-secrets--credentials-management)
6. [Infrastructure & Network Security](#6-infrastructure--network-security)
7. [Data Protection & Privacy](#7-data-protection--privacy)
8. [Dependency & Supply Chain Security](#8-dependency--supply-chain-security)
9. [Frontend / Client-Side Security](#9-frontend--client-side-security)
10. [Payments & Billing Security](#10-payments--billing-security)
11. [Logging, Monitoring & Incident Response](#11-logging-monitoring--incident-response)
12. [CI/CD & Deployment Pipeline Security](#12-cicd--deployment-pipeline-security)
13. [AI-Specific Risks (LLM/Agent Apps)](#13-ai-specific-risks-llmagent-apps)
14. [Legal, Compliance & Trust](#14-legal-compliance--trust)
15. [Final Pre-Launch Checklist](#15-final-pre-launch-checklist)
16. [🤖 AI Audit Prompt — Run This Checklist Automatically](#16-ai-audit-prompt--run-this-checklist-automatically)

---

## 1. Authentication & Session Security

| # | Check | Why It Matters |
|---|-------|-----------------|
| 1 | **Strong password policy** enforced (min length, no common passwords via breach list like HaveIBeenPwned) | Prevents brute-force and credential-stuffing success |
| 2 | **Passwords hashed with bcrypt/argon2/scrypt**, never MD5/SHA1/plaintext | Protects users if your DB leaks |
| 3 | **Rate limiting + lockout on login attempts** | Stops brute-force attacks |
| 4 | **Secure session tokens** (random, ≥128-bit entropy, httpOnly, Secure, SameSite cookies) | Prevents session hijacking/theft via JS |
| 5 | **Session expiry & rotation** on privilege change (e.g., after password reset, logout everywhere) | Limits blast radius of a stolen token |
| 6 | **Broken password reset flows** — reset tokens must be single-use, short-lived, and not guessable/sequential | A weak reset flow is a full account-takeover vector |
| 7 | **Multi-factor authentication (MFA)** available, ideally required for admin/privileged accounts | Adds a second barrier even if password leaks |
| 8 | **JWT secrets** are strong, rotated periodically, and never hardcoded/committed | A leaked JWT secret = attacker can forge any user's token |
| 9 | **JWT expiry set appropriately** (short-lived access tokens + refresh token rotation) | Limits damage from a stolen token |
| 10 | **No sensitive data stored inside JWT payload** (it's base64, not encrypted) | JWTs are readable by anyone who intercepts them |
| 11 | **OAuth/social login redirect URIs are strictly whitelisted** | Prevents open-redirect based token theft |
| 12 | **Weak session management fixed**: no session fixation, sessions invalidated server-side on logout | Client-side-only logout leaves tokens usable |

---

## 2. Authorization & Access Control

| # | Check | Why It Matters |
|---|-------|-----------------|
| 13 | **IDOR / BOLA (Broken Object Level Authorization)** — every endpoint checks *"does this user own/have access to this specific resource ID?"*, not just *"is this user logged in?"* | The #1 API vulnerability in real-world breaches — `/api/invoice/1234` must not be viewable by changing the ID |
| 14 | **Role-based access control (RBAC)** enforced server-side, never trust a `role` field sent from the client | Client-side role checks are trivially bypassed |
| 15 | **Admin panels are not publicly discoverable** and require proper auth + IP restriction where possible | Prevents casual discovery/scanning attacks |
| 16 | **Horizontal privilege escalation tested** (User A can't access User B's data via any parameter tampering) | Common in multi-tenant SaaS |
| 17 | **Vertical privilege escalation tested** (regular user can't call admin-only endpoints) | Prevents privilege abuse |
| 18 | **Default credentials changed/removed** on all services (databases, admin dashboards, cloud consoles, CMS) | Default creds are the #1 cause of opportunistic breaches |

---

## 3. Input Validation & Injection Prevention

| # | Check | Why It Matters |
|---|-------|-----------------|
| 19 | **Cross-Site Scripting (XSS) prevention** — sanitize/escape all user input rendered in HTML; use frameworks' built-in escaping (React/Vue auto-escape by default — don't use `dangerouslySetInnerHTML`/`v-html` on unsanitized input) | Prevents attackers injecting scripts that steal sessions/cookies from other users |
| 20 | **Cross-Site Request Forgery (CSRF) protection** — CSRF tokens on state-changing requests, or use SameSite cookies + verify Origin/Referer headers | Prevents attackers tricking logged-in users into unwanted actions |
| 21 | **Insecure file upload protection** — validate file type by content (not extension), enforce size limits, store uploads outside the web root or in object storage (S3/Cloud Storage) with no execute permissions, scan for malware if possible | Prevents remote code execution via malicious file uploads |
| 22 | **Path traversal prevention** — never build file paths directly from user input (`../../etc/passwd` style attacks); use allow-lists and path sanitization | Prevents attackers reading/writing arbitrary server files |
| 23 | **Server-Side Request Forgery (SSRF) protection** — if your app fetches URLs on behalf of users (webhooks, image proxies, link previews), block requests to internal IP ranges (169.254.x.x, 10.x, 127.0.0.1, cloud metadata endpoints like 169.254.169.254) | Prevents attackers using your server to hit internal infrastructure or steal cloud credentials |
| 24 | **SQL/NoSQL injection prevention** — always use parameterized queries/ORMs, never string-concatenate user input into queries | Prevents full database compromise |
| 25 | **Command injection prevention** — never pass unsanitized user input to shell commands (`exec`, `system`, `eval`) | Prevents remote code execution |
| 26 | **Server-side validation on all inputs**, even if client-side validation exists | Client-side validation is cosmetic only — always bypassable |
| 27 | **Weak session management** covered under Section 1, but re-verify inputs affecting session state are validated | Defense in depth |

---

## 4. API & Backend Security

| # | Check | Why It Matters |
|---|-------|-----------------|
| 28 | **Rate limiting on all public endpoints** (especially auth, search, and any expensive operation) | Prevents brute force, scraping, and denial-of-wallet attacks (esp. costly on AI API calls) |
| 29 | **Exposed environments/debug modes disabled** — `DEBUG=False` in production, stack traces not shown to users, `/debug`, `/test`, `/staging` routes not publicly reachable | Debug info leaks internal architecture, file paths, and secrets |
| 30 | **Permissive CORS locked down** — `Access-Control-Allow-Origin: *` should never be paired with credentialed requests; whitelist exact origins | Wildcard CORS + credentials lets any website make authenticated requests on behalf of your users |
| 31 | **Unsigned/unverified webhooks fixed** — verify webhook signatures (Stripe, GitHub, etc. all provide signing secrets) before trusting payloads | Prevents attackers from forging fake payment/event webhooks |
| 32 | **APIs validate all user input**, including headers, query params, and JSON body types/shapes (use schema validation: Zod, Joi, Pydantic) | Prevents type confusion and injection bugs |
| 33 | **Mass assignment protection** — don't blindly bind request bodies to DB models (e.g., a user shouldn't be able to POST `{"role": "admin"}` and have it accepted) | Prevents privilege escalation via extra fields |
| 34 | **API versioning & deprecation strategy** so old insecure endpoints can be retired safely | Prevents zombie endpoints from lingering as attack surface |
| 35 | **GraphQL-specific**: disable introspection in production, add query depth/complexity limiting | Prevents schema leakage and denial-of-service via nested queries |

---

## 5. Secrets & Credentials Management

| # | Check | Why It Matters |
|---|-------|-----------------|
| 36 | **No secrets committed to Git** (API keys, DB passwords, private keys) — use `.env` + `.gitignore`, and scan history with tools like `gitleaks` or `trufflehog` | A single leaked key in git history is permanently compromised even if deleted later |
| 37 | **Secrets stored in a proper secrets manager** in production (AWS Secrets Manager, Vault, Doppler, platform env vars) — not hardcoded | Centralizes rotation and access control |
| 38 | **Different credentials for dev/staging/prod** | Prevents a leaked dev key from compromising production |
| 39 | **API keys scoped to minimum required permissions** (principle of least privilege) | Limits damage if a key leaks |
| 40 | **Secrets rotated periodically** and immediately after any suspected leak or employee/contractor offboarding | Reduces window of exposure |

---

## 6. Infrastructure & Network Security

| # | Check | Why It Matters |
|---|-------|-----------------|
| 41 | **HTTPS enforced everywhere** (HTTP → HTTPS redirect, HSTS header set) | Prevents man-in-the-middle attacks and cookie theft |
| 42 | **Security headers configured**: `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` (or CSP frame-ancestors), `Referrer-Policy` | Mitigates XSS, clickjacking, and MIME-sniffing attacks |
| 43 | **Database not publicly exposed to the internet** — restrict to VPC/private network + allow-listed IPs | Prevents direct DB attacks bypassing your app entirely |
| 44 | **Firewall rules follow least privilege** — only required ports open | Reduces attack surface |
| 45 | **Cloud storage buckets (S3, GCS) are private by default**, with explicit, audited exceptions for public assets | Misconfigured public buckets are one of the most common real-world breach causes |
| 46 | **Server/OS and runtime kept patched and updated** | Unpatched systems are exploited via known CVEs |

---

## 7. Data Protection & Privacy

| # | Check | Why It Matters |
|---|-------|-----------------|
| 47 | **Sensitive data encrypted at rest** (DB-level or field-level encryption for PII, tokens, etc.) | Protects data even if storage is compromised |
| 48 | **Sensitive data encrypted in transit** (TLS everywhere, including internal service-to-service calls where feasible) | Prevents interception |
| 49 | **PII minimization** — only collect data you actually need | Reduces liability and breach impact |
| 50 | **Exposed logs checked** — logs must never contain passwords, tokens, full credit card numbers, or raw PII | Log files are often less protected than the main DB and frequently leaked |
| 51 | **Exposed source maps removed from production** (`.map` files reveal your unminified source code, comments, and sometimes secrets) | Attackers use source maps to reverse-engineer your app and find vulnerabilities |
| 52 | **Backups encrypted and access-controlled**, with periodic restore testing | An unprotected backup is as sensitive as the live DB |
| 53 | **Data deletion / right-to-erasure supported** where applicable (GDPR/CCPA) | Legal requirement in many jurisdictions |

---

## 8. Dependency & Supply Chain Security

| # | Check | Why It Matters |
|---|-------|-----------------|
| 54 | **Dependencies scanned for known vulnerabilities** (`npm audit`, `pip-audit`, Snyk, Dependabot, GitHub security alerts enabled) | Most real-world breaches exploit known, unpatched library CVEs |
| 55 | **Lockfiles committed** (`package-lock.json`, `poetry.lock`, etc.) to prevent surprise version drift | Ensures reproducible, vetted builds |
| 56 | **Unused dependencies removed** | Smaller attack surface |
| 57 | **Third-party scripts/CDNs use Subresource Integrity (SRI)** where possible | Prevents a compromised CDN from injecting malicious JS into your site |
| 58 | **AI-generated code reviewed line by line before merging**, not just accepted because it "runs" | Vibecoded/AI-generated code frequently reintroduces classic vulnerabilities (SQLi, missing auth checks, hardcoded secrets) that a human review would catch |

---

## 9. Frontend / Client-Side Security

| # | Check | Why It Matters |
|---|-------|-----------------|
| 59 | **No sensitive logic or secrets in frontend/client-side code** (API keys for privileged services, business logic that should be server-enforced) | Anything shipped to the browser can be extracted and read by anyone |
| 60 | **Frontend payment checks are never trusted alone** — e.g., a "price" or "discount" field must be recalculated/verified server-side, never trusted from the client | Attackers can modify client-side requests to set their own price ($0 checkout is a classic vibecoded-app bug) |
| 61 | **Clickjacking protection** (frame-busting via `X-Frame-Options`/CSP) | Prevents UI-redress attacks |
| 62 | **Autocomplete/caching disabled on sensitive fields** (passwords, card numbers) where appropriate | Reduces local data exposure on shared devices |
| 63 | **Third-party embeds (chat widgets, analytics) reviewed** for what data they can access | Third-party scripts run with full page access unless sandboxed |

---

## 10. Payments & Billing Security

| # | Check | Why It Matters |
|---|-------|-----------------|
| 64 | **Never handle raw card numbers yourself** — use Stripe/Paddle/LemonSqueezy tokenization/Elements/Checkout | Avoids PCI-DSS scope entirely and eliminates card-theft risk |
| 65 | **Webhook signature verification** for all payment provider events (see #31) | Prevents fake "payment succeeded" events from unlocking paid features for free |
| 66 | **Server-side price/plan verification** on every purchase and subscription change | Prevents price tampering (see #60) |
| 67 | **Idempotency keys used on payment-related API calls** | Prevents double-charging on retries |
| 68 | **Subscription/entitlement checks happen server-side on every gated request**, not just at login | Prevents users from retaining paid access after cancellation via stale client state |

---

## 11. Logging, Monitoring & Incident Response

| # | Check | Why It Matters |
|---|-------|-----------------|
| 69 | **Centralized logging** for auth events, errors, and admin actions | Enables detection and forensics after an incident |
| 70 | **Alerting configured** for anomalies (spike in failed logins, 500 errors, unusual API usage) | Enables early detection of an attack in progress |
| 71 | **An incident response plan exists**, even a simple one (who to contact, how to rotate secrets fast, how to notify users) | Speed of response determines breach severity |
| 72 | **Audit trail for sensitive/admin actions** (who changed what, when) | Critical for accountability and investigation |

---

## 12. CI/CD & Deployment Pipeline Security

| # | Check | Why It Matters |
|---|-------|-----------------|
| 73 | **CI/CD secrets stored in the platform's secret store** (GitHub Actions secrets, etc.), never in the pipeline YAML | Prevents leakage via public repo/logs |
| 74 | **Branch protection enabled** — no direct pushes to `main`, PR review required for production deploys | Prevents accidental or malicious direct-to-prod changes |
| 75 | **Automated security scanning in CI** (SAST tools, dependency scanning, secret scanning) runs on every PR | Catches issues before they reach production |
| 76 | **Staging environment mirrors production** for realistic pre-release testing | Reduces "works on my machine" surprises with security implications |
| 77 | **Rollback plan tested** in case a deploy introduces a critical issue | Minimizes downtime/exposure window |

---

## 13. AI-Specific Risks (LLM/Agent Apps)

*If your app uses an LLM, AI agent, or exposes AI features to users — additional checks apply:*

| # | Check | Why It Matters |
|---|-------|-----------------|
| 78 | **Prompt injection defenses** — treat any user-supplied or fetched content that reaches the LLM as untrusted; don't let it override system instructions unchecked | Attackers can hijack your AI agent via crafted input to leak data or take unintended actions |
| 79 | **LLM output is never executed or trusted blindly** (no direct `eval()` of model output, no unchecked tool/function calls with destructive side effects) | Prevents the model being tricked into damaging actions |
| 80 | **Rate limit / cost-cap your AI API usage** | Prevents "denial of wallet" attacks where an attacker spams your AI endpoint to run up your bill |
| 81 | **No sensitive internal data placed in prompts sent to third-party LLM providers** unless contractually covered | Data sent to external AI APIs may be logged/retained depending on provider policy |
| 82 | **Agent tool permissions scoped tightly** (an AI agent with file/shell/DB access should have the same least-privilege treatment as a human admin account) | An over-permissioned agent is a bigger risk than an over-permissioned employee — it can be manipulated at machine speed |

---

## 14. Legal, Compliance & Trust

| # | Check | Why It Matters |
|---|-------|-----------------|
| 83 | **Privacy Policy and Terms of Service published** and accurate to what you actually do with data | Legal requirement in most jurisdictions; builds user trust |
| 84 | **Cookie consent implemented** where required (GDPR/ePrivacy) | Avoids regulatory penalties |
| 85 | **Data processing agreements (DPAs) in place** with any third-party vendors touching user data | Required for GDPR compliance when using sub-processors |
| 86 | **A `security.txt` file** (at `/.well-known/security.txt`) so researchers can responsibly report vulnerabilities | Encourages responsible disclosure instead of public exploitation |

---

## 15. Final Pre-Launch Checklist

Quick-scan version — copy this into your PR description or launch doc:

- [ ] All auth flows tested (signup, login, logout, password reset, MFA)
- [ ] IDOR/BOLA tested on every resource-by-ID endpoint
- [ ] All admin/privileged routes require server-side role checks
- [ ] XSS, CSRF, SQLi, SSRF, path traversal — manually tested or scanned
- [ ] File uploads restricted and validated
- [ ] Rate limiting active on auth + expensive endpoints
- [ ] `DEBUG=False`, no stack traces exposed, no test routes live
- [ ] CORS locked to specific origins
- [ ] Webhooks verify signatures
- [ ] No secrets in git history (scanned)
- [ ] Secrets in a proper secrets manager, scoped minimally
- [ ] HTTPS + HSTS + security headers configured
- [ ] DB and storage buckets not publicly exposed
- [ ] PII encrypted at rest and in transit
- [ ] Logs scrubbed of secrets/PII
- [ ] Source maps removed from production build
- [ ] Dependencies scanned, no critical CVEs outstanding
- [ ] Payment/pricing logic re-verified server-side
- [ ] Subscription/entitlement checks enforced server-side
- [ ] Monitoring + alerting live before launch, not after
- [ ] Incident response plan written down somewhere
- [ ] Privacy Policy / ToS published and accurate
- [ ] (If AI-powered) prompt injection and cost-cap protections in place

---

## Recommended Tools

- **Secret scanning:** `gitleaks`, `trufflehog`, GitHub secret scanning
- **Dependency scanning:** `npm audit`, `pip-audit`, Snyk, Dependabot, OSV-Scanner
- **Dynamic scanning:** OWASP ZAP, Burp Suite Community
- **Static analysis (SAST):** Semgrep, CodeQL
- **Headers check:** [securityheaders.com](https://securityheaders.com)
- **SSL/TLS check:** [ssllabs.com/ssltest](https://www.ssllabs.com/ssltest/)
- **General reference:** [OWASP Top 10](https://owasp.org/www-project-top-ten/), [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)

---

## 16. AI Audit Prompt — Run This Checklist Automatically

Paste the prompt below into your AI coding assistant (Claude Code, Cursor, Copilot Chat, Windsurf, etc.) with this file open or attached in the repo. It instructs the model to work through every check above, inspect the actual codebase, and produce a findings report — instead of just giving a generic summary.

**Best with agentic tools** that can read files (Claude Code, Cursor Agent mode, Windsurf) — a plain chat model without repo access can only reason generically. Run it per-PR or before every release, not just once. On large repos, ask it to audit one section at a time to avoid it skimming under context pressure.

```
You are performing a security audit of this codebase before production deployment.

Use the checklist in this file (sections 1–15 above, including the Final Pre-Launch
Checklist) as your audit checklist. Go through it section by section, in order.

For EACH numbered check:

1. Search the actual codebase for the relevant code (routes, middleware, auth logic,
   env config, DB queries, file upload handlers, etc.) — do not answer from general
   knowledge alone. Open and read the real files.
2. Determine a status:
   - PASS — the check is properly implemented. Cite the file(s)/line(s) as evidence.
   - FAIL — the check is missing or broken. Explain exactly what's missing and why
     it's exploitable, with a concrete example of how it could be abused if possible.
   - PARTIAL — something exists but is incomplete or misconfigured. Explain the gap.
   - N/A — genuinely does not apply to this project (justify briefly why).
3. For every FAIL or PARTIAL, propose a specific, minimal code fix — not just advice.
   Show the actual diff/snippet where practical, matching this codebase's existing
   language, framework, and style.

Rules while auditing:

- Do not assume something is secure because it "looks fine" at a glance — trace the
  actual data flow (e.g. for IDOR/BOLA, find every endpoint that takes a resource ID
  and confirm ownership is checked server-side, not just that auth middleware exists).
- Flag anything where client-side data (price, role, plan, discount, permissions) is
  trusted without server-side re-verification.
- Actively search for hardcoded secrets, API keys, or credentials in the codebase and
  git history, not just in current source files.
- Check environment/config files for debug flags, exposed test routes, and permissive
  CORS settings.
- If you are not fully certain a check passes, mark it PARTIAL or FAIL rather than
  PASS — false confidence here is worse than a false alarm.
- Do not skip sections because they seem irrelevant to a "vibecoded" or small project —
  check anyway and mark N/A only if truly not applicable.

Output format:

Produce a single Markdown report titled `SECURITY_AUDIT_REPORT.md` structured as:

1. **Executive Summary** — total checks: X passed / Y failed / Z partial / W n/a,
   plus a short list of the top 5 most critical issues ranked by exploitability.
2. **Findings by Section** — mirror this checklist's section structure, one table row
   per numbered check, with columns: # | Status | Evidence/Explanation | Fix.
3. **Recommended Fix Order** — a prioritized action list (Critical → High → Medium →
   Low) so the developer knows what to patch first before deploying.

Be thorough and skeptical. The goal is to catch real vulnerabilities before an attacker
does, not to make the report look clean. If you run out of context before finishing all
sections, stop and clearly state which sections remain unaudited rather than guessing.
```

**Note:** the output file (`SECURITY_AUDIT_REPORT.md`) will contain details about your actual vulnerabilities — keep it out of version control (add it to `.gitignore`) if this repo is public.

**Claude Code users:** save the block above as `.claude/commands/security-audit.md` (with a `description:` frontmatter line) to turn it into a `/security-audit` slash command.

---

## Closing Note

Most breaches in indie/vibecoded SaaS apps aren't sophisticated zero-days — they're **missing authorization checks, exposed debug info, hardcoded secrets, and trusting client-side data**. Running through this list once, seriously, before every deploy will eliminate the overwhelming majority of real-world risk.

*Contributions and additions welcome — security is never "done."*
