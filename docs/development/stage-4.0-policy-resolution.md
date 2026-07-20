# Autoserve Stage 4.0 Exact Policy Resolution

## Status

- Governance owners: Established; identities not supplied to repository
- Product direction batches: Approved
- Purpose: resolve the remaining exact policies that block Stage 4.0 or explicitly classify them as later provider/legal gates
- Status: Ratified 20 July 2026 as the Stage 4.0 internal policy baseline; Section 9 external gates remain open

## 1. Reliability and Recovery Policy

Recommended initial/pilot policy:

| Policy | Recommended value |
|---|---|
| Availability target | 99.9% monthly application availability, excluding documented approved maintenance |
| Ordering API latency | p95 ≤ 500 ms under approved normal load, excluding third-party payment duration |
| Menu web performance | p75 LCP ≤ 2.5 seconds on approved mobile test profile |
| Database RPO | 15 minutes |
| Severe recovery RTO | 4 hours |
| PostgreSQL PITR window | 35 days where managed service supports it |
| Daily backup retention | 35 days |
| Monthly recovery snapshot | 12 months, subject to privacy/legal review and encrypted restricted access |
| Restore drill | Quarterly before and during pilot; additionally after material backup/topology change |
| Restore owner | Infrastructure/SRE Owner; Security observes restricted-data controls; QA witnesses evidence |
| Export artifact expiry | 24 hours maximum; revoke after first approved completion where practical |
| Incident evidence preservation | Case-specific legal/security hold, separate from ordinary retention |

These are initial service targets, not a public contractual SLA. Infrastructure cost and legal/privacy retention review remain required before production launch.

## 2. Identity, Session, MFA, and Recovery Policy

### Authentication factors

- Passwords use an approved adaptive password hash and compromised/common-password checks.
- Customer MFA is optional initially unless risk signals or later policy require it.
- Restaurant Admin, Support, and Super Admin MFA is mandatory.
- Preferred strong factor: WebAuthn/passkey where supported; TOTP is the operational fallback. SMS is recovery/verification only, not the preferred privileged factor.
- Staff MFA is optional for ordinary fulfillment during pilot; mandatory if Staff receives higher-risk capabilities beyond approved action-bound delegation.

### Session durations

| Role | Idle expiry | Absolute expiry | Reauthentication |
|---|---:|---:|---|
| Guest | 24 hours | 7 days | Not applicable; payment uses provider authorization |
| Customer | 7 days | 30 days | Account/security/export action and risk-triggered checks |
| Staff | 2 hours | 12 hours | Every delegated protected action validates current one-time authorization |
| Restaurant Admin | 30 minutes | 8 hours | Sensitive action within previous 10 minutes |
| Support | 30 minutes | 8 hours | Sensitive case elevation within previous 10 minutes |
| Super Admin | 15 minutes | 4 hours | Critical platform action within previous 5 minutes |

Session rules:

- Rotate after sign-in, MFA, recovery, privilege/membership change, and sensitive elevation.
- Revoke immediately after deactivation, credential compromise, password reset, MFA reset, or privilege removal.
- Customer may maintain up to five visible/revocable active devices initially.
- Workforce roles may maintain up to two approved active sessions; Super Admin one active privileged session unless break-glass policy permits otherwise.
- Changing restaurant context requires active membership and fresh authorization; context is server-side.

### Recovery

- Customer recovery uses verified email or mobile with rate limits, expiry, one-time tokens, and notification.
- Restaurant Admin recovery requires verified business contact plus Security/Support-controlled workflow; ordinary Restaurant Admin cannot reset another Admin's MFA without policy authorization.
- Admin may reset/deactivate Staff access, which revokes all Staff sessions and requires the Staff member to establish new credentials/factor.
- Support cannot retrieve passwords, MFA secrets, sessions, or bypass identity verification.
- Super Admin recovery uses documented break-glass procedure, two-person approval where staffing permits, short expiry, full audit, and post-use review.

### Staff protected-action delegation

- Server-generated authorization bound to restaurant, Staff actor, exact action, target order, nonce, issuing Admin, and expiry.
- Valid for one successful use and no more than 10 minutes.
- Revocable before use and invalid after order state/version changes.
- Stored as a one-way digest where a bearer code is used; never logged or redisplayed.
- Failed/replayed attempts are rate-limited and audited.

## 3. Authorization Policy Resolution

Adopt `authorization-matrix.md` with these exact rules:

