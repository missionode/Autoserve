# Restaurant Subscription Billing

## Billing Model

Autoserve restaurant plans are billed monthly. Production recurring billing must use UPI AutoPay through an approved payment provider. A Restaurant Admin authorizes a recurring mandate once; Autoserve must not require a manual one-time UPI payment every month.

The current browser prototype does not contact a provider, create a mandate, or charge an account. Its Success, Pending, and Failure options exist only to demonstrate interface and state behavior.

## Role Ownership

### Super Admin

- Configure the platform billing identity used by the future provider integration.
- Create, edit, publish, hide, recommend, order, or remove monthly plans.
- Set plan names, INR monthly rates, and feature lists.
- Review subscription payments across restaurants.
- Change future rates without rewriting previous payment snapshots.

### Restaurant Admin

- View the current plan, subscription status, and billing period.
- Compare active plans published by Super Admin.
- Select a plan and authorize UPI AutoPay.
- View mandate status, next debit date, and payment history.
- Cancel future automatic renewal when production mandate support is connected.

### Staff

Staff cannot select plans, change billing, authorize mandates, or view protected subscription payment details.

## Intended UPI AutoPay Lifecycle

```text
Restaurant Admin selects monthly plan
→ Backend creates provider mandate request
→ Admin authorizes the UPI AutoPay mandate in the selected UPI application
→ Provider sends an authenticated mandate callback
→ Backend verifies and idempotently records the mandate
→ Successful initial collection activates the subscription
→ Provider automatically processes subsequent monthly debits
→ Authenticated payment callbacks extend the paid-through date
→ Failure, pause, revocation, expiry, or cancellation updates billing status without inventing payment success
```

## Required Production Records

Mandate records should include:

- Stable Autoserve mandate identifier
- Restaurant and plan identifiers
- Payment-provider identifier
- Provider mandate reference
- Status such as Pending, Active, Paused, Revoked, Expired, Failed, or Cancelled
- Authorized recurring amount and currency
- Frequency and next debit date
- Masked payer reference where the provider permits storage
- Created, authorized, updated, and cancelled timestamps

Payment records should include:

- Stable payment identifier and idempotency key
- Restaurant, mandate, and plan identifiers
- Immutable plan name, rate, and feature snapshot
- Billing-period start and end
- Amount, currency, status, and provider transaction reference
- Attempted, paid, failed, and callback timestamps where applicable

Sensitive provider credentials, complete payer details, callback secrets, and authorization tokens must never be stored in browser Local Storage.

## Prototype Coverage

The current prototype demonstrates:

- Super Admin plan/rate management
- Live publication of active plans to Restaurant Settings
- Restaurant plan selection
- Simulated UPI Success, Pending, and Failure
- One-month activation or extension after simulated success
- Restaurant and platform payment history
- Immutable price-and-feature snapshots
- Admin-only billing access

The prototype does not implement real UPI AutoPay mandate authorization, recurring collection, server-side callbacks, reconciliation, cancellation, refunds, taxes, invoices, or production access enforcement.

## Post-Prototype Development Handoff

Real UPI AutoPay is deliberately deferred until the browser prototype is reviewed and frozen. It is not a prototype acceptance blocker and must not be represented as already connected.

The prototype is now frozen. Production billing work remains gated by Stage 4.0 decisions and is scheduled in Stage 4.9 of `worksheet.md`; the broader delivery sequence is defined in `development-plan.md`.

Before production implementation begins, the product, engineering, finance, and compliance owners must answer and record the following:

### Provider and merchant setup

- Which approved provider will Autoserve use: Cashfree, Razorpay, or another provider?
- Has the Autoserve merchant account completed provider onboarding, KYC, and UPI AutoPay enablement?
- Which provider API and webhook version will be pinned for the initial release?
- Who owns sandbox and production credentials, rotation, revocation, and incident access?
- What mandate amount limits, UPI application coverage, settlement rules, fees, and retry behavior apply to the selected merchant category?

### Backend and deployment

- Which production backend stack and database will own mandates, payments, subscriptions, and webhook events?
- What are the sandbox, staging, and production deployment targets?
- What public HTTPS callback URLs will be registered with the provider for each environment?
- Which secret manager will hold API keys and webhook secrets? Provider secrets must never enter frontend code, Local Storage, source control, logs, or exports.
- Which service owns scheduled reconciliation when callbacks are delayed or missing?

### Identity and data model

- How will prototype restaurant, plan, and subscription identifiers map to durable production database records?
- Which customer and Restaurant Admin details may be sent to the provider, and what masking and retention rules apply?
- Will a plan change replace the mandate, modify it, or take effect at the next billing period?
- What is the source of truth for entitlement: mandate status, successful payment, paid-through date, or a defined combination?

### Callback security and idempotency

- What exact signature-verification algorithm and raw-body handling does the selected provider require?
- Which provider event identifier or derived digest is the unique idempotency key?
- How long are webhook event keys and raw payloads retained, and who can inspect them?
- How are duplicate, delayed, out-of-order, replayed, malformed, or unsupported-version events handled?
- Which transitions are valid for Pending, Active, On Hold, Paused, Failed, Revoked, Expired, and Cancelled mandates?
- How will callback processing and entitlement updates commit atomically?

### Billing policy and operations

- When does restaurant access begin: mandate authorization or confirmed first payment?
- What grace period and retry policy apply after a recurring debit fails?
- When does cancellation stop renewal, and does paid access remain until the period end?
- Who can initiate cancellation, refund, retry, or manual reconciliation, and what audit evidence is required?
- What customer notices, invoices, tax records, payment receipts, and support procedures are required?
- What monitoring, alerting, dashboards, reconciliation reports, and incident runbooks are required before launch?

### Recommended implementation gate

Do not start provider code until the provider, backend/database stack, deployment environments, sandbox credentials, webhook secret, callback URLs, entitlement policy, and cancellation policy are approved. Cashfree currently documents a versioned Subscription API and signed subscription webhooks; Razorpay also documents UPI AutoPay. The final provider choice remains an explicit development decision rather than a prototype assumption.

- [Cashfree Subscription API overview](https://www.cashfree.com/docs/api-reference/payments/latest/subscription/overview)
- [Cashfree subscription webhooks](https://www.cashfree.com/docs/payments/subscription/webhooks)
- [Razorpay UPI AutoPay](https://razorpay.com/docs/payments/payment-gateway/s2s-integration/recurring-payments/upi/)
