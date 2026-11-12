# Requirements Document

## GH-43 Mobile Magic-Link Integration

## Introduction

Reconcile the mobile magic-link verification transport mechanism with the backend contract and define the email-to-native-app return mechanism.

**Problem Statement:** The mobile app cannot complete magic-link login due to two gaps:

1. **Token Transport Delta:** GH-6 implementation sends `GET /auth/verify?token={token}` but backend reads `Cookie: magic_token={token}` exclusively.
2. **Email Return Path:** No authoritative mechanism exists for magic-link email to return the user to the mobile app.

**Relationship to GH-6:** GH-6 Auth Data Layer is **COMPLETE / CLOSED / DONE** at commit `d43688f`. This ticket addresses a newly discovered integration delta and does NOT reopen GH-6. The `verifyMagicLink(token)` public API signature is **PRESERVED**.

**Relationship to GH-7:** GH-7 R4 (Magic Link Verification) is **DOR_BLOCKED** pending this ticket's completion. This ticket does NOT implement GH-7 presentation layer.

---

## Glossary

| Term                    | Definition                                                                              |
| ----------------------- | --------------------------------------------------------------------------------------- |
| Magic Link              | Passwordless login via emailed link containing verification token                       |
| Cookie Header Transport | Sending token via HTTP `Cookie: magic_token={token}` header                             |
| BFF                     | Backend-for-Frontend; server-side route that injects credentials before calling backend |
| Deep Link               | URL scheme (e.g., `rusuh://`) that opens the mobile app to a specific route             |
| Universal Link          | iOS mechanism mapping HTTPS URLs to native app handlers                                 |
| App Link                | Android equivalent of Universal Links                                                   |
| TRANSPORT_PROVEN        | Evidence that a transport mechanism works on a specific device/platform combination     |

---

## Requirements

### Functional Requirements

#### R1: Cookie Header Token Transport

**Description:** The mobile adapter must send the verification token via HTTP `Cookie` header, matching the backend contract.

**Evidence:**

- Backend `auth.go` lines 57-68: `cookie, err := r.Cookie(magicTokenCookie)` — reads token from cookie ONLY
- Backend security rationale (lines 17-18): Query params expose credentials in browser history, referrer headers, access logs
- Web BFF `account-gateway.service.ts` line 125: `headers: { cookie: \`magic_token=\${encodeURIComponent(token)}\` }`

**Acceptance Criteria:**

- R1-AC1: `verifyMagicLink(token)` sends `GET /auth/verify` with `Cookie: magic_token={token}` header
- R1-AC2: Token does NOT appear in URL query string
- R1-AC3: Token does NOT appear in URL path
- R1-AC4: Token does NOT appear in request body
- R1-AC5: Request uses `credentials: 'omit'` to prevent automatic browser cookie handling

#### R2: GH-6 Public API Preservation

**Description:** The `AuthRepositoryPort.verifyMagicLink(token)` public API signature must remain unchanged.

**Evidence:**

- `auth-repository.port.ts` lines 62-74: `verifyMagicLink(token: string): Promise<AuthResult<AuthSession>>`
- GH-6 completion at `d43688f`

**Acceptance Criteria:**

- R2-AC1: Method signature `verifyMagicLink(token: string): Promise<AuthResult<AuthSession>>` unchanged
- R2-AC2: Return type `AuthResult<AuthSession>` unchanged
- R2-AC3: Error mapping for `TOKEN_INVALID`, `TOKEN_EXPIRED` unchanged
- R2-AC4: Success response mapping to `AuthSession` unchanged

#### R3: GH-6 Security Invariants Preservation

**Description:** All GH-6 security constraints must be preserved.

**Evidence:**

- GH-6 spec R8: access token in memory only, refresh token in SecureStore
- GH-6 spec R9: no automatic refresh retry

**Acceptance Criteria:**

- R3-AC1: Access token stored in memory only (not persisted)
- R3-AC2: Refresh token stored in expo-secure-store only
- R3-AC3: No insecure storage fallback
- R3-AC4: No automatic refresh retry on failure

#### R4: Email-to-Native-App Return Mechanism

**Description:** Define how magic-link email returns the user to the mobile app.

