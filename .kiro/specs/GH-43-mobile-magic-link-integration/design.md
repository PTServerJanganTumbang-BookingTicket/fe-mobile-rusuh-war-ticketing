# Design — GH-43 Mobile Magic-Link Integration

## Overview

This design addresses two integration gaps in mobile magic-link verification:

1. **Token Transport (IMPLEMENTABLE):** Update the internal adapter to send verification token via HTTP `Cookie` header instead of query parameter, matching the backend contract.

2. **Email Return Path (BLOCKED):** Define how magic-link email returns the user to the mobile app. This requires backend team decision and has no authoritative evidence.

**Design Principle:** Internal adapter change only. The `AuthRepositoryPort.verifyMagicLink(token)` public API remains unchanged. Callers see no difference; only the HTTP transport mechanism changes.

---

## Architecture

### Domain Layer

**No changes.** Domain types (`AuthSession`, `AuthError`, etc.) are unchanged.

### Data Layer

**Single file change:** `src/features/auth/data/auth-remote.datasource.ts`

The `verifyMagicLink(token)` method implementation changes from query parameter to cookie header transport.

### Presentation Layer

**No changes.** Presentation layer continues to call `verifyMagicLink(token)` through the repository. The internal transport mechanism is invisible to callers.

---

## Component Diagram

```
┌───────────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER (unchanged)                      │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  useAuth() / VerifyScreen                                           │  │
│  │                                                                     │  │
│  │  const result = await authRepository.verifyMagicLink(token);        │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                      │                                     │
│                                      ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  AuthRepositoryPort (interface unchanged)                           │  │
│  │                                                                     │  │
│  │  verifyMagicLink(token: string): Promise<AuthResult<AuthSession>>   │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                        DATA LAYER (GH-43 change)                           │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  AuthRemoteDataSourceImpl                                           │  │
│  │                                                                     │  │
│  │  BEFORE (GH-6, query param):                                        │  │
│  │    const url = new URL("/auth/verify", this.baseUrl);               │  │
│  │    url.searchParams.set("token", token);                            │  │
│  │    return this.get(url.pathname + url.search);                      │  │
│  │                                                                     │  │
│  │  AFTER (GH-43, cookie header):                                      │  │
│  │    const response = await fetch(url, {                              │  │
│  │      method: "GET",                                                 │  │
│  │      headers: {                                                     │  │
│  │        "Accept": "application/json",                                │  │
│  │        "Cookie": `magic_token=${encodeURIComponent(token)}`,        │  │
│  │      },                                                             │  │
│  │      credentials: "omit",                                           │  │
│  │    });                                                              │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                        BACKEND (unchanged)                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  GET /auth/verify                                                   │  │
│  │                                                                     │  │
│  │  Reads: Cookie: magic_token={token}                                 │  │
│  │  Returns: { access_token, refresh_token, expires_in, user }         │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Verification Flow (After GH-43)

```
1. User taps magic link in email
   │
   ▼
2. [BLOCKED] App receives token via return mechanism
   │         (Deep link? Universal Link? Web redirect?)
   │         NO AUTHORITATIVE EVIDENCE
   │
   ▼
3. Presentation calls verifyMagicLink(token)
   │
   ▼
4. Repository delegates to data source
   │
   ▼
5. Data source constructs HTTP request:
   │  GET /auth/verify
   │  Cookie: magic_token={token}
   │  credentials: 'omit'
   │
   ▼
6. Backend verifies token from cookie
   │
   ▼
7. Backend returns session credentials
   │
   ▼
8. Data source maps response to VerifyResponseDto
   │
   ▼
9. Repository maps to AuthSession
   │
   ▼
10. Presentation receives AuthResult<AuthSession>
```

---

## Components and Interfaces

### Components

| Component                  | Responsibility                       | Layer  | Change       |
| -------------------------- | ------------------------------------ | ------ | ------------ |
| `AuthRemoteDataSourceImpl` | HTTP transport for auth endpoints    | Data   | **MODIFIED** |
| `AuthRepositoryImpl`       | Orchestrates data source + storage   | Data   | Unchanged    |
| `AuthRepositoryPort`       | Public interface for auth operations | Domain | Unchanged    |
| `AuthSession`              | Session domain entity                | Domain | Unchanged    |
| `AuthError`                | Error domain types                   | Domain | Unchanged    |

### Interfaces

```typescript
// AuthRepositoryPort — UNCHANGED
interface AuthRepositoryPort {
  verifyMagicLink(token: string): Promise<AuthResult<AuthSession>>;
  // ... other methods unchanged
}

