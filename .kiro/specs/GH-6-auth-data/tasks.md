# Implementation Plan

## Overview

Implement auth data layer following Clean Architecture. Domain types first, then DTOs, then data source, then repository, then tests. Each task is one commit.

**Rule: One task = one commit.**

---

## Task Dependency Graph

```
T1 (domain models)
 │
 ├──► T2 (error types)
 │
 ▼
T3 (DTOs)
 │
 ├──► T4 (mappers)
 │
 ▼
T5 (token storage interface)
 │
 ├──► T6 (token storage impl)
 │
 ▼
T7 (data source interface)
 │
 ├──► T8 (data source impl)
 │
 ▼
T9 (repository port)
 │
 ├──► T10 (repository impl)
 │
 ▼
T11 (public API / index.ts)
 │
 ├──► T12 (unit tests)
 │
 ▼
T13 (verification)
```

```json
{
  "waves": [
    { "wave": 1, "tasks": ["T1", "T2"] },
    { "wave": 2, "tasks": ["T3"] },
    { "wave": 3, "tasks": ["T4"] },
    { "wave": 4, "tasks": ["T5", "T7", "T9"] },
    { "wave": 5, "tasks": ["T6", "T8", "T10"] },
    { "wave": 6, "tasks": ["T11"] },
    { "wave": 7, "tasks": ["T12"] },
    { "wave": 8, "tasks": ["T13"] }
  ]
}
```

---

## Tasks

### T1: Auth Domain Models

**R-IDs:** R3, R4, R5

**Description:** Create auth session, user, and redirect context domain models. Pure TypeScript, no React dependencies.

**Files to create/modify:**

- `src/features/auth/domain/auth-session.types.ts`
- `src/features/auth/domain/auth-user.types.ts`
- `src/features/auth/domain/register.types.ts`
- `src/features/auth/domain/index.ts`

**Verification Gate:**

- `npm run typecheck` passes
- No React/React Native imports in domain files
- Domain models use `AccessToken` from `core/domain`

**Commit:**

```
[GH-6][Rosyid] feat(auth): add auth session and user domain models
```

---

### T2: Auth Error Types

**R-IDs:** R9

**Description:** Create AuthError discriminated union covering all known auth API error codes.

**Files to create/modify:**

- `src/features/auth/domain/auth-error.types.ts`
- `src/features/auth/domain/index.ts` (add export)

**Verification Gate:**

- `npm run typecheck` passes
- Error union includes R9-AC1 codes: VALIDATION_ERROR, TOKEN_INVALID, TOKEN_EXPIRED, NIK_ALREADY_REGISTERED, CONSENT_REQUIRED, RATE_LIMITED, NETWORK_ERROR, UNKNOWN
- Feature-local error codes (e.g., for storage failure) may be added following GH-17 pattern

**Commit:**

```
[GH-6][Rosyid] feat(auth): add AuthError discriminated union
```

---

### T3: Auth DTOs

**R-IDs:** R1, R2, R3, R4, R5, R10

**Description:** Create request/response DTOs matching API contract exactly. Field names match snake_case from server.

**Files to create/modify:**

- `src/features/auth/data/dtos/magic-link.dto.ts`
- `src/features/auth/data/dtos/verify.dto.ts`
- `src/features/auth/data/dtos/register.dto.ts`
- `src/features/auth/data/dtos/refresh.dto.ts`
- `src/features/auth/data/dtos/error.dto.ts`
- `src/features/auth/data/dtos/index.ts`

**Verification Gate:**

- `npm run typecheck` passes
- DTO field names match api-contracts.md §1 exactly
- Contract fixture compatibility test passes

**Commit:**

```
[GH-6][Rosyid] feat(auth): add auth request/response DTOs
```

---

### T4: DTO Mappers

**R-IDs:** R1, R2, R3, R4, R5, R9, R10

**Description:** Create mapping functions from DTOs to domain models. Handle optional fields, error mapping.

**Files to create/modify:**

- `src/features/auth/data/mappers/verify-response.mapper.ts`
- `src/features/auth/data/mappers/refresh-response.mapper.ts`
- `src/features/auth/data/mappers/register-response.mapper.ts`
- `src/features/auth/data/mappers/error.mapper.ts`
- `src/features/auth/data/mappers/index.ts`
- `__tests__/features/auth/data/mappers/*.test.ts`

**Verification Gate:**

- `npm run typecheck` passes
- Mappers use createAccessToken from core/domain
- Mapper unit tests pass:
  - Happy-path VerifyResponse → AuthSession
  - Happy-path RefreshResponse → AuthSession
  - Error response → AuthError mapping for each code
  - Missing required field handling
  - Optional field handling (redirect_context, nik)

**Commit:**

```
[GH-6][Rosyid] feat(auth): add DTO to domain mappers with tests
```

---

### T5: Token Storage Interface

**R-IDs:** R8

**Description:** Define TokenStorage interface abstracting token persistence. Access token in memory, refresh token in secure store. NO insecure fallback.

