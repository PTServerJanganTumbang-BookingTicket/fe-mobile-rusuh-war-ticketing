# Requirements Document

## GH-6 Auth Data Layer

## Introduction

Implement the authentication data layer for the Rusuh Booking Tiket mobile application. This ticket owns the auth API adapters, request/response DTOs, domain mapping, token storage, and repository implementation required for magic-link login, registration, and session refresh flows.

**Canonical Contract Sources:**

- `docs/CONTRACT-BASELINE.md` (2026-11-11 reconciliation)
- `_handoff/A-contract-vs-backend.md` §Auth Mechanisms
- `documentations/api/api-contracts.md` §1 Authentication

**Domain Dependency:** GH-5 (Core domain layer) provides `AccessToken`, `DeviceId`, branded types, and auth header composition — this ticket consumes them.

**Scope:** Data layer only. No UI screens, no navigation, no CAPTCHA integration, no deep link setup.

---

## Glossary

| Term           | Definition                                                                            |
| -------------- | ------------------------------------------------------------------------------------- |
| Magic Link     | Passwordless login via emailed link containing verification token                     |
| Access Token   | JWT HS256 account session token; TTL 22740s (6h 19m); sent as `Authorization: Bearer` |
| Refresh Token  | Opaque 256-bit token for session extension; TTL 30 days; stored in expo-secure-store  |
| Device ID      | 128-bit UUID for guest device binding; sent as `X-Device-Id`                          |
| NIK            | Nomor Induk Kependudukan — Indonesian national ID (16 digits)                         |
| Token Rotation | Refresh token is single-use; each redemption returns a new token pair                 |
| Session        | The access_token + refresh_token pair representing an authenticated user              |

---

## Requirements

### Functional Requirements

#### R1: Magic Link Request

**Description:** Send a magic link login email to the provided address.

**Contract Evidence:** `api-contracts.md` §1.1

**Endpoint:** `POST /auth/magic-link`

**Acceptance Criteria:**

- R1-AC1: Request DTO contains `email: string`
- R1-AC2: Given valid email, When request succeeds, Then response contains 200 status
- R1-AC3: Given 429 rate limit, When request fails, Then `retry_after: number` is extractable
- R1-AC4: DTO maps to domain `Result<void, AuthError>`

#### R2: Magic Link Resend

**Description:** Resend the magic link to the same email address.

**Contract Evidence:** `api-contracts.md` §1.2

**Endpoint:** `POST /auth/magic-link/resend`

**Acceptance Criteria:**

- R2-AC1: Request DTO contains `email: string`
- R2-AC2: Given valid email, When request succeeds, Then response contains 200 status
- R2-AC3: DTO maps to domain `Result<void, AuthError>`

#### R3: Magic Link Verify

**Description:** Verify the magic link token and establish a session.

**Contract Evidence:** `api-contracts.md` §1.3

**Endpoint:** `GET /auth/verify?token={token}`

**Acceptance Criteria:**

- R3-AC1: Response DTO includes `access_token`, `refresh_token`, `expires_in`, `user`
- R3-AC2: Response DTO user includes `id`, `email`, `nik?` (masked)
- R3-AC3: Response DTO optionally includes `redirect_context` for booking recovery
- R3-AC4: Given valid token, When verified, Then access token stored in memory
- R3-AC5: Given valid token, When verified, Then refresh token stored in expo-secure-store
- R3-AC6: DTO maps to domain `AuthSession` with typed tokens
- R3-AC7: Given invalid/expired token, When verified, Then `TOKEN_INVALID` error returned

#### R4: Register Account

**Description:** Register a new account with email, NIK, and consent.

**Contract Evidence:** `api-contracts.md` §1.5

**Endpoint:** `POST /auth/register`

**Acceptance Criteria:**

- R4-AC1: Request DTO contains `email`, `nik`, `consent: { accepted: boolean, policy_version: string }`
- R4-AC2: NIK is 16 digits; non-digits stripped before sending
- R4-AC3: Given valid registration, When successful, Then `user_id` is returned
- R4-AC4: Given 409 `NIK_ALREADY_REGISTERED`, When failed, Then specific error returned
- R4-AC5: Given 422 `CONSENT_REQUIRED`, When failed, Then specific error returned
- R4-AC6: Given 429 rate limit, When failed, Then `retry_after` returned
- R4-AC7: DTO maps to domain `Result<RegisterResult, AuthError>`

#### R5: Refresh Session

**Description:** Exchange refresh token for new access/refresh token pair.

**Contract Evidence:** `api-contracts.md` §1.4

**Endpoint:** `POST /auth/refresh`

**Acceptance Criteria:**

