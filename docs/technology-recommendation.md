# Autoserve Production Technology Recommendation

## Status and Scope

This document recommends the technology stack for developing Autoserve after the browser prototype is frozen. It does not change the current prototype, which intentionally remains HTML, vanilla JavaScript, Tailwind CSS, and Local Storage.

The implementation sequence, domain plan, quality gates, migration, ownership, risks, and launch criteria are defined in `development-plan.md` and tracked in Phase 4 of `worksheet.md`.

The recommendation is based on Autoserve's existing requirements: multi-restaurant isolation, QR and table ordering, payment-before-KOT creation, live fulfillment updates, Admin and Staff permissions, Super Admin approval, Support workflows, immutable order and billing history, UPI AutoPay, audit trails, backups, responsive workspaces, and waiting games.

## Recommended Stack

| Layer | Recommended technology | Autoserve responsibility |
|---|---|---|
| Web applications | Next.js, React, and TypeScript | Customer, Restaurant, Super Admin, and Support workspaces |
| UI foundation | Tailwind CSS and Radix UI | Responsive styling and accessible interactive controls |
| Backend API | NestJS and TypeScript | Business rules, authorization, validation, webhooks, and realtime gateways |
| Primary database | PostgreSQL | Restaurants, users, menus, orders, KOTs, payments, subscriptions, support, and audits |
| Database access | Prisma ORM | Type-safe queries, migrations, constraints, and transactions |
| Realtime transport | NestJS WebSocket gateways with Socket.IO | KOT updates, customer tracking, meal-ready state, and operational alerts |
| Cache and background work | Redis and BullMQ | Rate limiting, delayed-order timers, notification jobs, retries, and reconciliation |
| Authentication | Server-backed sessions in secure HTTP-only cookies | Role-aware login without browser-readable authorization tokens |
| Customer social login | Google OAuth through Auth.js or a backend OAuth flow | Customer-only Google sign-in and registration |
| Payments and billing | Cashfree Payments and Cashfree Subscriptions | Customer UPI payments and Restaurant UPI AutoPay mandates |
| File storage | Amazon S3 or compatible object storage | Menu images, restaurant logos, licence evidence, QR assets, and exports |
| Email and messaging | Amazon SES or Postmark plus an approved Indian SMS provider | Approval, support, billing, and operational notifications |
| Automated testing | Vitest and Playwright | Unit, integration, browser journey, accessibility, and responsive verification |
| Observability | OpenTelemetry and Sentry | Traces, structured errors, performance, and operational diagnosis |
| Deployment | AWS Mumbai region using managed PostgreSQL, Redis, object storage, and containers | Production infrastructure close to the primary Indian user base |

## Architecture Decision

Autoserve should begin as a **TypeScript modular monolith**, not as microservices. The web application, API, and background worker can be deployed independently while sharing contracts and one transactional data model.

```text
Customer / Guest / Staff / Admin / Support / Super Admin
                           │
                     Next.js web app
                           │
                       NestJS API
          ┌────────────────┼────────────────┐
          │                │                │
      PostgreSQL      Redis/BullMQ     Object storage
          │                │                │
   transactional       jobs and         images, licences,
   source of truth     realtime fanout   QR assets, exports
                           │
              Cashfree and notification providers
```

Suggested monorepo structure:

```text
apps/
  web/          Next.js workspaces
  api/          NestJS HTTP and WebSocket API
  worker/       BullMQ background processors
packages/
  database/     Prisma schema and migrations
  contracts/    Shared API schemas and TypeScript types
  ui/           Shared accessible components
  configuration/
```

## Non-Negotiable Design Rules

### Tenant isolation

Every restaurant-owned record must carry a `restaurant_id`. NestJS authorization must enforce the active restaurant and role, and PostgreSQL Row-Level Security should provide a second database-level boundary. Super Admin and Support access must use explicit, audited policies rather than bypassing tenant checks accidentally.

### Transactional order creation

