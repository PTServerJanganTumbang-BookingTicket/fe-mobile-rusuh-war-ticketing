# Design — GH-6 Auth Data Layer

## Overview

Implement the authentication data layer following Clean Architecture principles. The auth feature module owns API communication, DTO mapping, token lifecycle, and repository implementation. Domain types from GH-5 (`AccessToken`, `DeviceId`, auth headers) are consumed but not modified.

**Architecture Pattern:** Feature-first Clean Architecture per AGENTS.md §2

---

## Architecture

### Domain Layer (`src/features/auth/domain/`)

Feature-specific domain models and port interfaces. Depends only on `core/domain/`.

**Components:**

- `auth-session.types.ts` — AuthSession, AuthUser domain models
- `auth-error.types.ts` — AuthError discriminated union
- `auth-repository.port.ts` — Repository interface (port)

### Data Layer (`src/features/auth/data/`)

Repository implementations, data sources, DTOs. Depends on domain layer.

**Components:**

- `dtos/` — Request/response DTOs matching API contract
- `mappers/` — DTO ↔ domain mapping functions
- `auth-remote.datasource.ts` — HTTP client for auth endpoints
- `auth.repository.ts` — Repository implementation
- `token-storage.service.ts` — Token persistence abstraction

### Public API (`src/features/auth/index.ts`)

Barrel export exposing only public types and repository factory.

---

## Component Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          features/auth/                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                     domain/                                  │    │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │    │
│  │  │ auth-session.   │  │ auth-error.     │  │ auth-repo.  │  │    │
│  │  │ types.ts        │  │ types.ts        │  │ port.ts     │  │    │
│  │  └─────────────────┘  └─────────────────┘  └──────┬──────┘  │    │
│  └───────────────────────────────────────────────────│──────────┘    │
│                                                       │              │
│  ┌────────────────────────────────────────────────────│──────────┐   │
│  │                      data/                         ▼          │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────────────────┐│   │
│  │  │ dtos/    │  │ mappers/ │  │     auth.repository.ts       ││   │
│  │  │          │◄─┤          │◄─┤     (implements port)        ││   │
│  │  └──────────┘  └──────────┘  └──────────────────────────────┘│   │
│  │        ▲                              │          │            │   │
│  │        │                              ▼          ▼            │   │
│  │  ┌─────────────────────────┐  ┌───────────────────────────┐  │   │
│  │  │ auth-remote.datasource  │  │ token-storage.service     │  │   │
│  │  │ (HTTP calls)            │  │ (expo-secure-store)       │  │   │
│  │  └─────────────────────────┘  └───────────────────────────┘  │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  index.ts (public API)                                          │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
         │
         │ imports
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       core/domain/                                   │
│  ┌─────────────────┐  ┌─────────────────┐                           │
│  │ auth/tokens.    │  │ auth/headers.   │                           │
│  │ types.ts        │  │ types.ts        │                           │
│  │ (AccessToken,   │  │ (AuthContext,   │                           │
│  │  DeviceId)      │  │  createAccount  │                           │
│  │                 │  │  Headers)       │                           │
│  └─────────────────┘  └─────────────────┘                           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Magic Link Login Flow

```
1. User enters email
   │
   ▼
2. UI calls repository.requestMagicLink(email)
   │
   ▼
3. Repository calls dataSource.requestMagicLink(dto)
   │
   ▼
4. DataSource → POST /auth/magic-link { email }
   │
   ▼
5. Response mapped → Result<void, AuthError>
   │
   ▼
6. [User clicks email link → deep link opens app]
   │
   ▼
7. UI calls repository.verifyMagicLink(token)
   │
   ▼
8. Repository calls dataSource.verifyMagicLink(token)
   │
   ▼
9. DataSource → GET /auth/verify?token={token}
   │
   ▼
10. Response DTO mapped → AuthSession
    │
    ▼
11. Repository stores tokens:
    - access_token → memory (tokenStorage.setAccessToken)
    - refresh_token → expo-secure-store (tokenStorage.setRefreshToken)
    │
    ▼
12. Returns Result<AuthSession, AuthError>
```

### Token Refresh Flow

```
1. Access token expires / 401 received
   │
   ▼
2. UI/interceptor calls repository.refreshSession()
   │
   ▼
3. Repository retrieves refresh_token from storage
   │
   ▼
4. Repository calls dataSource.refreshSession({ refresh_token })
   │
   ▼
5. DataSource → POST /auth/refresh { refresh_token }
   │
   ▼
6. Response DTO mapped → new AuthSession
   │
   ▼
7. Repository replaces tokens:
   - OLD access_token discarded
   - NEW access_token → memory
   - OLD refresh_token discarded (rotation)
   - NEW refresh_token → expo-secure-store
   │
   ▼
8. Returns Result<AuthSession, AuthError>
```

