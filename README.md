# Autoserve Prototype

Autoserve is a browser-based restaurant ordering, KOT, fulfillment, administration, and customer waiting-game prototype. It uses HTML, vanilla JavaScript, Tailwind’s browser package, and versioned Local Storage; no backend or production payment provider is required.

## Workspaces

- `customers/` — guest and signed-in ordering, QR entry, digital menu, checkout, tracking, receipts, Help, and games.
- `restaurants/` — Admin and Staff operations, KOT queue, availability, menu management, reports, settings, branded QR cards, and data tools.
- `super_admin/` — platform dashboard, restaurant approval, restaurant directory, user management, activity, and Help.
- `support/` — centralized support metrics, searchable request queue, threaded replies, resolution, and activity.
- Root pages — shared login, customer registration, restaurant company onboarding, recovery, and role routing.

## Current Prototype Highlights

- Table and pickup-counter QR entry with printable restaurant branding, logo, complaint contact, and Autoserve identity.
- Restaurant-configurable dine-in modes, table numbers, service preference, digital-menu combos, rewards, and daily administrative token.
- Realistic item availability states: Available, Limited, Temporarily unavailable, and Sold out for today.
- Fast ordering through Quick add defaults, customization, persistent order review, simulated UPI payment, KOT creation, token tracking, and meal-ready timer.
- Waiting Game corner with reward-eligible Tic-Tac-Toe plus practice-only Memory Match, Tap Rush, and Ludo Race.
- Support forms in Customer, Guest, Admin, Staff, and Super Admin Help views, connected to the Support workspace.
- Responsive desktop, tablet, and mobile navigation with compact icon CTAs and aligned mobile header actions.
- Seeded operational history, support conversations, restaurant data, users, orders, payments, cancellations, and rewards.

## Run Locally

Serve the repository root on port 8000, then open:

```text
http://localhost:8000/login.html
```

Prototype credentials and routing are documented in `authentication.md`.

## Verification

```sh
node --test tests/*.test.js
```

The prototype is intentionally client-side. Authentication, authorization secrets, payments, refunds, notifications, camera scanning, and persistence are simulations and must not be treated as production security or infrastructure.