A successful food payment must create the payment record, immutable paid snapshot, order, KOT, token allocation, availability change, and audit events in one database transaction. An incomplete transaction must not leave a paid customer without a traceable order.

### Idempotency

Food payments, provider webhooks, token and KOT allocation, cancellations, refunds, rewards, inventory restoration, subscription authorization, and renewal processing require stable idempotency keys and database uniqueness constraints.

### PostgreSQL as the source of truth

Redis may accelerate reads, coordinate jobs, and distribute realtime events, but it must not be the authoritative order, payment, subscription, or inventory store. A reconnecting client must reload current state from the API because realtime messages can be missed.

### Backend-owned payments

Payment credentials and provider secrets must never enter the web application, Local Storage, logs, exports, or source control. The backend creates payment or mandate sessions, verifies signed callbacks, stores masked payer references, and changes access only after an authenticated, idempotently processed provider event.

### Immutable history and auditable mutations

Paid-order names, prices, taxes, options, plan rates, and plan features must remain snapshot values. Privileged changes must record actor, tenant, action, target, before/after information where appropriate, timestamp, and request correlation identifier.

### Recoverable background processing

Notifications, delayed-order checks, report generation, and payment reconciliation should run through durable jobs with retry limits and dead-letter handling. Realtime Pub/Sub alone is insufficient for work that must not be lost.

## Deployment Progression

1. Start with one Next.js application, one NestJS API, one worker, one PostgreSQL database, and one Redis service.
2. Deploy separate development, staging, and production environments with independent provider credentials and databases.
3. Use automated migrations, encrypted backups, secret management, structured logging, health checks, and rollback-capable releases from the first production deployment.
4. Add replicas, service separation, or event streaming only when measured traffic, fault isolation, or team ownership justifies the additional operational cost.

## Technologies Not Recommended as the Primary Foundation

- Do not use Local Storage as authoritative production state; retain it only for temporary cart recovery and harmless preferences.
- Do not begin with microservices because they add distributed consistency, deployment, queue, and tracing complexity before scale requires it.
- Do not use Redis Pub/Sub as durable delivery for payment, KOT, subscription, or notification work.
- Do not place payment, authorization, or tenant-isolation rules only in the frontend.
- Do not make a document database the primary store for this relational and transaction-heavy system.
- Do not build separate native mobile applications initially; first deliver the responsive web application/PWA used by QR customers and restaurant tablets.

## Development Decisions Still Required

Before implementation begins, confirm:

- Cashfree merchant eligibility, commercial terms, settlement flow, sandbox access, and webhook requirements.
- Subscription grace period, access enforcement, entitlements, upgrades, downgrades, proration, cancellation, retry, and removed-plan rules.
- Production hosting account, Indian region, recovery objectives, retention periods, and backup ownership.
- SMS, email, and WhatsApp providers and which events warrant each channel.
- Customer and employee identity, session duration, MFA, device management, and account recovery policies.
- Data retention, deletion, export, consent, privacy, licence-document access, and audit-retention requirements.

The detailed UPI AutoPay questions and implementation gate remain in `subscription-billing.md`.

## Primary References

- [Next.js App Router documentation](https://nextjs.org/docs/app)
- [Next.js production checklist](https://nextjs.org/docs/app/guides/production-checklist)
- [NestJS WebSocket gateways](https://docs.nestjs.com/websockets/gateways)
- [NestJS queues](https://docs.nestjs.com/techniques/queues)
- [PostgreSQL Row-Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Redis Pub/Sub delivery semantics](https://redis.io/docs/latest/develop/pubsub/)
- [Cashfree Subscriptions overview](https://www.cashfree.com/docs/api-reference/payments/latest/subscription/overview)
- [Cashfree subscription webhooks](https://www.cashfree.com/docs/payments/subscription/webhooks)
- [Amazon S3 documentation](https://docs.aws.amazon.com/AmazonS3/latest/developerguide/)