---

## Components and Interfaces

### Components

| Component              | Responsibility                         | Layer  |
| ---------------------- | -------------------------------------- | ------ |
| `AuthSession`          | Domain model for authenticated session | Domain |
| `AuthUser`             | Domain model for user info             | Domain |
| `AuthError`            | Discriminated error union              | Domain |
| `AuthRepositoryPort`   | Repository interface contract          | Domain |
| `MagicLinkRequestDto`  | Request DTO for magic link             | Data   |
| `VerifyResponseDto`    | Response DTO for verify                | Data   |
| `RefreshRequestDto`    | Request DTO for refresh                | Data   |
| `RegisterRequestDto`   | Request DTO for register               | Data   |
| `AuthRemoteDataSource` | HTTP adapter for auth API              | Data   |
| `AuthRepository`       | Repository implementation              | Data   |
| `TokenStorageService`  | Token persistence abstraction          | Data   |

### Interfaces

```typescript
// === Domain Layer ===

/** Authenticated session domain model */
interface AuthSession {
  readonly accessToken: AccessToken;
  readonly expiresAt: Date;
  readonly user: AuthUser;
}

/** Authenticated user info */
interface AuthUser {
  readonly id: string;
  readonly email: string;
  readonly nikMasked: string | null;
}

/** Redirect context for booking recovery */
interface RedirectContext {
  readonly type: "booking" | "queue";
  readonly eventId: string;
  readonly bookingId?: string;
}

/** Auth error discriminated union */
type AuthError =
  | { code: "VALIDATION_ERROR"; message: string }
  | { code: "TOKEN_INVALID"; message: string }
  | { code: "TOKEN_EXPIRED"; message: string }
  | { code: "NIK_ALREADY_REGISTERED"; message: string }
  | { code: "CONSENT_REQUIRED"; message: string }
  | { code: "RATE_LIMITED"; retryAfterMs: number }
  | { code: "NETWORK_ERROR"; message: string }
  | { code: "UNKNOWN"; message: string; originalCode?: string };

// Note: Feature-local error codes for storage failures may be added
// during implementation following GH-17 pattern. Not pre-defined here.

/** Repository port (interface) */
interface AuthRepositoryPort {
  requestMagicLink(email: string): Promise<Result<void, AuthError>>;
  resendMagicLink(email: string): Promise<Result<void, AuthError>>;
  verifyMagicLink(token: string): Promise<Result<AuthSession, AuthError>>;
  register(params: RegisterParams): Promise<Result<RegisterResult, AuthError>>;
  refreshSession(): Promise<Result<AuthSession, AuthError>>;
  getCurrentSession(): AuthSession | null;
  clearSession(): Promise<void>;
}

// === Data Layer ===

/** Token storage interface */
interface TokenStorage {
  getAccessToken(): AccessToken | null;
  setAccessToken(token: AccessToken): void;
  clearAccessToken(): void;

  getRefreshToken(): Promise<string | null>;
  setRefreshToken(token: string): Promise<void>;
  clearRefreshToken(): Promise<void>;

  clearAll(): Promise<void>;
}
```

---

## Data Models

### Domain Models

```typescript
// src/features/auth/domain/auth-session.types.ts

import type { AccessToken } from "@/core/domain";

/**
 * Authenticated session domain model.
 * Represents a logged-in user with valid tokens.
 */
export interface AuthSession {
  /** JWT access token (from GH-5 core/domain) */
  readonly accessToken: AccessToken;
  /** Token expiration timestamp */
  readonly expiresAt: Date;
  /** Authenticated user info */
  readonly user: AuthUser;
  /** Optional redirect context for booking recovery */
  readonly redirectContext?: RedirectContext;
}

/**
 * Authenticated user info.
 * Subset of account data returned on login.
 */
export interface AuthUser {
  /** User ID (usr_xxx format) */
  readonly id: string;
  /** User email address */
  readonly email: string;
  /** Masked NIK if registered, null otherwise */
  readonly nikMasked: string | null;
}

/**
 * Redirect context from active engagement.
 * Returned when user logs in with existing booking/queue position.
 */
export interface RedirectContext {
  /** Context type */
  readonly type: "booking" | "queue";
  /** Event ID */
  readonly eventId: string;
  /** Booking ID (only if type is 'booking') */
  readonly bookingId?: string;
  /** Optional message */
  readonly message?: string;
}

/**
 * Registration parameters.
 */
export interface RegisterParams {
  /** User email */
  readonly email: string;
  /** NIK (16 digits) */
  readonly nik: string;
  /** Consent acceptance */
  readonly consent: {
    readonly accepted: boolean;
    readonly policyVersion: string;
  };
}

/**
 * Registration result.
 */
export interface RegisterResult {
  /** Created user ID */
  readonly userId: string;
}
```

