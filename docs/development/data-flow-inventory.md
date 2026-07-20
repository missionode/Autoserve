# Autoserve Production Data-Flow Inventory

## Status

- Stage: 4.0 Decisions and Governance
- Status: Initial trust-boundary inventory ratified by established Technical, Security/Privacy, and Infrastructure ownership on 20 July 2026; vendor and retention review pending
- Purpose: identify data movement, trust boundaries, authoritative stores, external processors, access, retention decisions, and failure handling before implementation

## 1. Shared Flow Rules

- Browser input is untrusted and validated at the API boundary.
- Tenant and ownership context is derived from authenticated server state and target records.
- PostgreSQL is authoritative for business state.
- Redis, WebSocket messages, browser cache, analytics, and notification providers are not authoritative.
- Secret values remain in managed secret storage or provider systems.
- Provider callbacks are authenticated, retained minimally, and processed idempotently.
- Every external flow has timeout, retry, reconciliation, observability, and data-minimization behavior.
- Retention values remain open until approved in `../production-decisions.md` and `data-governance.md`.

## 2. Identity and Session Flow

```text
User browser
  → Next.js sign-in/recovery page
  → NestJS Identity API
  → PostgreSQL identity/session records
  → Secure HTTP-only session cookie
  → authorization checks on later API/WebSocket requests

Customer Google option:
Browser → Google OAuth → verified callback → Identity API → linked customer identity
```

| Field/group | Source | Destination/store | Access | External processor | Open decisions |
|---|---|---|---|---|---|
| Email/mobile/username/Staff ID | User/Admin | Identity DB | Own user; authorized membership Admin; identity service | Email/SMS verification provider | Verification and uniqueness scope |
| Password | User | One-way adaptive hash only | Identity service | None | Hash algorithm/parameters |
| Session ID/metadata | Identity API | Server session store + cookie reference | Own user/security operations | None | Duration, devices, idle/absolute expiry |
| MFA/recovery | Workforce/user | Restricted identity records/provider | Own user; security recovery path | MFA/email/SMS provider if selected | Factors and recovery authority |
| Google assertion | Google | Identity API then minimal linked identity | Customer own; identity service | Google | Account-linking and consent |

Failure handling: uniform authentication errors, rate limits, session revocation, callback state/nonce validation, recovery audit, and no account enumeration.

## 3. Restaurant Application and Licence Flow

```text
Applicant Admin
  → onboarding API
  → company/application records in PostgreSQL
  → signed private licence upload
  → private object storage + scan/validation
  → Super Admin purpose-limited review
  → immutable approval/rejection event
  → approved but safely closed restaurant activation path
```

| Data | Store | Access | External boundary | Retention decision |
|---|---|---|---|---|
| Company/contact/address/tax identifiers | PostgreSQL | Applicant Admin status; elevated Super Admin review | Optional verification vendor TBD | Application/closure retention TBD |
| Licence documents | Private object storage; metadata DB | Signed applicant upload; elevated reviewer download | Malware/verification service TBD | Superseded/expired/closed retention TBD |
| Decision/reason/actor/time | Approval/audit records | Applicant status; platform audit | None | Audit retention TBD |

Failure handling: quarantined upload, incomplete application status, expiry alerts, reviewer conflict check, and no operational access before approved state.

## 4. QR Entry, Menu, and Cart Flow

```text
Restaurant Admin → table/counter configuration → signed/validated QR link
Customer camera/browser → public Autoserve origin → QR context validation
  → published restaurant/menu API
  → guest or customer server cart
  → checkout draft
```

| Data | Authority | Browser exposure | Access/control |
|---|---|---|---|
| Restaurant/table/counter context | Restaurant DB | Public identifiers/signature only | Validate origin, signature/reference, active restaurant and table/counter |
| Published menu/media/price/options | Catalog DB/object delivery | Public for selected restaurant | Draft/hidden/licence/internal fields excluded |
| Cart lines/customizations | Cart DB | Own cart | Session/identity and restaurant bound; server price preview |
| Customer/order notes | Checkout draft DB | Own draft | Length/content controls; operational minimum later |

Failure handling: invalid QR safe fallback, closed restaurant, stale catalog refresh, cart expiry, guest-to-customer transfer, and no cross-restaurant cart merge.

## 5. Food Payment, Order, and KOT Flow

```text
Browser checkout
  → Checkout API validates tenant/menu/service/totals
  → Payment API creates provider session
  → Cashfree/provider authorization UI
  → signed provider callback / authenticated status lookup
  → callback inbox + idempotency check
  → one PostgreSQL transaction:
       payment success + immutable order/lines + KOT + token + events + outbox
  → worker publishes realtime/notifications
  → Customer and Restaurant clients fetch authoritative order
```

| Data | Sent to provider | Stored by Autoserve | Prohibited handling |
|---|---|---|---|
| Amount/currency/reference and minimum payer details | Provider-required minimum | Attempt, status, masked/provider references, timestamps | No secret/client authority; no full payer instrument logs |
| Callback payload/signature | Received by API | Minimal protected evidence/digest per policy | Never trust without raw-body signature/time/version checks |
| Paid order snapshot | Not necessarily | Immutable names/options/prices/tax/totals/instructions | Never rewrite from current catalog |
| Token/KOT | No | Unique restaurant operating-period records | Never allocate before verified success |

Failure handling: pending state, duplicate/out-of-order callback acknowledgement, paid-without-order reconciliation, provider timeout, refund workflow, and finance alert.

## 6. Fulfillment and Realtime Flow

