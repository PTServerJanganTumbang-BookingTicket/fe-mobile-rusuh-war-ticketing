# Mobile API Contract Baseline

**Version:** 2026-11-11  
**Status:** CANONICAL  
**Scope:** Mobile-critical contract semantics for fe-mobile-rusuh-war-ticketing

---

## 1. Provenance

| Source                      | Description                          | Date           |
| --------------------------- | ------------------------------------ | -------------- |
| Default module.openapi.json | Previous Apidog/OpenAPI export       | Pre-2026-11-11 |
| rusuh20261111.openapi.json  | Refreshed Apidog/OpenAPI export      | 2026-11-11     |
| sjtrbt20261111.openapi.json | Latest Apidog/OpenAPI delta evidence | 2026-11-11     |
| 10 Nov SJT sync offline     | Meeting decisions                    | 2026-11-10     |
| Supervisor A adjudication   | Human-resolved contradictions        | 2026-11-11     |

This document captures mobile-critical contract semantics, deltas, and human adjudications. It does NOT duplicate the full OpenAPI specification.

**Evidence Note:** The `sjtrbt20261111.openapi.json` export was used for the 2026-11-11 delta reconciliation. It supplements but does not replace this canonical mobile baseline.

---

## 2. Queue Admission Model

### 2.1 Asynchronous Admission

Queue join (`POST /events/{event_id}/queue/join`) returns queue position only. Admission is **asynchronous**.

**`/queue/me` is the authoritative source** for the client's engagement/grant state and grant credentials.

SSE/queue progression may trigger reconciliation, but the client MUST call `/queue/me` to obtain:

- Current engagement state
- Grant token (when GRANTED)
- Booking/payment expiry timestamps

### 2.2 Engagement States

From `/queue/me` response (`data.state`):

| State              | Description                          |
| ------------------ | ------------------------------------ |
| `QUEUED`           | Waiting in queue                     |
| `GRANTED`          | Slot granted, can proceed to booking |
| `SELECTING`        | Selecting tickets                    |
| `AWAITING_PAYMENT` | Payment pending                      |
| `CONFIRMED`        | Booking confirmed                    |
| `EXPIRED`          | Grant expired                        |

### 2.3 Queue/Poll States

From `/queue/serving` response (`data.state`):

| State         | Description                              | Terminal |
| ------------- | ---------------------------------------- | -------- |
| `SCHEDULED`   | Queue not yet open                       | No       |
| `OPEN`        | Queue accepting participants             | No       |
| `FULL_QUEUE`  | Queue capacity reached (temporary)       | No       |
| `FULL_BOOKED` | Inventory/ticket exhaustion (reversible) | No       |
| `CLOSED`      | Terminal sale closure                    | **Yes**  |

**IMPORTANT:** Do NOT conflate these three distinct concepts:

- `FULL_QUEUE` — Queue capacity reached; retryable/temporary condition
- `FULL_BOOKED` — Event inventory exhaustion; may recover if holds expire
- `SOLD_OUT` — Ticket-category status (ticket-type level, e.g., VIP sold out)

`SOLD_OUT` is a ticket-category attribute and MUST NOT be collapsed into `queue_state`.

### 2.4 Queue Capacity vs Inventory States

| Condition              | State         | HTTP | error_code    |
| ---------------------- | ------------- | ---- | ------------- |
| Queue capacity reached | `FULL_QUEUE`  | 503  | `QUEUE_FULL`  |
| Ticket stock exhausted | `FULL_BOOKED` | 409  | `FULL_BOOKED` |
| Sale terminated        | `CLOSED`      | 410  | —             |

### 2.5 Queue Join Contract

`POST /events/{event_id}/queue/join`

**Required Request Fields:**

| Field           | Required | Notes                                 |
| --------------- | -------- | ------------------------------------- |
| `captcha_token` | Yes      | CAPTCHA verification token (see §2.6) |

**Response Fields (Success):**

| Field         | Type    | Description                                             |
| ------------- | ------- | ------------------------------------------------------- |
| `queue_token` | string  | Retained by mobile; send as `X-Queue-Token`             |
| `sse_url`     | string  | Absolute SSE URL; may differ from API host              |
| `rejoined`    | boolean | Present when recovering existing engagement             |
| `state`       | string  | Engagement state; present on rejoin (may not be QUEUED) |

**Semantics:**