### DTOs

```typescript
// src/features/auth/data/dtos/magic-link.dto.ts

/** POST /auth/magic-link request */
export interface MagicLinkRequestDto {
  email: string;
}

/** POST /auth/magic-link response (success) */
export interface MagicLinkResponseDto {
  meta: { code: 200; message: string };
  data: Record<string, never>;
}

/** POST /auth/magic-link response (rate limited) */
export interface MagicLinkRateLimitedDto {
  meta: { code: 429; message: string };
  data: { retry_after: number };
}

// src/features/auth/data/dtos/verify.dto.ts

/** GET /auth/verify response */
export interface VerifyResponseDto {
  meta: { code: 200; message: string; server_time?: string };
  data: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    user: {
      id: string;
      email: string;
      nik?: string; // masked
    };
    redirect_context?: {
      type: "booking" | "queue";
      event_id: string;
      booking_id?: string;
      message?: string;
    };
  };
}

// src/features/auth/data/dtos/register.dto.ts

/** POST /auth/register request */
export interface RegisterRequestDto {
  email: string;
  nik: string;
  consent: {
    accepted: boolean;
    policy_version: string;
  };
}

/** POST /auth/register response */
export interface RegisterResponseDto {
  meta: { code: 200 | 201; message: string };
  data: { user_id: string };
}

// src/features/auth/data/dtos/refresh.dto.ts

/** POST /auth/refresh request */
export interface RefreshRequestDto {
  refresh_token: string;
}

/** POST /auth/refresh response */
export interface RefreshResponseDto {
  meta: { code: 200; message: string };
  data: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
}
```

---

## Correctness Properties

### Property 1: Access Token Memory-Only

**Validates: Requirements 8.1**

Access token MUST NOT persist to disk or secure storage. It exists only in JavaScript memory and is lost on app termination. This limits exposure window if device is compromised. (R8-AC1)

### Property 2: Refresh Token Rotation

**Validates: Requirements 5.5**

Each refresh call returns a NEW refresh token. The OLD token is immediately invalidated server-side. Client MUST replace stored token atomically. Replay of old token triggers full session revocation. (R5-AC5, R5-AC6)

### Property 3: Session Clearance on Auth Failure

**Validates: Requirements 5.6, 5.7**

On `TOKEN_INVALID` or `TOKEN_EXPIRED` during refresh, the repository MUST clear ALL stored tokens. Partial session state is invalid. (R5-AC6, R5-AC7)

### Property 4: DTO-Domain Separation

**Validates: Requirements 10.2**

DTOs are never passed to domain consumers. Mapping functions transform DTOs to domain models at the data layer boundary. Domain models use branded types (AccessToken) where applicable. (R10-AC2)

### Property 5: Error Type Completeness

**Validates: Requirements 9.1, 9.4**

AuthError union covers all known API error codes. Unknown codes are captured in `UNKNOWN` variant with original code preserved for debugging. No error silently drops information. (R9-AC1, R9-AC4)

---

## Error Handling

| Error Type               | Layer | Handling Strategy           | User Feedback               |
| ------------------------ | ----- | --------------------------- | --------------------------- |
| `RATE_LIMITED`           | Data  | Return `retry_after_ms`     | UI shows countdown          |
| `TOKEN_INVALID`          | Data  | Clear session, return error | Redirect to login           |
| `TOKEN_EXPIRED`          | Data  | Clear session, return error | Redirect to login           |
| `NIK_ALREADY_REGISTERED` | Data  | Return specific error       | UI shows message            |
| `CONSENT_REQUIRED`       | Data  | Return specific error       | UI prompts consent          |
| `NETWORK_ERROR`          | Data  | Wrap with offline indicator | UI shows offline state      |
| `VALIDATION_ERROR`       | Data  | Return with message         | UI shows validation message |
| Unknown 4xx/5xx          | Data  | Wrap as `UNKNOWN`           | UI shows generic error      |

---

## Testing Strategy

### Unit Tests

| Test Suite                | Coverage                                    |
| ------------------------- | ------------------------------------------- |
| `mappers/*.test.ts`       | DTO → Domain mapping, error mapping         |
| `auth.repository.test.ts` | Repository behavior with mocked data source |
| `token-storage.test.ts`   | Storage get/set/clear operations            |
| `dtos/*.test.ts`          | DTO validation (type guards)                |

### Integration Tests

| Test Suite                      | Coverage                         |
| ------------------------------- | -------------------------------- |
| `auth-flow.integration.test.ts` | Full login/refresh flow with MSW |

### Test Fixtures

**Deterministic fixtures with unmistakably synthetic values:**