```text
Staff browser → authorized transition API → PostgreSQL status/event transaction
  → outbox → worker/realtime gateway → restaurant/customer rooms
Customer/Staff reconnect → authenticated REST reload → current authoritative state
```

Data includes minimum order/KOT items, instructions, token/table/service mode, status, actor, and timestamps. Room membership is server-derived. Support receives this only through an approved case view.

Failure handling: optimistic conflict, invalid transition, reconnect/resync, missed event, queue retry, delayed-order scheduled evaluation, and notification delivery history.

## 7. Cancellation and Refund Flow

```text
Staff/Admin request + reason
  → authorization/reauth or action-bound delegation verification
  → current order/payment/status recheck
  → cancellation transaction and restoration policy
  → provider refund request
  → refund callback/reconciliation
  → immutable order/payment/refund/audit events
  → customer/restaurant notification
```

Restricted data includes delegation proof, provider references, reasons, and audit actors. Delegation secrets/nonces are never displayed again or logged. Refund state does not claim success before provider confirmation.

## 8. Games and Rewards Flow

```text
Customer eligible paid order → one persisted attempt → validated move/result
  → transactional reward availability check and unique issue
  → order/timeline update → fulfillment/customer resync

Guest/practice games → non-reward state; no reward endpoint authority
```

Failure handling: replayed completion, concurrent issue, unavailable primary/fallback, order no longer eligible, disconnect/resume, and immutable reward evidence.

## 9. Support Flow

```text
Requester → Support API → ticket/message/event records
  → notification job → Support queue
  → purpose/assignment-limited Support agent view
  → reply/status event → requester notification and own-case view
```

| Data | Default visibility | Elevation |
|---|---|---|
| Request body and requester-provided contact | Requester + assigned/permitted Support | No unrelated browsing |
| Restaurant/order references | Minimum linked evidence | Additional operational data only with recorded case purpose |
| Payment references | Masked | Finance/payment escalation, not ordinary Support mutation |
| Licence/security data | Hidden | Dedicated platform/security escalation |

Guest recovery requires an approved reference-plus-contact or authenticated continuity policy; public reference alone is insufficient.

## 10. Subscription UPI AutoPay Flow

```text
Restaurant Admin selects published plan
  → Billing API creates provider mandate authorization
  → provider UPI authorization
  → signed mandate callback → mandate state
  → signed initial/renewal payment callback
  → transaction records immutable plan snapshot + paid-through entitlement
  → notices/reconciliation/Support and Super Admin histories
```

Provider receives only required merchant, plan, amount, and payer/customer fields. Autoserve retains provider references and masked display values, not full UPI instruments. Entitlement changes only through approved authenticated event/reconciliation policy.

Failure handling: pending/failed/on-hold/paused/cancelled/expired events, missing or delayed callback, retry, out-of-order state, renewal failure, plan retirement, cancellation, and access/grace policy.

## 11. Notification Flow

```text
Committed domain event → outbox → notification intent
  → worker applies consent/channel/template policy
  → email/SMS/in-app provider
  → delivery result/webhook → notification delivery record
```

Only minimum content is sent. Required service messages are distinguished from optional messages. Provider secrets stay in secret management; destinations and content are redacted from operational logs. Retry and fallback cannot duplicate sensitive or transactional messages incorrectly.

## 12. Observability and Audit Flow

```text
Web/API/worker/infrastructure
  → structured redacted logs + metrics + traces → restricted monitoring vendor/store

Privileged/financial/domain mutations
  → separate audit event records → restricted review/export/incident preservation
```

Correlation IDs link telemetry to business/audit records without copying payloads. Audit is not reconstructed from ordinary logs. Vendor sampling and error payload capture require privacy review.

## 13. Export, Backup, Restore, and Deletion Flow

```text
Reauthenticated tenant Admin → scoped export job → canonical schema
  → encrypted/private object → short signed download → expiry/deletion

Infrastructure scheduler → encrypted database/object backups
  → protected backup catalog → automated verification/restore drill

Approved recovery operator → restore plan → isolated validation
  → controlled restore/forward-fix → reconciliation and audit
```

Tenant export and infrastructure backup are separate. RLS must not silently omit required backup data. Deletion propagates through live stores and approved backup lifecycle, with restored data re-subjected to deletion markers/policy.

## 14. External Vendor Register

| Function | Proposed vendor | Data categories | Contract/security review | Exit/deletion plan |
|---|---|---|---|---|
| Cloud hosting/storage | AWS Mumbai | All hosted production classes | Open | Open |
| Customer food payments | Cashfree preferred | Payment minimum, references, payer details required by provider | Open | Open |
| UPI AutoPay | Cashfree preferred | Restaurant payer/mandate/payment minimum | Open | Open |
| Customer Google identity | Google OAuth | Customer identity assertion | Open | Open |
| Email | SES or Postmark | Destination and approved message content | Open | Open |
| SMS | Indian provider TBD | Mobile and approved template variables | Open | Open |
| Error monitoring | Sentry-style provider TBD | Redacted error/performance context | Open | Open |
| Malware/document verification | TBD | Uploaded licence file or derived verification evidence | Open | Open |

No vendor is approved by this proposed inventory.

## 15. Review and Approval

Required reviewers: Product Owner, Technical Lead, Security/Privacy Owner, Finance Owner, Infrastructure Owner, Support Owner.  
Completed initial review: Product, Technical, Security/Privacy, and Infrastructure roles; identities not supplied to repository  
Outstanding review: Finance and Support owners plus selected-vendor/retention details  
Status: Initial architecture/security flow approved; domain/vendor review open  
Approval date: 20 July 2026
