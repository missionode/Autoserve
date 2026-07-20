# Autoserve Payment and UPI AutoPay Provider Due Diligence

## Status

- Stage: 4.0 Decisions and Governance
- Candidate evaluated first: Cashfree
- Selection status: Not selected; Product direction only
- Required owners: Finance/Billing, Technical, Security/Privacy, Operations/Support, and legal/procurement where applicable

No provider code, production credential, or merchant commitment should begin from this checklist alone.

## 1. Required Evidence Package

Store approved evidence outside the public repository where it contains commercial, credential, personal, or security-sensitive information. Link only safe identifiers/status here.

- Merchant/KYC onboarding confirmation.
- Food-payment and subscription/UPI AutoPay product enablement confirmation.
- Sandbox account and test capability confirmation.
- Commercial proposal, fees, taxes, reserves, settlement schedule, refund fees, and termination terms.
- Contract, data processing/privacy terms, subprocessor/location details, breach obligations, and deletion/return terms.
- Current API/webhook version and deprecation/support policy.
- Webhook signature, timestamp/replay, IP guidance, retry, ordering, and event-ID documentation.
- Refund, cancellation, dispute/chargeback, settlement, reconciliation, and report capabilities.
- UPI AutoPay mandate states, amount/frequency rules, authorization modes, retries, pause/cancel/expire behavior, and customer cancellation propagation.
- Production support model, escalation contacts, SLA, status page, incident history/evidence where available.
- Export/portability and provider-exit process for payments, subscriptions, mandates, reports, and disputes.
- Security/compliance evidence appropriate to the service and Autoserve's review policy.

## 2. Food-Payment Capability Checklist

- [ ] Supports approved web/PWA checkout and required UPI/payment methods.
- [ ] Backend creates payment order/session without exposing secret credentials.
- [ ] Stable merchant order/payment/attempt identifiers are available.
- [ ] Signed server-to-server success, pending, failure, cancellation, and refund events are available.
- [ ] Payment status lookup supports reconciliation when callbacks are missing or ambiguous.
- [ ] Duplicate, delayed, and out-of-order event behavior is documented/testable.
- [ ] Refund initiation and asynchronous outcome are supported with stable references.
- [ ] Settlement/reconciliation reports expose required transaction, fee, tax, refund, and mismatch fields.
- [ ] Sandbox can reproduce success, pending, failure, timeout, duplicate callback, refund, and reconciliation scenarios.
- [ ] Provider supports required receipt/transaction evidence without making Autoserve rely on mutable browser state.

## 3. UPI AutoPay Capability Checklist

- [ ] Merchant category and plan amounts are eligible for UPI AutoPay.
- [ ] Monthly frequency and required mandate duration/amount model are supported.
- [ ] Mandate authorization supports the approved web flow and UPI applications.
- [ ] Provider supplies stable subscription, mandate, authorization, payment, and refund references.
- [ ] Mandate and payment state documentation covers initialized/pending, active, on hold, paused, failed, customer-cancelled, expired, completed, and merchant-cancelled equivalents.
- [ ] Signed callbacks cover authorization, mandate state, payment success/failure/cancellation, and refund outcome.
- [ ] Retry ownership, notification timing, debit scheduling, first-charge timing, and reconciliation are documented.
- [ ] Merchant and customer cancellation behavior, propagation delay, finality, and resume/new-mandate requirements are documented.
- [ ] Plan amount/frequency change behavior and mandate replacement/update requirements are documented.
- [ ] Sandbox supports full mandate lifecycle and recurring payment/retry/cancellation scenarios.
- [ ] Payer display/storage can be limited to provider reference and masked values.
- [ ] Provider export/report supports finance reconciliation and migration/exit planning.

## 4. Technical Review

| Topic | Required decision/evidence | Status |
|---|---|---|
| API version | Exact food-payment and subscription API versions pinned | Open |
| SDK strategy | Direct HTTPS vs maintained server SDK; ownership and upgrade policy | Open |
| Idempotency | Request/event keys, uniqueness and provider guarantees | Open |
| Signature | Raw-body algorithm, timestamp tolerance, key rotation and failure response | Open |
| Callback endpoints | Development/staging/production HTTPS URLs and isolation | Open |
| Event ordering | Provider guarantees and Autoserve state-precondition behavior | Open |
| Retry | Provider callback retry schedule and Autoserve acknowledgement behavior | Open |
| Reconciliation | Status/report APIs, schedule, rate limits, mismatch workflow | Open |
| Availability | Published targets, maintenance and outage communication | Open |
| Rate limits | Create/status/refund/subscription/report limits and backoff | Open |
| Data | Required payer/customer fields, masking, retention and deletion | Open |
| Testability | Sandbox cases, deterministic fixtures and webhook replay tools | Open |
| Exit | Export, mandate migration/interoperability, termination and retained access | Open |

## 5. Finance and Operations Review