// AuthRemoteDataSource — signature UNCHANGED, implementation CHANGED
interface AuthRemoteDataSource {
  verifyMagicLink(token: string): Promise<DataSourceResult<VerifyResponseDto>>;
  // ... other methods unchanged
}
```

---

## Data Models

No changes to data models. All DTOs and domain entities remain as defined in GH-6.

---

## Correctness Properties

### Property 1: Token Not in URL

**Validates: Requirements 1.2, 1.3**

The verification token MUST NOT appear in the URL (query string or path). This prevents credential exposure in browser history, referrer headers, and access logs. (R1-AC2, R1-AC3)

**Enforcement:** Unit test asserts URL does not contain token.

### Property 2: Cookie Header Contains Token

**Validates: Requirements 1.1**

The verification token MUST be sent in the `Cookie: magic_token={token}` header. This matches the backend contract. (R1-AC1)

**Enforcement:** Unit test asserts Cookie header is present with correct value.

### Property 3: Credentials Omit Mode

**Validates: Requirements 1.5**

The fetch request MUST use `credentials: 'omit'` to prevent automatic browser cookie handling that could interfere with explicit header. (R1-AC5)

**Enforcement:** Unit test asserts credentials mode.

### Property 4: Public API Unchanged

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

The `verifyMagicLink(token)` method signature and return type MUST remain unchanged. Callers MUST NOT need modification. (R2-AC1 through R2-AC4)

**Enforcement:** TypeScript compilation, existing GH-6 tests pass.

### Property 5: Security Invariants Preserved

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

GH-6 security constraints (access token memory-only, refresh token SecureStore-only, no insecure fallback, no automatic retry) MUST be preserved. (R3-AC1 through R3-AC4)

**Enforcement:** No changes to token storage code, existing GH-6 security tests pass.

---

## Error Handling

No changes to error handling. All error mappings remain as defined in GH-6.

| Error Type      | Layer         | Handling Strategy          | User Feedback      |
| --------------- | ------------- | -------------------------- | ------------------ |
| TOKEN_INVALID   | Data → Domain | Map to `TokenInvalidError` | "Link is invalid"  |
| TOKEN_EXPIRED   | Data → Domain | Map to `TokenExpiredError` | "Link has expired" |
| Network failure | Data          | Wrap as `NetworkError`     | "Connection error" |

---

## Testing Strategy

### Unit Tests (IMPLEMENTABLE)

| Test ID | Description                                  | File                             | Status |
| ------- | -------------------------------------------- | -------------------------------- | ------ |
| T-U1    | Cookie header contains `magic_token={token}` | `auth-remote.datasource.test.ts` | READY  |
| T-U2    | Token NOT in URL query string                | Same                             | READY  |
| T-U3    | Token NOT in URL path                        | Same                             | READY  |
| T-U4    | `credentials: 'omit'` used                   | Same                             | READY  |
| T-U5    | Token is URL-encoded in cookie value         | Same                             | READY  |

### Integration Tests (IMPLEMENTABLE)

| Test ID | Description                                        | File              | Status |
| ------- | -------------------------------------------------- | ----------------- | ------ |
| T-I1    | MSW intercepts GET /auth/verify with Cookie header | New test file     | READY  |
| T-I2    | Full repository flow with mock backend             | Extend GH-6 tests | READY  |

### Platform Qualification Tests (PARTIALLY READY)

| Test ID | Description                        | Device           | Status               |
| ------- | ---------------------------------- | ---------------- | -------------------- |
| T-P1    | Cookie header transport on iOS     | iPhone physical  | **TRANSPORT_PROVEN** |
| T-P2    | Cookie header transport on Android | Android physical | NOT TESTED           |
| T-P3    | Cookie persistence test on iOS     | iPhone physical  | NOT TESTED           |
| T-P4    | Cookie persistence test on Android | Android physical | NOT TESTED           |

### Return/Deep-Link Tests (BLOCKED)

| Test ID | Description                      | Status                     |
| ------- | -------------------------------- | -------------------------- |
| T-DL1   | Email link opens mobile app      | **BLOCKED** — no mechanism |
| T-DL2   | Token extraction from return URL | **BLOCKED** — no mechanism |
| T-DL3   | End-to-end magic-link flow       | **BLOCKED** — no mechanism |

---

## ADRs (Architecture Decision Records)

### ADR-1: Cookie Header Transport Instead of Query Parameter

**Context:** Backend `GET /auth/verify` reads `magic_token` exclusively from Cookie header. GH-6 implementation sends token as query parameter, which backend ignores.

**Decision:** Modify `auth-remote.datasource.ts` to send token via `Cookie: magic_token={token}` header with `credentials: 'omit'`.

**Consequences:**

- ✅ Matches backend contract
- ✅ Aligns with web BFF pattern
- ✅ Preserves public API
- ⚠️ Requires `credentials: 'omit'` to prevent automatic cookie handling
- ⚠️ Requires platform qualification for cookie persistence behavior

### ADR-2: Internal Change Only (No Public API Modification)

**Context:** `AuthRepositoryPort.verifyMagicLink(token)` is the public API consumed by presentation layer (future GH-7).

**Decision:** Keep the public API signature unchanged. Only the internal HTTP transport mechanism changes.

**Consequences:**

- ✅ No breaking changes for callers
- ✅ GH-6 public contract preserved
- ✅ Existing tests remain valid
- ✅ Clean Architecture boundaries respected

### ADR-3: Email Return Mechanism Deferred to Backend Decision

**Context:** No authoritative evidence exists for how magic-link email should return user to mobile app.

**Decision:** Do NOT invent `rusuh://`, Universal Links, App Links, or redirect mechanisms. Wait for backend team decision.