**Status: EXTERNALLY UNRESOLVED — Requires Backend Decision**

**Evidence Gap:** No authoritative evidence exists in any repository for:

- `rusuh://` callback URL usage by backend notification service
- Universal Link configuration
- Android App Link configuration
- Web-to-mobile redirect mechanism
- Mobile-specific email template
- Platform detection in email generation

**Backend Current Behavior:**

- Notification service generates: `{APP_BASE_URL}/auth/login?token={token}`
- This URL targets the **web frontend**, not mobile app

**Acceptance Criteria (BLOCKED):**

- R4-AC1: Magic-link email enables user to return to mobile app — **BLOCKED**
- R4-AC2: Token can be extracted from the return mechanism — **BLOCKED**
- R4-AC3: Return mechanism is documented in CONTRACT-BASELINE.md — **BLOCKED**
- R4-AC4: Return mechanism works on iOS — **BLOCKED**
- R4-AC5: Return mechanism works on Android — **BLOCKED**

#### R5: Cookie Persistence Qualification

**Description:** Determine whether explicit Cookie header transport causes unintended cookie persistence.

**Evidence:** Physical device spike (iPhone 12, Expo SDK 58.0.24) proved TRANSPORT but did NOT test persistence behavior.

**Risk:** If native networking persists the `magic_token` cookie despite `credentials: 'omit'`, the spent credential could be sent on future requests, enabling replay attacks.

**Acceptance Criteria:**

- R5-AC1: Define test procedure to verify no unintended cookie persistence
- R5-AC2: Execute persistence test on iOS (iPhone physical device)
- R5-AC3: Execute persistence test on Android (physical device)
- R5-AC4: Document persistence behavior findings
- R5-AC5: If persistence occurs, implement mitigation (e.g., unique path, explicit cookie deletion)

---

### Non-Functional Requirements

#### R6: Clean Architecture Compliance

**Description:** Changes must respect Clean Architecture layer boundaries.

**Acceptance Criteria:**

- R6-AC1: Changes confined to `features/auth/data/` (data layer)
- R6-AC2: No changes to `features/auth/domain/` (domain layer)
- R6-AC3: No changes to `features/auth/presentation/` (presentation layer)
- R6-AC4: `npm run boundary-check` passes

#### R7: CI Gate Compliance

**Description:** All repository CI gates must pass.

**Acceptance Criteria:**

- R7-AC1: `npm run lint` passes
- R7-AC2: `npm run typecheck` passes
- R7-AC3: `npm test` passes
- R7-AC4: `npm run boundary-check` passes
- R7-AC5: `npx expo-doctor` passes (20/20 or established exception)
- R7-AC6: `npx expo export` succeeds

#### R8: Platform Qualification

**Description:** Cookie header transport must be qualified on both iOS and Android.

**Current Evidence:**

- iOS iPhone 12 + Expo SDK 58.0.24 + Expo Go: **TRANSPORT_PROVEN**
- Android: **NOT TESTED**

**Acceptance Criteria:**

- R8-AC1: Cookie header transport verified on iOS physical device
- R8-AC2: Cookie header transport verified on Android physical device
- R8-AC3: Qualification results documented

---

## Constraints

1. **GH-6 Closure Preserved:** GH-6 is COMPLETE / CLOSED / DONE. This ticket does NOT reopen GH-6.

2. **Public API Unchanged:** `AuthRepositoryPort.verifyMagicLink(token)` signature is fixed.

3. **Internal Change Only:** Modification is internal to `auth-remote.datasource.ts`, not exposed to callers.

4. **No Backend Modification:** This ticket does NOT modify backend code or endpoints.

5. **No Web Modification:** This ticket does NOT modify web frontend or BFF.

6. **No Return Mechanism Invention:** Do NOT invent `rusuh://`, Universal Links, App Links, `/m/verify`, or redirect mechanisms without authoritative evidence.

7. **TRANSPORT_PROVEN Scope:** The physical device spike is evidence ONLY for iPhone 12 + Expo SDK 58.0.24 + Expo Go. Do NOT claim broader platform support without additional qualification.

8. **Persistence Not Proven:** Do NOT claim `credentials: 'omit'` prevents cookie persistence without explicit test evidence.