- R5-AC1: Request sends `refresh_token` in body (not header)
- R5-AC2: Response DTO includes `access_token`, `refresh_token`, `expires_in`
- R5-AC3: Given valid refresh, When successful, Then NEW access token stored in memory
- R5-AC4: Given valid refresh, When successful, Then NEW refresh token stored in expo-secure-store
- R5-AC5: Old refresh token is replaced (token rotation)
- R5-AC6: Given 401 `TOKEN_INVALID` (replay detected), When failed, Then session cleared
- R5-AC7: Given 401 `TOKEN_EXPIRED`, When failed, Then session cleared
- R5-AC8: DTO maps to domain `Result<AuthSession, AuthError>`

#### R6: Auth Data Source

**Description:** HTTP client adapter for auth endpoints.

**Contract Evidence:** Clean Architecture data layer pattern

**Acceptance Criteria:**

- R6-AC1: `AuthRemoteDataSource` interface defines all auth API methods
- R6-AC2: Implementation uses typed request/response DTOs
- R6-AC3: HTTP errors are mapped to typed `AuthError` union
- R6-AC4: Network failures are caught and wrapped as `NetworkError`
- R6-AC5: Base URL is configurable (not hardcoded)
- R6-AC6: No React/React Native imports in data source

#### R7: Auth Repository

**Description:** Repository implementation bridging data source and domain.

**Contract Evidence:** Clean Architecture repository pattern

**Acceptance Criteria:**

- R7-AC1: `AuthRepository` interface matches domain port definition
- R7-AC2: Repository consumes `AuthRemoteDataSource`
- R7-AC3: Repository manages token storage lifecycle
- R7-AC4: Repository exposes `getCurrentSession(): AuthSession | null`
- R7-AC5: Repository exposes `clearSession(): void`
- R7-AC6: No React/React Native imports in repository

#### R8: Token Storage

**Description:** Secure storage for auth tokens following security requirements.

**Contract Evidence:** GH-6 issue §Security, `A-contract-vs-backend.md` §Auth TTLs

**Acceptance Criteria:**

- R8-AC1: Access token stored in MEMORY ONLY (not secure-store, not AsyncStorage, not any persistent storage)
- R8-AC2: Refresh token stored in expo-secure-store ONLY
- R8-AC3: `TokenStorage` interface abstracts storage mechanism
- R8-AC4: Storage is clearable on logout/session end
- R8-AC5: Storage survives app restart for refresh token only
- R8-AC6: SecureStore failure MUST NOT cause fallback to insecure persistent storage (AsyncStorage, filesystem, etc.)
- R8-AC7: SecureStore unavailability is surfaced through the repository error boundary (Result failure), not silently degraded

#### R9: Auth Error Modeling

**Description:** Type-safe error handling for auth operations.

**Contract Evidence:** `api-contracts.md` §1.3, §1.4, §1.5

**Acceptance Criteria:**

- R9-AC1: `AuthError` union includes: `VALIDATION_ERROR`, `TOKEN_INVALID`, `TOKEN_EXPIRED`, `NIK_ALREADY_REGISTERED`, `CONSENT_REQUIRED`, `RATE_LIMITED`, `NETWORK_ERROR`
- R9-AC2: Rate limit error includes `retry_after_ms: number`
- R9-AC3: Errors are discriminated by `code` field
- R9-AC4: Unknown server errors are representable without type error
- R9-AC5: Feature-local error codes (e.g., for storage failure) may be added following established GH-17 pattern, but are not pre-defined here

#### R10: Auth DTOs

**Description:** Request/response data transfer objects matching API contract.

**Contract Evidence:** `api-contracts.md` §1.1-§1.5

**Acceptance Criteria:**

- R10-AC1: DTOs match exact field names and types from API contract
- R10-AC2: DTOs are separate from domain models (no mixing)
- R10-AC3: DTOs handle optional fields correctly (`redirect_context`, `nik`)
- R10-AC4: DTOs compile without React dependencies

---

### Non-Functional Requirements

#### R11: Clean Architecture Compliance

**Description:** Data layer follows Clean Architecture constraints.

**Contract Evidence:** AGENTS.md §3

**Acceptance Criteria:**

- R11-AC1: `src/features/auth/data/` imports from `domain/`, `core/domain/`, external libs
- R11-AC2: No React imports in data layer
- R11-AC3: `npm run boundary-check` passes without violations

#### R12: Type Safety

**Description:** All types compile without suppressions.

**Acceptance Criteria:**

- R12-AC1: No `@ts-ignore` or `@ts-expect-error` in auth data layer
- R12-AC2: `npm run typecheck` passes
- R12-AC3: All public types explicitly exported via `features/auth/index.ts`

#### R13: Test Coverage

**Description:** Data layer has comprehensive unit tests.

**Acceptance Criteria:**

