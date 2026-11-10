# Mobile API Contract Baseline

**Version:** 2026-11-11  
**Status:** CANONICAL  
**Scope:** Mobile-critical contract semantics for fe-mobile-rusuh-war-ticketing

---

## 1. Provenance

| Source                      | Description                     | Date           |
| --------------------------- | ------------------------------- | -------------- |
| Default module.openapi.json | Previous Apidog/OpenAPI export  | Pre-2026-11-11 |
| rusuh20261111.openapi.json  | Refreshed Apidog/OpenAPI export | 2026-11-11     |
| 10 Nov SJT sync offline     | Meeting decisions               | 2026-11-10     |
| Supervisor A adjudication   | Human-resolved contradictions   | 2026-11-11     |

This document captures mobile-critical contract semantics, deltas, and human adjudications. It does NOT duplicate the full OpenAPI specification.

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
| `FULL_BOOKED` | Inventory/ticket exhaustion (reversible) | No       |
| `CLOSED`      | Terminal sale closure                    | **Yes**  |

**IMPORTANT:** Do NOT use the previous `SOLD_OUT` model. The newest contract uses `FULL_BOOKED` for reversible inventory exhaustion.

### 2.4 Queue Capacity vs Inventory States

| Condition              | State         | HTTP | error_code    |
| ---------------------- | ------------- | ---- | ------------- |
| Queue capacity reached | `FULL`        | 503  | `QUEUE_FULL`  |
| Ticket stock exhausted | `FULL_BOOKED` | 409  | `FULL_BOOKED` |
| Sale terminated        | `CLOSED`      | 410  | —             |

---

## 3. Grant Authentication

**CONFIRMED BY HUMAN ADJUDICATION — 2026-11-11**

This resolves contradictory stale security-scheme wording in the refreshed OpenAPI.

### 3.1 Authenticated/Account-Owned Grant

For grant-protected requests when the user is logged in:

```
X-Grant-Token: gt_...
Authorization: Bearer <access_token>
```

### 3.2 Guest/Anonymous Grant

For grant-protected requests when the user is a guest:

```
X-Grant-Token: gt_...
X-Device-Id: <128-bit UUID>
```

### 3.3 Header Summary

| Header                  | Purpose               | When Used                     |
| ----------------------- | --------------------- | ----------------------------- |
| `X-Grant-Token`         | Proves slot ownership | All grant-protected endpoints |
| `Authorization: Bearer` | Account identity      | Logged-in users only          |
| `X-Device-Id`           | Guest device binding  | Guests only                   |
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

**STATUS: BLOCKED — Backend clarification required**

The production payment integration architecture is NOT resolved. The following questions are pending:

| Question                                   | Status     |
| ------------------------------------------ | ---------- |
| Native payment API vs WebView hand-off     | Unresolved |
| WebView URL contract                       | Unresolved |
| Encrypted parameter contract               | Unresolved |
| Encryption ownership (mobile vs backend)   | Unresolved |
| Decryption ownership                       | Unresolved |
| Mobile/web/backend responsibility boundary | Unresolved |

### 5.1 Implementation Guidance

- **#13 (Payment fake):** May model the approved payment port boundary but MUST remain architecture-neutral regarding the production mechanism
- **#14 (Payment real):** Remains `blocked-external` until backend confirms all of the above
- **#5 (Core domain):** Payment architecture does NOT block generic/core foundation work

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

| Endpoint             | Added Codes        |
| -------------------- | ------------------ |
| `POST /bookings`     | 200, 401, 429, 503 |
| `GET /bookings/{id}` | 400, 401, 503      |
| `POST /queue/join`   | 401, 404, 410      |
| `GET /queue/stream`  | 404, 503           |
| `GET /tickets`       | 400, 404, 503      |
| `POST /nik/validate` | 401                |
| Payment endpoints    | 401                |

### 6.3 New Endpoint

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

| Date       | Change                               | Author |
| ---------- | ------------------------------------ | ------ |
| 2026-11-11 | Initial baseline from reconciliation | GH-20  |

---

_This document is the mobile-owned canonical interpretation of the API contract. For the full OpenAPI specification, refer to the Apidog exports._