**Files to create/modify:**

- `src/features/auth/data/storage/token-storage.port.ts`

**Verification Gate:**

- `npm run typecheck` passes
- Interface defines async methods for refresh token
- Interface documents NO fallback to insecure storage

**Commit:**

```
[GH-6][Rosyid] feat(auth): add TokenStorage interface
```

---

### T6: Token Storage Implementation

**R-IDs:** R8

**Description:** Implement TokenStorage using expo-secure-store for refresh token, memory variable for access token. SecureStore failure surfaces through Result failure, NOT insecure fallback.

**Files to create/modify:**

- `src/features/auth/data/storage/token-storage.service.ts`
- `src/features/auth/data/storage/index.ts`
- `__tests__/features/auth/data/storage/token-storage.test.ts`

**Verification Gate:**

- `npm run typecheck` passes
- expo-secure-store imported correctly
- Unit tests pass:
  - Access token memory-only storage/retrieval
  - Access token cleared on clearAccessToken()
  - Refresh token SecureStore storage/retrieval
  - Refresh token cleared on clearRefreshToken()
  - clearAll() clears both
  - **SecureStore failure returns Result.err (NOT AsyncStorage fallback)**
  - **No AsyncStorage import exists in token-storage.service.ts**

**Commit:**

```
[GH-6][Rosyid] feat(auth): implement TokenStorage with expo-secure-store
```

---

### T7: Auth Data Source Interface

**R-IDs:** R6

**Description:** Define AuthRemoteDataSource interface with all auth API methods.

**Files to create/modify:**

- `src/features/auth/data/auth-remote.datasource.port.ts`

**Verification Gate:**

- `npm run typecheck` passes
- Interface uses DTOs for params/returns
- Methods match api-contracts.md §1.1-§1.5

**Commit:**

```
[GH-6][Rosyid] feat(auth): add AuthRemoteDataSource interface
```

---

### T8: Auth Data Source Implementation

**R-IDs:** R1, R2, R3, R4, R5, R6

**Description:** Implement AuthRemoteDataSource with fetch calls to auth endpoints. Handle HTTP errors. NO automatic retry.

**Files to create/modify:**

- `src/features/auth/data/auth-remote.datasource.ts`
- `__tests__/features/auth/data/auth-remote.datasource.test.ts`

**Verification Gate:**

- `npm run typecheck` passes
- All endpoints implemented per api-contracts.md §1
- MSW integration tests pass:
  - POST /auth/magic-link correct method/path/payload
  - POST /auth/magic-link/resend correct method/path/payload
  - GET /auth/verify correct method/path/query
  - POST /auth/register correct method/path/payload
  - POST /auth/refresh correct method/path/payload (body, not header)
  - 429 rate limit response handling
  - 401 TOKEN_INVALID response handling
  - 401 TOKEN_EXPIRED response handling
  - 409 NIK_ALREADY_REGISTERED response handling
  - 422 CONSENT_REQUIRED response handling
  - Network failure → NETWORK_ERROR
  - **No automatic retry logic implemented**

**Commit:**

```
[GH-6][Rosyid] feat(auth): implement AuthRemoteDataSource HTTP adapter
```

---

### T9: Auth Repository Port

**R-IDs:** R7

**Description:** Define AuthRepositoryPort interface in domain layer. This is the contract for the repository.

**Files to create/modify:**

- `src/features/auth/domain/auth-repository.port.ts`
- `src/features/auth/domain/index.ts` (add export)

**Verification Gate:**

- `npm run typecheck` passes
- Port uses domain types only (no DTOs)
- `npm run boundary-check` passes

**Commit:**

```
[GH-6][Rosyid] feat(auth): add AuthRepository port interface
```

---

### T10: Auth Repository Implementation

**R-IDs:** R1, R2, R3, R4, R5, R7

**Description:** Implement AuthRepository connecting data source, mappers, and token storage. Manage session lifecycle. NO automatic refresh retry.

**Files to create/modify:**

- `src/features/auth/data/auth.repository.ts`
- `__tests__/features/auth/data/auth.repository.test.ts`

**Verification Gate:**

- `npm run typecheck` passes
- Repository implements port interface
- Repository unit tests pass (mocked data source + storage):
  - requestMagicLink happy path → Result.ok
  - resendMagicLink happy path → Result.ok
  - verifyMagicLink happy path → tokens stored, Result.ok(AuthSession)
  - register happy path → Result.ok(RegisterResult)
  - refreshSession happy path → NEW tokens replace OLD tokens
  - refreshSession TOKEN_INVALID → session cleared, Result.err
  - refreshSession TOKEN_EXPIRED → session cleared, Result.err
  - refreshSession storage failure → Result.err (no fallback)
  - getCurrentSession returns in-memory session
  - clearSession clears all tokens
  - **No automatic retry on refresh failure**

**Commit:**

```
[GH-6][Rosyid] feat(auth): implement AuthRepository
```

---

### T11: Public API Export

**R-IDs:** R11, R12

**Description:** Create barrel export exposing only public types and factory function.