**Consequences:**

- ✅ No speculative implementation
- ✅ No future rework when backend decides
- ❌ GH-43 remains DOR_BLOCKED
- ❌ GH-7 R4 remains blocked

---

## Dependencies

### Internal Dependencies

- GH-6 Auth Data Layer (COMPLETE, commit `d43688f`)
- GH-3 Signal UI Foundation (no direct dependency for this ticket)

### External Dependencies

- Backend `GET /auth/verify` endpoint (unchanged)
- React Native `fetch` API
- Expo SDK 58

---

## Risks

| Risk                                             | Likelihood | Impact | Mitigation                                                       |
| ------------------------------------------------ | ---------- | ------ | ---------------------------------------------------------------- |
| Cookie persistence despite `credentials: 'omit'` | Medium     | High   | R5 defines explicit persistence test                             |
| Android transport behavior differs from iOS      | Low        | Medium | R8 requires Android qualification                                |
| Backend returns Set-Cookie that mobile persists  | Medium     | Medium | Backend already clears cookie; mobile uses `credentials: 'omit'` |
| Email return mechanism delays indefinitely       | High       | High   | Escalate to backend team; GH-7 R4 remains blocked                |

---

## Open Questions

| Question                                                       | Status         | Owner                | Impact                 |
| -------------------------------------------------------------- | -------------- | -------------------- | ---------------------- |
| Q1: How does email return user to mobile?                      | **UNRESOLVED** | Backend team         | Blocks R4, GH-7 R4     |
| Q2: Does `credentials: 'omit'` prevent persistence on iOS?     | **NEEDS TEST** | This ticket (R5)     | Security qualification |
| Q3: Does cookie transport work on Android?                     | **NEEDS TEST** | This ticket (R8)     | Platform support       |
| Q4: Does `credentials: 'omit'` prevent persistence on Android? | **NEEDS TEST** | This ticket (R5, R8) | Security qualification |

---

## Cookie Persistence Qualification Procedure

### Test Procedure (R5)

To determine whether explicit Cookie header causes unintended persistence:

1. **Setup:**
   - Fresh Expo Go installation (or clear app data)
   - Echo server that logs all request headers
   - Test app with single verification call

2. **Execute:**

   ```typescript
   // First request — send Cookie header
   await fetch("https://echo.example.com/first", {
     method: "GET",
     headers: { Cookie: "magic_token=test_value_12345" },
     credentials: "omit",
   });

   // Second request — NO explicit Cookie header
   await fetch("https://echo.example.com/second", {
     method: "GET",
     credentials: "omit",
   });
   ```

3. **Verify:**
   - Check echo server logs for `/second` request
   - If `Cookie: magic_token=test_value_12345` appears → **PERSISTENCE OCCURS**
   - If no `magic_token` cookie → **NO PERSISTENCE** ✓

4. **Document:**
   - Device model, OS version, Expo SDK version, Expo Go version
   - Test date and results
   - Screenshots of echo server logs

### Mitigation if Persistence Detected

If persistence is detected:

1. **Option A:** Use unique path per verification (e.g., `/auth/verify/{nonce}`)
   - Requires backend change — likely rejected

2. **Option B:** Clear cookies after verification via native module
   - Adds native dependency

3. **Option C:** Use POST with body instead of GET with cookie
   - Requires backend change — likely rejected

4. **Option D:** Accept persistence risk with documentation
   - Token is single-use; replay fails with TOKEN_INVALID
   - Backend clears cookie on success
