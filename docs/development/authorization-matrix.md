# Autoserve Production Authorization Matrix

## Status

- Stage: 4.0 Decisions and Governance
- Status: Accepted internal policy 20 July 2026 through APPR-006; implementation evidence remains required in dependent stages
- Rule: deny by default; every allowed action requires server-side policy and tenant/purpose checks

## 1. Roles

- Guest: temporary customer identity for one restaurant context.
- Customer: authenticated customer identity; access to own records.
- Staff: active membership in one or more explicitly assigned restaurants with capabilities.
- Restaurant Admin: active administrative membership for an assigned restaurant.
- Support: platform workforce role with purpose-limited Support access, not restaurant administration.
- Super Admin: elevated platform role for restaurant approval and platform governance.
- System Worker: non-human service identity with narrowly scoped job/provider permissions.
- Infrastructure/Finance Operator: operational identities outside normal application roles; access through controlled operational tooling.

## 2. Policy Inputs

Authorization decisions must consider:

- Authenticated identity and current session assurance.
- Active account and verified identity state.
- Role and active restaurant membership.
- Target restaurant derived from authoritative record, not only request input.
- Explicit Staff capability where required.
- Ownership for customer/order/cart/receipt records.
- Support case purpose, assignment/elevation, and masked-field policy.
- Reauthentication/MFA freshness for sensitive actions.
- Delegation scope, target, expiry, nonce, revocation, and prior use.
- Restaurant approval/subscription/operating state only where approved policy makes it relevant.
- Record status/version and domain preconditions.

## 3. Workspace and Domain Matrix

Legend: `Own` = own identity/records; `Tenant` = active assigned restaurant; `Case` = purpose-limited Support case; `Platform` = approved platform scope; `—` = denied.

| Capability | Guest | Customer | Staff | Restaurant Admin | Support | Super Admin |
|---|---|---|---|---|---|---|
| Browse published restaurant menu | Tenant context | Tenant context | Tenant read | Tenant read | — | Audited platform read if required |
| Create/update cart | Own | Own | — | — | — | — |
| Checkout/create payment session | Own | Own | — | — | — | — |
| View order/tracking/receipt | Own current identity | Own | Tenant operational minimum | Tenant | Case with approved need | Audited platform exception only |
| View customer profile/contact | Own temporary data | Own | Minimum needed for fulfillment | Tenant operational need | Case, masked by default | Audited exception only |
| Play practice games | Own | Own | — | — | — | — |
| Use reward-eligible game | — | Own eligible order | — | Tenant audit/read | Case read if needed | Audited read |
| Submit Support request | Own | Own | Own | Own | Own internal request | Own internal request |
| View requester Support history | Same guest identity | Own | Own requests | Own requests | Assigned/permitted cases | Platform oversight if approved |
| Reply/resolve Support ticket | — | — | — | — | Case | Audited platform escalation only |
| View live KOT queue | — | Own status only | Tenant | Tenant | Case exception only | Audited platform exception only |
| Transition KOT | — | — | Tenant capability | Tenant | — | — |
| Manage availability | — | — | Tenant capability | Tenant | — | — |
| Manage menu/categories/combos | — | — | — unless explicitly delegated | Tenant | — | — |
| View retained history/reports | Own history | Own history | Tenant current-session minimum | Tenant retained | Case-limited | Platform aggregate/exception only |
| Cancel active order | Customer request only | Customer request only | Tenant + delegation | Tenant + reauth | — | — |
| Reopen delivered order | — | — | — | Tenant + reauth + policy | — | — |
| Manage Staff memberships | — | — | — | Tenant + reauth | — | Platform access intervention only |
| Manage restaurant settings/tables/QR | — | — | — | Tenant | — | Platform access/approval fields only |
| View/change restaurant subscription | — | — | — | Tenant billing permission + reauth | Case, masked read | Platform billing oversight |
| Create/edit platform plans | — | — | — | — | — | Platform + reauth |
| Review/approve restaurant licence | — | — | — | Own application status only | Case if assigned | Platform + reauth |
| Suspend restaurant operating access | — | — | — | — | — | Platform + reauth + reason |
| Manage platform users | — | — | — | Tenant Staff only | — | Platform + reauth |
| Export restaurant data | — | Own account export when policy supports | — | Tenant + reauth | — | Platform process only |
| Restore/purge/reset restaurant data | — | — | — | Tenant + reauth + confirmation/policy | — | Platform recovery process |
| View tenant audit | — | Own security/activity subset | Own action subset | Tenant | Case-related subset | Platform |
| View provider secrets/raw credentials | — | — | — | — | — | — |