- `queue_token`: Mobile stores in secure storage, sends via `X-Queue-Token` header
- `sse_url`: Absolute URL (host `events.*` may differ from `api.*`)
- `rejoined`: Indicates recovery of existing engagement; consumers MUST NOT assume `rejoined=true` implies `state=QUEUED`
- `state`: For rejoin routing; check state before assuming position-based flow

### 2.6 CAPTCHA Contract

Event detail response exposes CAPTCHA configuration:

```json
{
  "captcha": {
    "provider": "turnstile",
    "site_key": "0x4AAAAAAA..."
  }
}
```

**Contract Scope:**

- Queue join REQUIRES `captcha_token` in request body
- Event detail provides `captcha.provider` and `captcha.site_key`

**Implementation Note:** This documents the API contract input/output. CAPTCHA UI acquisition, provider integration (Turnstile/reCAPTCHA), and token generation are feature work BEYOND the #5 core domain scope.

### 2.7 Guest Device Requirement

For guest/anonymous queue join:

- `X-Device-Id` header is REQUIRED
- Missing `X-Device-Id` returns `400 DEVICE_ID_REQUIRED`

This is a guest device-binding contract concern, not a general validation error.

### 2.8 Poll Tiers (Server-Provided Polling Guidance)

`/queue/serving` may return `poll_tiers`:

```json
{
  "poll_tiers": [
    { "max_position": 10, "poll_after_ms": 1000 },
    { "max_position": 100, "poll_after_ms": 3000 },
    { "max_position": null, "poll_after_ms": 10000 }
  ]
}
```

**Semantics:**

- `max_position`: Upper bound for this tier; `null` = unbounded
- `poll_after_ms`: Suggested polling interval in milliseconds

This is server-provided optimization guidance. Polling implementation is feature work, not core domain.

---

## 3. Grant Authentication

**CONFIRMED BY HUMAN ADJUDICATION — 2026-11-11**

This resolves contradictory stale security-scheme wording in the refreshed OpenAPI.

### 3.1 Authentication Contradiction (Documented)

The latest OpenAPI (`sjtrbt20261111.openapi.json`) contains conflicting authentication prose:

- **BearerAuth1 security-scheme description** claims Authorization is NOT sent to booking/payment
- **Endpoint/header parameter descriptions** state Authorization is REQUIRED when the grant belongs to a logged-in account

**CANONICAL MOBILE DECISION:** The human adjudication stands unchanged. The endpoint-level descriptions are authoritative; the security-scheme prose is stale/conflicting.

### 3.2 Authenticated/Account-Owned Grant

For grant-protected requests when the user is logged in:

```
X-Grant-Token: gt_...
Authorization: Bearer <access_token>
```

### 3.3 Guest/Anonymous Grant

For grant-protected requests when the user is a guest:

```
X-Grant-Token: gt_...
X-Device-Id: <128-bit UUID>
```

### 3.4 Guest Device-Id Requirement

`X-Device-Id` is REQUIRED for guest queue join. Missing header returns:

- HTTP 400
- `error_code: DEVICE_ID_REQUIRED`

This is a guest device-binding contract requirement, not a general validation error.

### 3.5 Header Summary

| Header                  | Purpose               | When Used                     |
| ----------------------- | --------------------- | ----------------------------- |
| `X-Grant-Token`         | Proves slot ownership | All grant-protected endpoints |
| `Authorization: Bearer` | Account identity      | Logged-in users only          |
| `X-Device-Id`           | Guest device binding  | Guests only (REQUIRED)        |
| `X-Queue-Token`         | Queue position token  | SSE stream, `/me`             |

---

## 4. Booking Contract Changes

### 4.1 NIK Schema (Breaking Change)

The booking tickets schema uses an **exactly-one-of** pattern:

```
tickets[].nik         — Raw NIK (normalized by server)
tickets[].saved_nik_id — Reference to saved NIK
tickets[].use_account_nik — Use account's registered NIK
```

**Exactly ONE of these fields must be present per ticket.**

### 4.2 Removed Fields

| Field                    | Removed In     | Reason                                |
| ------------------------ | -------------- | ------------------------------------- |
| `tickets[].holder_email` | v2.14          | All e-tickets sent to `contact_email` |
| `/nik/validate` → `name` | v2.21 (FR-15a) | NIK holder name never returned        |

### 4.3 NIK Normalization

Server normalizes NIK input:

- Strips all non-digit characters (spaces, dots, dashes)
- Requires exactly 16 digits after normalization

---

## 5. Unresolved: Payment Architecture

**STATUS: EXPLICITLY UNRESOLVED — Not decidable from API contract alone**

