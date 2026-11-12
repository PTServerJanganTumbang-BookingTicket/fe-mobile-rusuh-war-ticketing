# Implementation Plan

## Overview

Implement cookie header token transport for mobile magic-link verification. Email return mechanism is BLOCKED pending backend decision.

**Rule: One task = one commit.**

**Status: DOR_BLOCKED** — Email return mechanism (R4) has no authoritative evidence. Cookie transport tasks (T1-T4) are dependency-safe and can proceed when R4 unblocks. Platform qualification tasks (T5-T6) require physical device access.

---

## Task Dependency Graph

```
                    ┌─────────────────────────────┐
                    │  R4 BACKEND DECISION        │
                    │  (Email Return Mechanism)   │
                    │  STATUS: BLOCKED            │
                    └─────────────────────────────┘
                                │
                                │ unblocks
                                ▼
┌───────────────────────────────────────────────────────────────────┐
│                     COOKIE TRANSPORT (Ready)                       │
│                                                                   │
│   T1: Cookie header transport implementation                       │
│    │                                                              │
│    ├──► T2: Unit tests for cookie construction                    │
│    │                                                              │
│    └──► T3: Integration test with MSW                             │
│                     │                                             │
│                     ▼                                             │
│   T4: CI verification (all 6 gates)                               │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
                                │
                                │ requires device access
                                ▼
┌───────────────────────────────────────────────────────────────────┐
│                  PLATFORM QUALIFICATION                            │
│                                                                   │
│   T5: iOS persistence qualification                               │
│    │  (iPhone TRANSPORT_PROVEN; persistence NOT TESTED)           │
│    │                                                              │
│    └──► T6: Android qualification (transport + persistence)       │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
                                │
                                │ blocked by R4
                                ▼
┌───────────────────────────────────────────────────────────────────┐
│                  RETURN MECHANISM (BLOCKED)                        │
│                                                                   │
│   T7: Deep-link configuration                                     │
│    │  STATUS: BLOCKED — no authoritative evidence                 │
│    │                                                              │
│    └──► T8: Return path integration tests                         │
│         STATUS: BLOCKED — no authoritative evidence               │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────────┐
│   T9: Final verification + CONTRACT-BASELINE update               │
│       STATUS: BLOCKED — depends on T7, T8                         │
└───────────────────────────────────────────────────────────────────┘
```

```json
{
  "waves": [
    { "wave": 0, "tasks": ["BACKEND_DECISION"], "status": "BLOCKED" },
    { "wave": 1, "tasks": ["T1"], "status": "READY" },
    { "wave": 2, "tasks": ["T2", "T3"], "status": "READY", "parallel": true },
    { "wave": 3, "tasks": ["T4"], "status": "READY" },
    { "wave": 4, "tasks": ["T5"], "status": "READY", "requires": "iOS device" },
    {
      "wave": 5,
      "tasks": ["T6"],
      "status": "READY",
      "requires": "Android device"
    },
    {
      "wave": 6,
      "tasks": ["T7", "T8"],
      "status": "BLOCKED",
      "blockedBy": "R4"
    },
    { "wave": 7, "tasks": ["T9"], "status": "BLOCKED", "blockedBy": "T7, T8" }
  ]
}
```

---

## Tasks

### T1: Cookie Header Transport Implementation

**R-IDs:** R1, R2, R3

**Description:** Modify `auth-remote.datasource.ts` to send verification token via HTTP `Cookie` header instead of query parameter.

**Files to modify:**

- `src/features/auth/data/auth-remote.datasource.ts`

**Implementation:**

```typescript
// BEFORE (lines 79-84)
async verifyMagicLink(
  token: string
): Promise<DataSourceResult<VerifyResponseDto>> {
  const url = new URL("/auth/verify", this.baseUrl);
  url.searchParams.set("token", token);
  return this.get<VerifyResponseDto>(url.pathname + url.search);
}

// AFTER
async verifyMagicLink(
  token: string
): Promise<DataSourceResult<VerifyResponseDto>> {
  const url = new URL("/auth/verify", this.baseUrl).toString();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Cookie: `magic_token=${encodeURIComponent(token)}`,
      },
      credentials: "omit",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return this.handleResponse<VerifyResponseDto>(response);
  } catch (error) {
    clearTimeout(timeoutId);
    return { ok: false, error: this.handleFetchError(error) };
  }
}
```