```typescript
// __tests__/features/auth/__fixtures__/

// Fake NIK — clearly synthetic (all zeros)
export const FAKE_NIK = "0000000000000000";
export const FAKE_NIK_MASKED = "0000********0000";

// Synthetic identifiers
export const FAKE_USER_ID = "usr_test_00000000";
export const FAKE_EMAIL = "test@example.com"; // RFC 2606 reserved

// Synthetic tokens — clearly labeled, not resembling real credentials
export const FAKE_ACCESS_TOKEN = "test_access_token_not_real_00000000";
export const FAKE_REFRESH_TOKEN = "test_refresh_token_not_real_00000000";

export const mockVerifyResponse: VerifyResponseDto = {
  meta: { code: 200, message: "Login successful" },
  data: {
    access_token: FAKE_ACCESS_TOKEN,
    refresh_token: FAKE_REFRESH_TOKEN,
    expires_in: 22740,
    user: {
      id: FAKE_USER_ID,
      email: FAKE_EMAIL,
      nik: FAKE_NIK_MASKED,
    },
  },
};

export const mockRateLimitResponse = {
  meta: { code: 429, message: "Rate limited" },
  data: { retry_after: 60 },
};

export const mockTokenInvalidResponse = {
  meta: { code: 401, message: "Session ended", error_code: "TOKEN_INVALID" },
  data: {},
};
```

---

## ADRs (Architecture Decision Records)

### ADR-1: Memory-Only Access Token

**Context:** GH-6 issue specifies "Access token stored in memory only". This differs from typical patterns where both tokens might use secure storage.

**Decision:** Store access token in JavaScript memory (module-level variable or singleton). Do NOT use expo-secure-store for access token.

**Consequences:**

- Access token lost on app termination
- Requires refresh on every cold start
- Reduces exposure window if device compromised
- Simpler than encrypted memory caching

### ADR-2: Token Storage Service Abstraction

**Context:** Direct expo-secure-store usage in repository couples data layer to React Native specifics.

**Decision:** Create `TokenStorage` interface with expo-secure-store implementation. Repository depends on interface.

**Consequences:**

- Repository is testable with mock storage
- Easier migration if storage mechanism changes
- Slightly more code complexity

### ADR-3: Result Type for Auth Operations

**Context:** Auth operations can fail with various typed errors. Exception throwing loses type information.

**Decision:** Use `Result<T, AuthError>` return type pattern. Success returns `{ ok: true, data: T }`, failure returns `{ ok: false, error: AuthError }`.

**Consequences:**

- Exhaustive error handling at call sites
- Type-safe error discrimination
- No try/catch required at repository boundary
- Consistent with GH-5 core/domain patterns

---

## Dependencies

### Internal (from GH-5)

- `@/core/domain` — `AccessToken`, `DeviceId`, `createAccessToken`

### External (new)

- `expo-secure-store` — Encrypted storage for refresh token

### Dev Dependencies

- `msw` — API mocking for tests (already in repo)

---

## Risks

| Risk                               | Likelihood | Impact | Mitigation                                                                              |
| ---------------------------------- | ---------- | ------ | --------------------------------------------------------------------------------------- |
| Secure store unavailable on device | Low        | High   | Surface failure through repository error boundary; do NOT fall back to insecure storage |

**Explicitly NOT risks requiring mitigation:**

- Token rotation network failure: No automatic retry. Per api-contracts.md §1.4, tokens are single-use and replay triggers revocation. Network failure is surfaced as error; no retry invented.
- Memory token lost on process termination: Access token is memory-only per requirement. Process termination clears it. Session restoration behavior (if any) depends on refresh token in SecureStore, which is retrieved on next app launch if presentation layer initiates refresh.

---

## Security Constraints

### No Insecure Fallback

**CRITICAL:** If expo-secure-store is unavailable or fails:

- Refresh token MUST NOT be stored in AsyncStorage
- Refresh token MUST NOT be stored in filesystem
- Refresh token MUST NOT be stored in any other persistent mechanism
- Failure is surfaced through the repository error boundary (Result failure)
- The user cannot maintain a persistent session on that device

### No Automatic Retry on Refresh

**CRITICAL:** Per api-contracts.md §1.4:

- Refresh tokens are single-use
- Replay of a used token triggers full session revocation
- GH-6 MUST NOT implement automatic retry for refresh operations
- Network/transport failure returns error to caller; no retry policy invented

### Process Termination Behavior

Per GH-6 requirement (access token memory-only):

- Access token is lost on process termination (expected)
- GH-6 does not define session restoration policy
- If presentation layer calls refreshSession() on cold start and refresh token exists in SecureStore, refresh proceeds normally
- If refresh token does not exist (user never logged in, or SecureStore cleared), no session exists

---

## Open Questions

None blocking DoR. Deep link scheme is noted in GH-6 issue but is presentation/navigation concern, not data layer.