Provider/cloud secrets are available only to narrowly scoped service identities or approved operators through secret-management and break-glass procedures, never through application screens.

## 4. Proposed Staff Capabilities

Restaurant membership should carry explicit capabilities rather than treating every Staff account equally:

- `orders.read`
- `orders.accept`
- `orders.prepare`
- `orders.ready`
- `orders.deliver`
- `orders.raise_issue`
- `availability.read`
- `availability.update`
- `history.session.read`
- `cancellation.request`
- `rewards.read`

Optional capabilities requiring explicit Admin assignment and policy approval:

- `menu.update_limited`
- `inventory.adjust`
- `reports.shift.read`

Capabilities not delegable to ordinary Staff in the proposed first release:

- Staff/user administration.
- Restaurant identity/licence settings.
- Subscription or payment-provider settings.
- Tenant export/restore/purge/reset.
- Admin/Super Admin credential or policy changes.
- Platform restaurant approval/access.

## 5. Sensitive Actions and Assurance

| Action | Proposed additional control |
|---|---|
| Staff cancellation | Action/order-bound, expiring, revocable delegation plus Staff session; single successful use |
| Admin cancellation/refund | Recent reauthentication and reason; provider result tracked |
| Staff membership/credential reset | Recent Admin reauthentication; notification and audit |
| Licence approval/rejection | Recent Super Admin reauthentication; reason and immutable decision event |
| Restaurant suspension | Recent Super Admin reauthentication; reason, impact warning, two-step confirmation |
| Plan/rate publication | Recent Super Admin reauthentication; effective-date and impacted-restaurant preview |
| Subscription cancellation/manual reconciliation | Recent authorized-role reauthentication; finance audit |
| Export | Recent Admin reauthentication; asynchronous private artifact and expiry |
| Restore/purge/reset/deletion | Recent reauthentication, typed confirmation, backup/recovery policy, dual approval where required |
| Role/MFA/security policy change | Elevated authentication, notification, audit, session revocation as applicable |
| Break-glass access | Named incident, short expiry, approval, full audit, post-use review |

## 6. Support Purpose Limitation

Proposed rules:

- Support sees the request, requester-provided data, relevant restaurant identity, status, and minimum linked operational evidence.
- Contact and payment references are masked unless approved elevation is necessary for the case.
- Opening/assigning a case establishes purpose; unrelated browsing and bulk export are denied.
- Sensitive elevation requires reason, time limit, and audit.
- Support cannot change restaurant settings, menus, Staff, payments, refunds, subscriptions, or approval state directly.
- Operational remedies occur through approved workflows or escalation to the accountable role.

## 7. Super Admin Boundary

Super Admin is not a routine tenant operator. Proposed rules:

- May review application/licence evidence, approval, platform access, platform users, plans, platform activity, and cross-restaurant billing summaries.
- Tenant content access is denied by default and allowed only through a defined support/security/incident workflow.
- Cannot obtain passwords, sessions, MFA secrets, complete payer instruments, provider secrets, or unrestricted database access through the application.
- Critical actions require recent elevated authentication, reason, confirmation, and alert/audit.

## 8. Database Policy Mapping

Every tenant table requires:

- RLS enabled and default deny.
- `restaurant_id` derived from the authenticated database request context.
- Separate read/write policies where behavior differs.
- Runtime API role without table-owner or `BYPASSRLS` privileges.
- Explicit, tested platform/support policies using purpose-specific service paths.
- Tenant-policy tests for select, insert, update, delete, foreign keys, exports, and aggregates.

Customer-owned tables additionally require ownership checks. Platform-only tables deny restaurant roles. Audit and paid snapshots restrict mutation beyond append/correction workflows.

## 9. Authorization Test Matrix

For each protected endpoint and event subscription, automated tests must cover:

- Unauthenticated request.
- Correct role and tenant.
- Correct role, wrong tenant.
- Wrong role, correct tenant.
- Disabled account or membership.
- Missing/expired capability.
- Missing/expired/replayed delegation.
- Stale or insufficient reauthentication/MFA assurance.
- Crafted target record whose authoritative tenant differs from request path.
- Support without case purpose and with expired elevation.
- Super Admin without elevated assurance.
- Direct database policy equivalent where applicable.

## 10. Open Approvals

- Workforce MFA requirements by role.
- Staff optional capabilities and delegation details.
- Reauthentication window per sensitive action.
- Support case/elevation model and masked fields.
- Super Admin exceptional tenant-access procedure.
- Customer account export/deletion boundary.
- Dual approval requirements for financial/data actions.

Approvers: Product Owner, Security/Privacy Owner, Restaurant Operations Owner, Support Owner, Technical Lead. All are currently unassigned.