**Verification Gate:**

- `npm run typecheck` passes
- Existing GH-6 tests still pass
- Code review confirms:
  - Token in Cookie header
  - Token NOT in URL
  - `credentials: 'omit'` used
  - URL encoding applied

**Commit:**

```
[GH-43][Rosyid] fix(auth): send verify token via Cookie header
```

---

### T2: Unit Tests for Cookie Construction

**R-IDs:** R1

**Description:** Add unit tests verifying cookie header construction, URL safety, and credentials mode.

**Files to create/modify:**

- `__tests__/features/auth/data/auth-remote.datasource.test.ts` (extend existing)

**Test Cases:**

```typescript
describe("verifyMagicLink cookie transport", () => {
  it("sends token in Cookie header as magic_token", async () => {
    // Assert: Cookie header contains "magic_token={token}"
  });

  it("does NOT include token in URL query string", async () => {
    // Assert: URL does not contain "token=" or the token value
  });

  it("does NOT include token in URL path", async () => {
    // Assert: URL path is exactly "/auth/verify"
  });

  it("uses credentials: omit", async () => {
    // Assert: fetch called with credentials: "omit"
  });

  it("URL-encodes token in Cookie header", async () => {
    const tokenWithSpecialChars = "abc+def/ghi=jkl";
    // Assert: Cookie header contains properly encoded value
  });

  it("handles token with unicode characters", async () => {
    // Assert: Unicode is properly encoded
  });
});
```

**Verification Gate:**

- `npm test` passes
- All new test cases pass
- Coverage includes edge cases (special chars, unicode)

**Commit:**

```
[GH-43][Rosyid] test(auth): add cookie transport unit tests
```

---

### T3: Integration Test with MSW

**R-IDs:** R1, R2

**Description:** Add integration test using MSW to verify full request flow with cookie header.

**Files to create:**

- `__tests__/features/auth/data/auth-remote.datasource.integration.test.ts`

**Test Implementation:**

```typescript
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

describe("AuthRemoteDataSource integration", () => {
  const server = setupServer();

  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it("verifyMagicLink sends Cookie header to backend", async () => {
    let capturedCookie: string | null = null;
    let capturedUrl: string | null = null;

    server.use(
      http.get("https://api.example.com/auth/verify", ({ request }) => {
        capturedCookie = request.headers.get("Cookie");
        capturedUrl = request.url;
        return HttpResponse.json({
          access_token: "fake_access",
          refresh_token: "fake_refresh",
          expires_in: 3600,
          user: { id: "1", email: "test@example.com" },
        });
      })
    );

    const dataSource = createAuthRemoteDataSource({
      baseUrl: "https://api.example.com",
    });

    await dataSource.verifyMagicLink("test_token_123");

    expect(capturedCookie).toBe("magic_token=test_token_123");
    expect(capturedUrl).not.toContain("token=");
  });
});
```

**Verification Gate:**

- `npm test` passes
- MSW captures correct Cookie header
- MSW confirms token not in URL

**Commit:**

```
[GH-43][Rosyid] test(auth): add MSW integration test for cookie transport
```

---

### T4: CI Verification

**R-IDs:** R6, R7

**Description:** Run all 6 CI gates and verify scope containment.

**Files to modify:**

- None (verification only)

**Verification Gate:**

1. `npm run lint` — exit 0
2. `npm run typecheck` — exit 0
3. `npm test` — all pass
4. `npm run boundary-check` — exit 0
5. `npx expo-doctor` — 20/20 or established exception
6. `npx expo export` — succeeds

**Scope Review:**

```bash
git diff main --name-only | sort
```

All changed files MUST be in:

- `src/features/auth/data/auth-remote.datasource.ts`
- `__tests__/features/auth/data/auth-remote.datasource*.ts`
- `.kiro/specs/GH-43-mobile-magic-link-integration/`

**Commit:**

```
[GH-43][Rosyid] chore(auth): verify CI gates pass
```

---

### T5: iOS Persistence Qualification

**R-IDs:** R5, R8

**Description:** Verify cookie persistence behavior on iOS physical device.

**Status:** TRANSPORT_PROVEN (spike), PERSISTENCE NOT TESTED

**Requires:** Physical iPhone device, Expo Go

**Test Procedure:**

1. Deploy test app to physical iPhone
2. Execute persistence test procedure (see design.md)
3. Capture echo server logs
4. Document results

**Files to create:**

- `.kiro/specs/GH-43-mobile-magic-link-integration/evidence/ios-persistence-test.md`

**Verification Gate:**

- Persistence test executed on iPhone
- Results documented with:
  - Device model
  - iOS version
  - Expo SDK version
  - Expo Go version
  - Test date
  - Echo server logs
  - PERSISTENCE or NO_PERSISTENCE verdict

**Commit:**

```
[GH-43][Rosyid] docs(auth): document iOS cookie persistence test results
```

---

### T6: Android Qualification

**R-IDs:** R5, R8

**Description:** Verify cookie transport AND persistence behavior on Android physical device.

**Status:** NOT TESTED

**Requires:** Physical Android device, Expo Go

**Test Procedure:**

1. Deploy test app to physical Android device
2. Execute transport test (same as iOS spike)
3. Execute persistence test procedure
4. Capture echo server logs
5. Document results

**Files to create:**

- `.kiro/specs/GH-43-mobile-magic-link-integration/evidence/android-qualification.md`

**Verification Gate:**

- Transport test executed on Android → TRANSPORT_PROVEN or TRANSPORT_FAILED
- Persistence test executed on Android
- Results documented with:
  - Device model
  - Android version
  - Expo SDK version
  - Expo Go version
  - Test date
  - Echo server logs
  - TRANSPORT and PERSISTENCE verdicts

**Commit:**

```
[GH-43][Rosyid] docs(auth): document Android qualification results
```

---

### T7: Deep-Link Configuration (BLOCKED)

**R-IDs:** R4

**Description:** Configure mobile app to receive magic-link callback.

**Status: BLOCKED** — No authoritative evidence for return mechanism.

**Blocked Until:**

- Backend team decides: `rusuh://`, Universal Link, App Link, web redirect, or other
- Backend notification service updated to generate mobile-compatible links
- Configuration documented in CONTRACT-BASELINE.md

**Potential Files (speculative, do not create):**

- `app.json` — scheme configuration
- `apple-app-site-association` — Universal Links
- `assetlinks.json` — Android App Links
- `src/app/(auth)/verify.tsx` — route handler

**Commit:** (Deferred)

---

### T8: Return Path Integration Tests (BLOCKED)

**R-IDs:** R4

**Description:** Test end-to-end magic-link flow from email to verified session.

**Status: BLOCKED** — Depends on T7.

**Potential Test Cases (speculative, do not implement):**

- Email link opens mobile app
- Token extracted from return URL
- Token passed to verifyMagicLink
- Session established on success
- Error displayed on TOKEN_INVALID
- Error displayed on TOKEN_EXPIRED

**Commit:** (Deferred)

---

### T9: Final Verification + CONTRACT-BASELINE Update (BLOCKED)

**R-IDs:** R4, R6, R7

**Description:** Complete final verification and update CONTRACT-BASELINE.md §5.1.

**Status: BLOCKED** — Depends on T7, T8.

**Files to modify (when unblocked):**

- `docs/CONTRACT-BASELINE.md` — Update §5.1 from "Unresolved" to defined mechanism

**Verification Gate (when unblocked):**

- All CI gates pass
- Manual E2E test: request link → open email → verify → session
- CONTRACT-BASELINE.md §5.1 updated
- GH-43 verification checkboxes updated