- Deny by default in API and database.
- Runtime DB role does not own tables or use `BYPASSRLS`; FORCE RLS where design requires it.
- Staff capability set starts with order fulfillment, issue raising, availability update, current-session history, and cancellation request only.
- Menu update, retained reports, Staff administration, settings, subscription, export/restore/reset, and platform actions are not ordinary Staff capabilities.
- Support access requires an assigned/permitted case purpose; masked by default; sensitive elevation expires after 15 minutes and requires reason.
- Super Admin tenant-data exception requires incident/support purpose, reauthentication, reason, 15-minute elevation, and audit; no routine tenant operation.

## 4. Data Retention and Privacy Policy

These are proposed operational retention periods and must be validated against applicable legal, tax, employment, payment-provider, and contractual requirements before production launch.

| Data | Recommended active/retention rule |
|---|---|
| Guest identity/cart | Expire after 7 days of inactivity; abandoned checkout metadata minimized after 30 days |
| Customer account/profile | While active; delete/anonymize within 30 days of verified closure request except approved retained records |
| Paid orders/receipts | 8 financial years proposed, with customer contact minimized/anonymized earlier when no longer required |
| Failed/cancelled payment attempts | 180 days unless dispute/reconciliation requires longer |
| Pending payment attempts | Reconcile promptly; close operationally after 7 days; retain minimal evidence under failed-attempt rule |
| Refund/settlement/subscription payment | 8 financial years proposed |
| Restaurant licence evidence | Current plus superseded evidence for 1 year; longer only if compliance/legal basis requires it |
| Staff membership/security history | Active membership plus 2 years; security incidents/audit may follow longer approved audit rule |
| Support tickets | 2 years after resolution; security/financial/legal cases follow applicable hold/record rule |
| Audit/privileged security events | 7 years proposed for financial/platform critical actions; ordinary security events 2 years |
| Notification content | 90 days; minimal delivery metadata 1 year |
| Application logs | 30 days searchable plus 90 days restricted archive; security incident hold exception |
| Traces/performance data | 14 days unless aggregated/anonymized |
| Export artifacts | Maximum 24 hours |
| Database backups | Reliability policy above; restored data remains subject to deletion markers and retention jobs |

Additional rules:

- Legal/Finance owner must approve or amend every financial-year value before launch.
- Privacy Owner records purpose/legal basis and customer notice for every class.
- Optional analytics/marketing requires separate consent and withdrawal; required service telemetry/messages are distinguished.
- Verified access/export/correction/deletion requests receive tracked workflow and target response time approved during compliance review.
- Licence, payment, Support, audit, export, and backup data never enters public object storage.

## 5. Food-Payment Policy

Provider selection remains gated, but the provider-neutral business policy is:

- Authorization/capture occurs through the provider's approved immediate payment flow; order is created only after confirmed success.
- Pending payment does not reserve a token/KOT. Customer receives status and safe retry/reconciliation guidance without duplicate collection.
- Paid-without-order is Severity 1 during pilot: reconcile immediately, suppress duplicate charge/order, alert Finance/Operations, and create or refund under the approved runbook.
- Customer-request cancellation is allowed before preparation begins, subject to Restaurant policy and provider capability; later cancellation requires Restaurant Admin/Operations decision and documented reason.
- Item-unavailable/restaurant-fault cancellation permits full refund; partial refund is allowed only when line-level policy/provider/accounting support is approved.
- Refund is recorded Pending until provider confirms outcome; target customer communication occurs immediately and includes provider-dependent expected timing.
- Finance owns daily pilot reconciliation and settlement sign-off; unresolved mismatch blocks broad launch.
- GST/tax, invoice numbering, fiscal receipt content, refund accounting, settlement fees, and disputes remain gated for Finance/legal approval and provider evidence.

## 6. Subscription Policy

- Entitlement begins only after confirmed successful initial payment and ends at `paid_through`, subject to grace.
- Failed renewal enters a seven-calendar-day grace period with prominent Admin notices and Support path.
- During grace, existing restaurant operations and fulfillment continue; plan changes and creation of additional Staff beyond current count are blocked.
- After grace, customer ordering is disabled and Restaurant workspace becomes read-only for history, billing, export, and Support; already-paid active orders remain fulfillable until terminal state.
- Successful reconciliation during grace/restraint restores entitled access idempotently.
- Cancellation stops future renewal while access continues through paid-through date.
- Upgrade: effective immediately only after successful approved charge/proration; otherwise scheduled.
- Downgrade: effective next billing period by default with clear feature/Staff impact preview.
- Referenced plans are retired, not deleted. Existing subscription retains immutable name/rate/features until migrated under approved notice.
- Provider retry schedule is not duplicated blindly by Autoserve; Autoserve reconciles and communicates according to selected-provider behavior.
- Credits, tax/invoice, manual payment/reconciliation, excess Staff handling, and exact proration formula remain Finance/provider gated.