---

## Out of Scope

**Explicitly excluded:**

1. GH-7 presentation layer implementation
2. VerifyScreen component
3. Deep-link route handling in app router
4. Backend endpoint modification
5. Backend notification service modification
6. Web frontend modification
7. Web BFF modification
8. Email template modification
9. Universal Link / App Link configuration
10. Token storage mechanism changes (GH-6 scope)
11. Other auth endpoints (unchanged)
12. Session refresh mechanism (unchanged)
13. Registration flow (unchanged)

---

## Evidence Summary

### Authoritative Evidence

| Source                     | Location                                                                 | Evidence                  |
| -------------------------- | ------------------------------------------------------------------------ | ------------------------- |
| Backend auth.go            | `be-rusuh/services/user/internal/user/infrastructure/http/auth.go:57-68` | Cookie-only token read    |
| Backend security rationale | Same file, lines 17-18                                                   | Query param security risk |
| Web BFF                    | `fe-web/src/core/data/account/account-gateway.service.ts:125`            | Cookie header injection   |
| GH-6 implementation        | `fe-mobile/src/features/auth/data/auth-remote.datasource.ts:79-84`       | Query param (INCORRECT)   |
| Physical device spike      | iPhone 12, Expo SDK 58.0.24, Expo Go                                     | TRANSPORT_PROVEN          |

### Evidence Gaps (UNRESOLVED)

| Gap                        | Status      | Required Decision Owner |
| -------------------------- | ----------- | ----------------------- |
| Email return mechanism     | NO EVIDENCE | Backend team            |
| iOS cookie persistence     | NOT TESTED  | This ticket (R5)        |
| Android cookie transport   | NOT TESTED  | This ticket (R8)        |
| Android cookie persistence | NOT TESTED  | This ticket (R5, R8)    |

---

## Definition of Ready Assessment

### DOR_BLOCKED

**Blocking Items:**

1. **R4 Email Return Mechanism:** No authoritative evidence for how magic-link email returns user to mobile app. Backend team must decide.

**Ready Items (can proceed when R4 unblocks):**

- R1 Cookie Header Transport
- R2 GH-6 Public API Preservation
- R3 GH-6 Security Invariants
- R5 Cookie Persistence Qualification (test definition ready, execution depends on device access)
- R6 Clean Architecture Compliance
- R7 CI Gate Compliance
- R8 Platform Qualification (iOS transport proven, Android pending)

---

## Verification Checklist Reconciliation

### From GH-43 GitHub Issue Body

**Contract/Documentation:**

- [ ] Mobile return mechanism documented in CONTRACT-BASELINE.md — **BLOCKED** (R4 unresolved)
- [ ] Token transport mechanism documented in api-contracts — **READY** (R1 specifies cookie header)
- [ ] Backend endpoint behavior documented (existing or new) — **EXISTING** (no change needed)

**Shift-Left Test Cases:**

- [ ] Unit test: `verifyMagicLink(token)` calls correct endpoint with correct transport — **READY** (T2)
- [ ] Unit test: Success response maps to `VerifyResponse` correctly — **EXISTING GH-6**
- [ ] Unit test: `TOKEN_INVALID` error mapped correctly — **EXISTING GH-6**
- [ ] Unit test: `TOKEN_EXPIRED` error mapped correctly — **EXISTING GH-6**
- [ ] Integration test: Mock backend returns session on valid token — **EXISTING GH-6**

**CI Gates:**

- [ ] `npm run typecheck` passes — **READY** (T4)
- [ ] `npm test` passes (all auth tests) — **READY** (T4)
- [ ] `npm run boundary-check` passes — **READY** (T4)

**Manual Verification:**

- [ ] Request magic-link on mobile device — **BLOCKED** (R4)
- [ ] Open magic-link email on same device — **BLOCKED** (R4)
- [ ] Verify app receives token through defined mechanism — **BLOCKED** (R4)
- [ ] Verify successful login completes — **BLOCKED** (R4)

---

## GitHub Project State

**Project #2:** SJT Rusuh Booking Tiket - Kanban
**GH-43 Status:** Backlog
**GH-43 Labels:** `area:auth`, `blocked-external`, `needs-adr`