**Commit:** (Deferred)

---

## Task Summary Table

| Task   | R-IDs    | Files                                      | Status      | Verification              | Commit                                           |
| ------ | -------- | ------------------------------------------ | ----------- | ------------------------- | ------------------------------------------------ |
| T1     | R1,R2,R3 | auth-remote.datasource.ts                  | READY       | typecheck, existing tests | `fix(auth): send verify token via Cookie header` |
| T2     | R1       | auth-remote.datasource.test.ts             | READY       | npm test                  | `test(auth): add cookie transport unit tests`    |
| T3     | R1,R2    | auth-remote.datasource.integration.test.ts | READY       | npm test, MSW             | `test(auth): add MSW integration test`           |
| T4     | R6,R7    | —                                          | READY       | All 6 CI gates            | `chore(auth): verify CI gates pass`              |
| T5     | R5,R8    | evidence/ios-persistence-test.md           | READY       | Device test               | `docs(auth): document iOS persistence test`      |
| T6     | R5,R8    | evidence/android-qualification.md          | READY       | Device test               | `docs(auth): document Android qualification`     |
| **T7** | R4       | app.json, routes                           | **BLOCKED** | R4 unresolved             | (Deferred)                                       |
| **T8** | R4       | E2E tests                                  | **BLOCKED** | T7 dependency             | (Deferred)                                       |
| **T9** | R4,R6,R7 | CONTRACT-BASELINE.md                       | **BLOCKED** | T7,T8 dependency          | (Deferred)                                       |

---

## Notes

1. **GH-6 Preserved:** Tasks do NOT modify GH-6 public API or reopen GH-6.

2. **Internal Change Only:** T1 modifies internal implementation, not public interface.

3. **Dependency-Safe Ordering:** T1-T4 have no external dependencies. T5-T6 require device access but no backend decision. T7-T9 require backend decision.

4. **TRANSPORT_PROVEN Scope:** iOS spike evidence applies ONLY to iPhone 12 + Expo SDK 58.0.24 + Expo Go. T5 and T6 extend qualification.

5. **Persistence Unproven:** Do NOT claim `credentials: 'omit'` prevents persistence. T5 and T6 determine actual behavior.

6. **No Return Mechanism Invention:** T7 is BLOCKED. Do NOT implement `rusuh://`, Universal Links, App Links, or redirects without authoritative evidence.

7. **GH-7 Remains Blocked:** Even after T1-T6 complete, GH-7 R4 remains blocked until T7-T9 complete.

8. **Fixtures:** Use existing GH-6 fixtures (FAKE_NIK, FAKE_EMAIL, FAKE_ACCESS_TOKEN).

9. **Branch:** Implementation (when authorized) uses `story/GH-43-mobile-magic-link-integration`.

---

## Appendix: Backend Decision Request

**For Backend Team:**

GH-43 is blocked pending a decision on how magic-link email returns the user to the mobile app.

**Current State:**

- Notification service generates: `{APP_BASE_URL}/auth/login?token={token}`
- This URL targets web frontend, not mobile app

**Options Requiring Backend Decision:**

| Option | Description                                                    | Backend Change Required     |
| ------ | -------------------------------------------------------------- | --------------------------- |
| A      | Deep link: `rusuh://auth/verify?token={token}`                 | Notification service        |
| B      | Universal Link (iOS): `https://domain/m/verify?token={token}`  | Notification + web routing  |
| C      | App Link (Android): Same as B                                  | Notification + web routing  |
| D      | Web redirect: Web detects mobile, redirects to app             | Notification + web frontend |
| E      | Platform detection: Notification generates device-specific URL | Notification service        |
| F      | Other mechanism                                                | TBD                         |

**Impact:**

- GH-43 cannot complete (DOR_BLOCKED)
- GH-7 R4 Magic Link Verification cannot proceed
- Mobile magic-link login is impossible

**Requested By:** GH-43 Specification
**Date:** 2026-11-12
