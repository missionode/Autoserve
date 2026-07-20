# Autoserve Production Data Governance Proposal

## Status

- Stage: 4.0 Decisions and Governance
- Status: Internal policy ratified 20 July 2026 through APPR-006; external legal/tax and statutory-retention validation remains gated
- Important: Ratified internal retention defaults do not replace applicable law, tax advice, provider terms, or later legal validation

## 1. Data Principles

- Collect the minimum needed for an approved workflow.
- State a purpose before collecting, exposing, exporting, or retaining data.
- Keep payment instruments and provider secrets with the provider/secret manager, not Autoserve clients.
- Separate restaurant-owned, customer-owned, Support-purpose, and platform-governance data.
- Apply tenant and role controls to live records, exports, logs, backups, analytics, and Support tools.
- Prefer deletion or irreversible anonymization when purpose and required retention end.
- Preserve financial, security, and audit evidence only under an approved retention basis.
- Never use prototype credentials, sessions, PINs, or simulated payment identifiers in production.

## 2. Classification Levels

| Level | Description | Examples | Baseline handling |
|---|---|---|---|
| Public | Intended for public/customer display | Published restaurant name, menu, prices, public logo, hours | Integrity controls; CDN/cache allowed |
| Internal | Operational but not sensitive personal data | Feature flags, aggregate service metrics, non-sensitive runbooks | Authenticated access; no public listing |
| Confidential | Personal, tenant, commercial, or support data | Customer contact, orders, Staff profile, reports, Support messages | Encryption, tenant/role/purpose controls, masked logs |
| Restricted | High-impact identity, financial, licence, security, or bulk data | Password hashes, sessions, MFA/recovery, licence files, exports, webhook payloads, audit evidence | Strong access, reauth/elevation, private storage, detailed audit, minimal retention |
| Secret | Credentials that authorize systems/providers | API keys, webhook secrets, database/cloud credentials | Managed secret service only; never DB/UI/log/export |

## 3. Data Inventory and Proposed Controls

| Data class | Classification | Primary purpose | Access baseline | Retention decision owner/status |
|---|---|---|---|---|
| Published restaurant/menu/QR content | Public | Customer discovery and ordering | Public read; tenant Admin write | Product/Operations — Open |
| Restaurant company/contact profile | Confidential | Account, service and business administration | Tenant Admin; approved platform roles | Product/Privacy — Open |
| GST/PAN/FSSAI/trade licence evidence | Restricted | Restaurant verification and compliance | Applicant Admin status; elevated Super Admin review | Privacy/Compliance — Open |
| Customer name/email/mobile | Confidential | Account, order contact, receipt, Support | Customer; operational minimum; case-limited Support | Privacy/Product — Open |
| Password hash | Restricted | Authentication | Identity service only | Security — Open |
| Session/MFA/recovery data | Restricted | Authentication assurance and recovery | Identity/security services; user session controls | Security — Open |
| Staff/Admin membership/profile | Confidential | Workforce access and audit | Tenant Admin; own profile; platform exception | Security/Operations — Open |
| Cart/checkout draft | Confidential | Complete an order | Owning identity and checkout services | Product/Privacy — Open |
| Order/KOT/line/instructions/table/token | Confidential | Fulfillment, receipt, history, Support | Customer own; tenant operations; case-limited Support | Operations/Finance/Privacy — Open |
| Payment attempt/provider references | Restricted | Confirmation, refund, reconciliation, dispute | Payment/finance services; masked Admin/Support view | Finance/Privacy — Open |
| Complete payer instrument/UPI credential | Not retained | Provider-owned payment processing | Provider only | Confirm prohibition |
| Refund/settlement/reconciliation | Restricted | Financial operations and audit | Finance/approved operations | Finance/Compliance — Open |
| Game board/attempt/reward issue | Confidential | Waiting game and reward integrity | Customer own; tenant audit; system | Product/Privacy — Open |
| Support ticket/messages/contact | Confidential or Restricted by content | Assistance and resolution | Requester; purpose-limited Support | Support/Privacy — Open |
| Subscription mandate/payment references | Restricted | Billing, entitlement, reconciliation | Billing services; masked Admin/Support; platform finance | Finance/Privacy — Open |
| Notification destination/content/delivery | Confidential | User communications and evidence | Notification services; requester/Support minimum | Privacy/Support — Open |
| Audit/security events | Restricted | Accountability, fraud/security investigation | Security and purpose-approved auditors | Security/Finance — Open |
| Application logs/traces | Internal/Confidential | Reliability and incident diagnosis | Engineering/SRE; redacted | Infrastructure/Security — Open |
| Tenant export/backup/restore artifact | Restricted bulk data | Portability and recovery | Reauthenticated authorized role; recovery operator | Privacy/Infrastructure — Open |
| Provider/cloud/application secrets | Secret | System authorization | Managed runtime identity only | Security — rotation policy Open |

## 4. Retention Decision Table

Each owner must replace `TBD` with an approved period or event-based rule and its business/legal basis.