## 7. Communications and Support Policy

### Channel map

| Event | In-app | Email | SMS | WhatsApp |
|---|---|---|---|---|
| Live order/KOT status | Primary | Optional durable receipt/exception | Ready/failure only if approved | Deferred |
| Account verification/recovery | Yes | Primary where email verified | Primary where mobile verified | Deferred |
| Restaurant application decision | Yes | Primary | Optional | Deferred |
| Support created/replied/resolved | Yes | Primary | Urgent/verification only | Deferred |
| Payment receipt/refund | Yes | Primary if approved | Exception/urgent only | Deferred |
| Subscription authorization/renewal/failure/cancel | Yes | Primary | Failure/grace/cancel if approved | Deferred |
| Security/privilege change | Yes | Primary | High-risk alert if verified | Deferred |

- Optional marketing is excluded from first release.
- Templates carry minimum necessary information and never include full payer, licence, credential, or sensitive Support content.
- Failed delivery is visible to Support/Operations and does not roll back committed business transactions.

### Support targets

Initial pilot targets, measured during staffed service hours:

| Priority | First response | Update/target handling |
|---|---:|---|
| Urgent: payment/order/security service blocker | 15 minutes | Continuous ownership/escalation until stabilized |
| High | 1 hour | Update at least every 4 hours |
| Normal | 1 business day | Resolution target 3 business days where controllable |
| Low/FYI | 2 business days | Planned response or documented closure |

Guest recovery requires Support reference plus verified contact challenge or authenticated continuity. Sensitive cases require elevation and must not expose whether unrelated records exist.

## 8. Pilot, Incident, and Change-Control Policy

- Pilot cohort: 1–3 restaurants representing table service, counter pickup, and both modes.
- Pilot duration: minimum 14 consecutive operating days after first successful real transaction, extended for material outages or workflow changes.
- Daily reconciliation: payments, orders, KOTs, refunds, settlements, mandates, subscriptions, and paid-through states.
- Severity 1: cross-tenant exposure, verified payment without recoverable order, incorrect financial state at scale, privileged compromise, or critical service outage. Product/Technical/Security/Operations may stop ordering immediately.
- Severity 2: major degraded ordering/fulfillment/provider behavior with workaround; controlled feature disable or rollback authority belongs to Technical/Operations with Product notification.
- No-go thresholds: unresolved Critical/High security defect; any unexplained cross-tenant access; unreconciled paid-without-order; failed restore drill; unverified provider callback; or missing incident/on-call ownership.
- Every production change has reviewed scope, tests, migration/rollback, monitoring, owner, approval, release record, and post-deploy smoke check.
- Prototype changes remain separate and require explicit approved change request.

## 9. Provider and Legal Gates That Remain Open

The following cannot be resolved by internal baseline approval alone:

- Cashfree merchant/KYC/product enablement, contract, pricing, settlement, sandbox, callback version, and support.
- Exact food-payment capture/refund/dispute/settlement behavior supported by selected provider.
- UPI AutoPay mandate limits, retry, authorization, cancellation, migration, and callback behavior for the approved merchant category.
- Applicable GST/tax/invoice and statutory retention requirements.
- Privacy/legal basis, published notices/terms, vendor data terms, cross-border/location, breach and data-request obligations.
- Email/SMS provider contracts, sender/template registration, consent, and delivery constraints.

These remain explicit Stage 4.6/4.9/4.11 gates even if Stage 4.1 foundation work begins.

## 10. Ratification Statement

```text
The established Product, Technical, Security/Privacy, Infrastructure/SRE, Finance/Billing, Restaurant Operations, Support, QA/Acceptance, and Design/Accessibility owners ratify the Stage 4.0 exact internal policy baseline in development/stage-4.0-policy-resolution.md. External provider onboarding, legal/tax conclusions, provider-specific behavior, and vendor contracts remain gated exactly as listed in Section 9.
```