- [ ] Food-payment and subscription pricing is modeled at expected pilot and launch volumes.
- [ ] Settlement account, timing, holidays, failed settlement, reserves/holds, and reconciliation owner are approved.
- [ ] GST/tax treatment of provider fees and Autoserve transactions is reviewed.
- [ ] Customer payment receipt/invoice and Restaurant subscription invoice/receipt responsibility is defined.
- [ ] Refund eligibility, partial/full refund, timing, fees, failure, customer notice, and manual escalation are defined.
- [ ] Dispute/chargeback evidence, response owner, time limits, and accounting treatment are defined.
- [ ] Subscription failed-debit retry, grace, access, collections contact, cancellation, credit/proration, and bad-debt treatment are approved.
- [ ] Daily pilot and regular production reconciliation reports have named owners and sign-off criteria.
- [ ] Provider incident, settlement mismatch, and payment-without-order escalation contacts/runbooks are ready.

## 6. Security and Privacy Review

- [ ] Provider credentials are stored in managed secrets with environment separation, least privilege, rotation, and emergency revoke.
- [ ] Webhook verification and replay protection are threat-modeled and tested.
- [ ] Provider dashboard roles, MFA, audit, access review, and offboarding are approved.
- [ ] Minimum required customer/Restaurant Admin data fields and purposes are documented.
- [ ] Full payment instruments and raw UPI identifiers are not stored/logged by Autoserve beyond approved provider requirements.
- [ ] Contracted retention, deletion, subprocessor, location/transfer, incident, and data-request obligations are approved.
- [ ] Logs, monitoring, Support tools, exports, and webhook evidence use masking and purpose-limited access.
- [ ] Test/sandbox data is fictional and production credentials/data never enter development or CI.

## 7. Candidate Comparison Scorecard

Score each dimension from 1–5 and attach evidence. Weighting must be approved before scoring to avoid choosing criteria after seeing results.

| Dimension | Proposed weight | Cashfree | Alternative | Evidence owner |
|---|---:|---:|---:|---|
| Food-payment product fit | 12 | TBD | TBD | Technical/Operations |
| UPI AutoPay lifecycle fit | 15 | TBD | TBD | Finance/Technical |
| Webhook/security/idempotency | 12 | TBD | TBD | Security/Technical |
| Reconciliation/refund/dispute | 12 | TBD | TBD | Finance |
| Sandbox/testability | 8 | TBD | TBD | QA/Technical |
| Commercial/settlement terms | 12 | TBD | TBD | Finance |
| Reliability/support/escalation | 8 | TBD | TBD | Operations |
| Privacy/data/vendor risk | 8 | TBD | TBD | Privacy/Security |
| API quality/version stability | 6 | TBD | TBD | Technical |
| Reporting/export/exit | 4 | TBD | TBD | Finance/Technical |
| Implementation/operating cost | 3 | TBD | TBD | Technical/Finance |

No candidate passes solely on total score. Failure of a mandatory security, legal, merchant eligibility, reconciliation, or UPI AutoPay requirement is disqualifying unless the accountable owners explicitly approve an alternative design.

## 8. Sandbox Acceptance Scenarios

Food payment:

1. Success produces one provider event and one Autoserve order transaction.
2. Pending resolves to success and failure.
3. Duplicate success callback is acknowledged without duplicate order/token/KOT.
4. Delayed success after client timeout reconciles correctly.
5. Forged/invalid signature is rejected and alerted.
6. Out-of-order failure after success cannot reverse paid order incorrectly.
7. Refund request and duplicate/delayed refund callbacks remain idempotent.
8. Provider success with injected local transaction failure enters reconciliation and recovers once.

Subscription:

1. Mandate pending, active, failure, pause/on-hold, customer cancel, merchant cancel, and expiry.
2. Initial success creates one paid-through period and immutable plan snapshot.
3. Renewal success extends once under duplicate callbacks.
4. Failed renewal follows approved retry/grace/access policy.
5. Out-of-order mandate/payment events respect valid transitions.
6. Period-end cancellation retains access and prevents future renewal.
7. Upgrade/downgrade/proration follows approved policy.
8. Missing callbacks are found through reconciliation without inventing success.

## 9. Selection Gate

Cashfree or another provider becomes `Selected` only when:

- Merchant onboarding and required products are confirmed.
- Finance, Technical, Security/Privacy, Operations/Support, and legal/procurement reviews are signed.
- Mandatory capability checklists pass.
- Scorecard and alternative comparison are complete.
- Sandbox acceptance plan is feasible.
- Commercial, settlement, support, data, incident, and exit terms are approved.
- Exact API/webhook versions and callback security requirements are recorded in `../subscription-billing.md` and an accepted ADR.

Selection approvers and date: Open.

## 10. Primary Candidate References

- [Cashfree Subscription API overview](https://www.cashfree.com/docs/api-reference/payments/latest/subscription/overview)
- [Cashfree subscription webhooks](https://www.cashfree.com/docs/payments/subscription/webhooks)
- [Cashfree create subscription and lifecycle](https://www.cashfree.com/docs/payments/subscription/create)
- [Cashfree subscription FAQ](https://www.cashfree.com/docs/payments/subscription/faq)

References support evaluation; they do not replace merchant-specific written confirmation or contract review.