| Record | Active retention | Post-closure retention | Deletion/anonymization | Backup treatment |
|---|---|---|---|---|
| Customer account/profile | TBD | TBD | Delete/anonymize subject to exceptions | Expire through backup lifecycle |
| Guest identity/cart | TBD short period | Not applicable | Automatic expiry | Exclude where practical |
| Paid orders/receipts | TBD | TBD | Minimize/anonymize contact after required period | Encrypted lifecycle |
| Failed/pending payment attempts | TBD | TBD | Delete provider payload beyond reconciliation need | Encrypted lifecycle |
| Refund/settlement records | TBD | TBD | Retain approved financial minimum | Encrypted lifecycle |
| Restaurant licence files | Until superseded/expiry + TBD | TBD | Delete after basis ends | Restricted backup lifecycle |
| Staff memberships/security history | Active + TBD | TBD | Remove unnecessary profile, retain security minimum | Encrypted lifecycle |
| Support tickets/messages | Resolution + TBD | TBD | Delete/anonymize based on category | Encrypted lifecycle |
| Audit/security events | TBD by severity/type | TBD | Restricted deletion only under policy | Protected backup |
| Subscription billing records | TBD | TBD | Retain approved finance/provider minimum | Encrypted lifecycle |
| Notification delivery | TBD short/operational | TBD | Delete content before minimal status where possible | Limited backup |
| Logs/traces | TBD short tiered | Not applicable | Automated expiry | Usually exclude from app backups |
| Export artifacts | Hours/days TBD | Not applicable | Automatic object expiry and revoke | Exclude |
| Database backups | RPO/RTO-based TBD | Not applicable | Automated encrypted lifecycle | Restore-tested |

## 5. Data Subject and Account Workflows

Policy decisions and implementation must cover:

- View and correct customer profile.
- Download approved customer account/order data.
- Close account and request deletion.
- Explain retained exceptions and anonymization.
- Withdraw optional communication/analytics consent without blocking required service notices.
- Guest request recovery through approved reference/contact verification.
- Restaurant company correction, licence replacement, account closure, export, and contractual retention.
- Staff access removal and session revocation upon deactivation.

Requests require identity verification, audit, status tracking, response target, and escalation. Support must not fulfill a data request solely from knowledge of an order number or public Support reference.

## 6. Logging and Analytics Rules

Never log or send to analytics:

- Passwords, confirmation values, MFA/recovery secrets, session cookies, CSRF tokens.
- Provider secrets, authorization headers, database/cloud credentials.
- Complete payer identifiers or payment instruments.
- Complete licence document contents.
- Export/download URLs or signed storage credentials.
- Support message bodies by default.

Use stable internal identifiers, correlation IDs, coarse outcome codes, timings, and safe tenant identifiers. Customer/employee identifiers in telemetry require purpose and access approval. Log-redaction tests must run in CI.

## 7. Storage and Encryption Baseline

- TLS for external and internal service connections.
- Managed encryption at rest for PostgreSQL, Redis persistence where enabled, object storage, logs, and backups.
- Private buckets for licences and exports; public/CDN delivery only for approved menu/brand assets.
- Separate keys/service identities where risk and cloud design require it.
- Signed uploads/downloads with short expiry, content/type/size constraints, and audit.
- Secret service with rotation and emergency revocation.
- Production data prohibited in local development and CI unless irreversibly sanitized and approved.

## 8. Tenant Export, Restore, and Deletion

- Restaurant Admin export includes only the authorized tenant and approved related customer/order data.
- Platform settings, other restaurants, provider secrets, password hashes, sessions, MFA/recovery, internal security events, and unrestricted Support data are excluded.
- Export is asynchronous, reauthenticated, encrypted/private, short-lived, and audited.
- Restore is an operational recovery process, not arbitrary browser import; it validates schema, tenant, references, immutable records, and conflict policy.
- Restaurant deletion/closure separates immediate access revocation from scheduled retention/deletion.
- Backups expire through approved lifecycle; deletion requests document backup residual period and restoration re-deletion behavior.

## 9. Compliance and Vendor Review Checklist

The accountable owner must determine applicable law and obtain professional advice where required. Before launch, record:

- [ ] Legal entities acting as data controller/fiduciary, processor, merchant, and service provider.
- [ ] Applicable privacy, consumer, payment, tax, restaurant/licence, communications, and employment requirements.
- [ ] Published privacy notice, terms, refund/cancellation, subscription, cookie, and Support policies.
- [ ] Purpose/legal basis and consent requirement for every data class and message channel.
- [ ] Minor/age policy if relevant to customer accounts or games.
- [ ] Vendor inventory, data processing terms, locations/subprocessors, security evidence, breach terms, deletion/return, and exit plan.
- [ ] Cashfree/payment-provider merchant/KYC, prohibited use, settlement, dispute, callback, and data requirements.
- [ ] Google OAuth verification/branding/data-use requirements.
- [ ] SMS sender/template registration and consent/opt-out requirements.
- [ ] Cross-border transfer and hosting-location review.
- [ ] Data request, complaint, breach, law-enforcement, and regulatory response procedures.
- [ ] Retention schedule and defensible deletion implementation.
- [ ] Security incident notification thresholds, roles, evidence preservation, and communication templates.
- [ ] Accessibility standard and manual acceptance responsibility.
- [ ] Finance approval for invoice/receipt, tax, settlement, refund, subscription, and record retention.

## 10. Required Privacy/Data-Flow Diagrams

Create diagrams covering:

- Account creation, Google OAuth, verification, sessions, and recovery.
- Restaurant application/licence evidence and Super Admin review.
- QR/cart/checkout/payment/order/KOT/receipt.
- Support submission and case access.
- Subscription mandate, payment, entitlement, and finance reconciliation.
- Notifications and provider destinations.
- Logs, analytics, monitoring, and incident evidence.
- Export, restore, backup, deletion, and vendor exit.

Each diagram must identify purpose, data fields, source, destination, processor/vendor, region, encryption, access, retention, and deletion path.

## 11. Approval

Privacy/Security Owner: Unassigned  
Finance/Compliance Owner: Unassigned  
Product Owner: Unassigned  
Status: Open  
Approval date: Not approved