The latest OpenAPI (`sjtrbt20261111.openapi.json`) provides verified payment API evidence, but that MUST NOT be converted into a mobile architecture decision.

**PRINCIPLE:** API contract known ≠ mobile payment architecture decided.

### 5.1 Undecided Questions

| Question                                   | Status     |
| ------------------------------------------ | ---------- |
| Native payment API vs WebView hand-off     | Unresolved |
| WebView URL contract                       | Unresolved |
| Encrypted parameter contract               | Unresolved |
| Encryption ownership (mobile vs backend)   | Unresolved |
| Decryption ownership                       | Unresolved |
| Mobile/web/backend responsibility boundary | Unresolved |
| Callback architecture                      | Unresolved |
| App/deep-link return handling              | Unresolved |
| Redirect ownership                         | Unresolved |
| Payment hand-off ownership                 | Unresolved |
| VA confirmation UX                         | Unresolved |
| GoPay return behavior                      | Unresolved |
| Midtrans mobile integration boundaries     | Unresolved |

### 5.2 Implementation Guidance

- **#5 (Core domain):** Payment architecture does NOT block generic/core foundation work
- **#13 (Payment fake):** May model the approved payment port boundary but MUST remain architecture-neutral regarding the production mechanism
- **#14 (Payment real):** Remains `blocked-external` until backend confirms all of the above

Tickets #5, #13, and #14 MUST NOT guess these decisions.

---

## 6. Contract Delta Summary

### 6.1 Breaking Mobile Changes

| Change                           | Classification         | Impact                                       |
| -------------------------------- | ---------------------- | -------------------------------------------- |
| Queue admission now asynchronous | BREAKING MOBILE CHANGE | Grant obtained from `/me`, not join response |
| `SOLD_OUT` → `FULL_BOOKED`       | BREAKING MOBILE CHANGE | Domain model state enum change               |
| NIK exactly-one-of pattern       | BREAKING MOBILE CHANGE | NIK input UI must support 3 modes            |
| `holder_email` removed           | BREAKING MOBILE CHANGE | Remove from booking form                     |
| NIK `name` field removed         | BREAKING MOBILE CHANGE | Cannot display NIK holder name               |

### 6.2 New Response Codes (Non-Breaking)

| Endpoint             | Added Codes             |
| -------------------- | ----------------------- |
| `POST /queue/join`   | 400, 401, 404, 410, 503 |
| `POST /bookings`     | 200, 401, 429, 503      |
| `GET /bookings/{id}` | 400, 401, 503           |
| `GET /queue/stream`  | 404, 503                |
| `GET /tickets`       | 400, 404, 503           |
| `POST /nik/validate` | 401                     |
| Payment endpoints    | 401                     |

### 6.3 Queue-Specific Error Codes

| HTTP | error_code           | Condition                   |
| ---- | -------------------- | --------------------------- |
| 400  | `DEVICE_ID_REQUIRED` | Guest missing `X-Device-Id` |
| 400  | `CAPTCHA_REQUIRED`   | Missing `captcha_token`     |
| 503  | `QUEUE_FULL`         | Queue capacity reached      |

On `QUEUE_FULL` (503), response includes:

```json
{
  "data": {
    "queue_state": "FULL_QUEUE"
  }
}
```

### 6.4 New Endpoint

| Endpoint           | Purpose                                         |
| ------------------ | ----------------------------------------------- |
| `GET /accounts/me` | Returns email + `nik_masked` for logged-in user |

---

## 7. Ticket Reference

This baseline affects the following tickets:

| Ticket | Impact                            | Update Required |
| ------ | --------------------------------- | --------------- |
| #5     | Queue states, engagement states   | Yes             |
| #8     | SSE states, grant detection model | Yes             |
| #9     | Same as #8                        | Yes             |
| #10    | Same as #8                        | Yes             |
| #11    | Same as #9                        | Yes             |
| #12    | NIK schema, authentication        | Yes             |
| #13    | Payment port boundary             | Inspect         |
| #14    | Payment blocked-external reason   | Yes             |
| #16    | Queue states                      | Inspect         |
| #17    | Same as #16                       | Inspect         |

---

## 8. Document History

| Date       | Change                                          | Author |
| ---------- | ----------------------------------------------- | ------ |
| 2026-11-11 | Initial baseline from reconciliation            | GH-20  |
| 2026-11-11 | Reconcile sjtrbt20261111 API deltas (GH-5 prep) | GH-5   |

---

_This document is the mobile-owned canonical interpretation of the API contract. For the full OpenAPI specification, refer to the Apidog exports._