- R13-AC1: DTO mapping has unit tests (valid + invalid cases)
- R13-AC2: Error mapping has unit tests (all error codes)
- R13-AC3: Repository behavior has unit tests (happy path + errors)
- R13-AC4: All tests pass via `npm test`

#### R14: CI Gate Compliance

**Description:** All repository CI gates must pass.

**Acceptance Criteria:**

- R14-AC1: `npm run lint` passes
- R14-AC2: `npm run typecheck` passes
- R14-AC3: `npm test` passes
- R14-AC4: `npm run boundary-check` passes
- R14-AC5: `npx expo-doctor` passes (20/20 or established exception)
- R14-AC6: `npx expo export` succeeds

---

## Constraints

1. **Data Layer Only:** No React components, hooks, or screens. UI is GH-7 scope.

2. **No CAPTCHA Integration:** CAPTCHA token is a string input for queue join; provider integration is not auth data layer scope.

3. **No Deep Link Setup:** Magic link deep link scheme configuration is noted as open question in GH-6 issue but is not data layer scope.

4. **No Saved NIKs:** Saved NIK management (`/accounts/me/saved-niks`) is a separate feature, not core auth.

5. **Domain Types from GH-5:** Use existing `AccessToken`, `DeviceId`, `AuthContext` from `core/domain/auth/`.

6. **Memory Token Rule:** Access token MUST NOT be persisted to disk/secure-store — memory only per GH-6 requirements.

7. **Fake NIK Only:** Test fixtures use fake NIK (e.g., `3201010101010001`); no real NIK data.

---

## Out of Scope

**Explicitly excluded:**

1. Auth UI screens (GH-7)
2. Navigation/routing to auth flows
3. Magic link deep link scheme configuration
4. CAPTCHA provider integration (Turnstile/reCAPTCHA)
5. Saved NIKs management (`/accounts/me/saved-niks`)
6. Email verification (`/auth/verify-email`) — different from magic link verify
7. Biometric authentication
8. Social login (OAuth providers)
9. Queue join with auth context (uses GH-6 outputs, but is queue feature)
10. Account profile management
11. Token auto-refresh mechanism (presentation/hook concern)

---

## Open Questions

| Question                    | Status   | Owner             | Impact                                                                                                                                                                                                                                                                                                              |
| --------------------------- | -------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Magic link deep link scheme | DEFERRED | GH-7/presentation | GH-6 Auth Data does not implement or configure deep link schemes; this is presentation/navigation scope. The GH-6 issue notes this as an open question requiring a decision documented in the PR — that documentation will occur at implementation time when the scheme is chosen, not in data layer specification. |

---

## Deterministic Test Fixtures

**All fixtures use unmistakably synthetic values. No real credentials, NIK, or PII.**

```typescript
// Fake NIK — clearly synthetic 16-digit value
export const FAKE_NIK = "0000000000000000";
export const FAKE_NIK_MASKED = "0000********0000";

// Synthetic user — example.com domain per RFC 2606
export const FAKE_USER_ID = "usr_test_00000000";
export const FAKE_EMAIL = "test@example.com";

// Synthetic tokens — clearly labeled, not JWT-like
export const FAKE_ACCESS_TOKEN = "test_access_token_not_real_00000000";
export const FAKE_REFRESH_TOKEN = "test_refresh_token_not_real_00000000";

// Synthetic policy version
export const FAKE_POLICY_VERSION = "0000-00-00";
```

---

## Definition of Done (DoD) Criteria

### Implementation Quality

| Criterion                          | Verification Method | Evidence Required               |
| ---------------------------------- | ------------------- | ------------------------------- |
| All R1-R14 acceptance criteria met | Checklist review    | Each AC verified                |
| Data layer has no React imports    | Boundary check      | `npm run boundary-check` exit 0 |
| All unit tests pass                | Jest                | `npm test` exit 0               |
| No type suppressions               | Code review         | No `@ts-ignore`                 |
| Contract alignment verified        | Manual review       | DTOs match api-contracts.md §1  |

### CI Gates (AGENTS.md §5-6)

| Gate           | Command                  | Evidence            |
| -------------- | ------------------------ | ------------------- |
| lint           | `npm run lint`           | Exit 0              |
| typecheck      | `npm run typecheck`      | Exit 0              |
| test           | `npm test`               | All tests pass      |
| boundary-check | `npm run boundary-check` | Exit 0              |
| expo-doctor    | `npx expo-doctor`        | 20/20 or exception  |
| expo-export    | `npx expo export`        | iOS/Android bundles |

### Git/PR Requirements (AGENTS.md §4)

| Criterion      | Verification                                    |
| -------------- | ----------------------------------------------- |
| Branch naming  | `story/GH-6-auth-data`                          |
| Commit format  | `[GH-6][Rosyid] <type>(<scope>): <description>` |
| No hook bypass | No `--no-verify`                                |