**Files to create/modify:**

- `src/features/auth/index.ts`

**Verification Gate:**

- `npm run boundary-check` passes
- Only public API is exported (types + factory)
- No internal data layer files directly importable from outside feature
- No prohibited feature-to-feature dependencies

**Commit:**

```
[GH-6][Rosyid] feat(auth): add public API barrel export
```

---

### T12: Test Completion

**R-IDs:** R13

**Description:** Ensure all GH-6 unit/integration tests pass with deterministic fixtures only.

**Files to create/modify:**

- `__tests__/features/auth/__fixtures__/index.ts`
- Additional test files as needed

**Verification Gate:**

- `npm test` passes
- All GH-6 tests green
- Fixtures use FAKE_NIK='0000000000000000' (synthetic)
- Fixtures use FAKE_ACCESS_TOKEN/FAKE_REFRESH_TOKEN (clearly labeled synthetic)
- No real NIK, credential, token, secret, or PII in tests

**Commit:**

```
[GH-6][Rosyid] test(auth): add auth data layer unit tests
```

---

### T13: Final Verification

**R-IDs:** R11, R12, R13, R14

**Description:** Run all CI gates, verify no boundary violations, confirm scope.

**Files to create/modify:**

- None (verification only)

**Verification Gate:**

1. `npm run lint` — exit 0
2. `npm run typecheck` — exit 0
3. `npm test` — all pass
4. `npm run boundary-check` — exit 0
5. `npx expo-doctor` — 20/20 or established exception
6. `npx expo export` — succeeds
7. `git diff` — only src/features/auth/, **tests**/features/auth/, package.json (expo-secure-store)
8. **No AsyncStorage fallback code**
9. **No automatic refresh retry logic**

**Commit:**

```
[GH-6][Rosyid] chore(auth): final verification complete
```

---

## Task Summary Table

| Task | R-IDs        | Files                                         | Verification                   | Commit                                                      |
| ---- | ------------ | --------------------------------------------- | ------------------------------ | ----------------------------------------------------------- |
| T1   | R3,R4,R5     | domain/*.types.ts                             | typecheck, no React imports    | `feat(auth): add auth session and user domain models`       |
| T2   | R9           | domain/auth-error.types.ts                    | typecheck, all error codes     | `feat(auth): add AuthError discriminated union`             |
| T3   | R1-R5,R10    | data/dtos/*.dto.ts                            | typecheck, contract match      | `feat(auth): add auth request/response DTOs`                |
| T4   | R1-R5,R9,R10 | data/mappers/*.mapper.ts + tests              | mapper unit tests              | `feat(auth): add DTO to domain mappers with tests`          |
| T5   | R8           | data/storage/token-storage.port.ts            | typecheck, no fallback         | `feat(auth): add TokenStorage interface`                    |
| T6   | R8           | data/storage/token-storage.service.ts + tests | storage tests, no AsyncStorage | `feat(auth): implement TokenStorage with expo-secure-store` |
| T7   | R6           | data/auth-remote.datasource.port.ts           | typecheck, contract match      | `feat(auth): add AuthRemoteDataSource interface`            |
| T8   | R1-R6        | data/auth-remote.datasource.ts + tests        | MSW integration tests          | `feat(auth): implement AuthRemoteDataSource HTTP adapter`   |
| T9   | R7           | domain/auth-repository.port.ts                | typecheck, boundary-check      | `feat(auth): add AuthRepository port interface`             |
| T10  | R1-R5,R7     | data/auth.repository.ts + tests               | repository unit tests          | `feat(auth): implement AuthRepository`                      |
| T11  | R11,R12      | index.ts                                      | boundary-check                 | `feat(auth): add public API barrel export`                  |
| T12  | R13          | **tests**/features/auth/**                    | npm test, synthetic fixtures   | `test(auth): add auth data layer unit tests`                |
| T13  | R11-R14      | —                                             | all 6 CI gates + scope review  | `chore(auth): final verification complete`                  |

---

## Notes

1. **expo-secure-store installation:** Implementation task T6 requires `npx expo install expo-secure-store`. This is permitted during implementation phase. Do NOT install during specification.

2. **Base URL configuration:** T8 should use environment-based API base URL per existing repo patterns.

3. **Result type pattern:** Use Result<T, E> pattern consistent with existing repo patterns. Check GH-5 core/domain for existing utilities.

4. **Mock data source for tests:** All tests use mocked interfaces. No actual HTTP calls.

5. **NO insecure fallback:** T6 MUST verify no AsyncStorage or other insecure storage is used. SecureStore failure → Result.err (not silent degradation).

6. **NO automatic retry:** T8/T10 MUST NOT implement automatic retry on refresh failure. Single-use tokens + replay detection prohibits retry.

7. **No hooks in data layer:** Reactive token updates are GH-7 presentation scope.

8. **Synthetic fixtures only:** FAKE_NIK='0000000000000000', FAKE_ACCESS_TOKEN='test_access_token_not_real_00000000', etc.
