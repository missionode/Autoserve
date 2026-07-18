# Autocode Prototype Authentication

> These credentials are for the local prototype only. They must not be reused for real accounts or production deployment. Authentication is simulated in the browser using Local Storage.

## Customer

- **Username / email:** `customer@autoserve.demo`
- **Mobile number:** `9000000001`
- **Password:** `Customer@123`
- **Destination after login:** `customers/`
- **Role:** Signed-in customer

The seeded customer can place orders, track active orders, view history, play Tic-Tac-Toe, and earn an eligible reward.

## Restaurant Admin

- **Username / email:** `admin@autoserve.demo`
- **Password:** `Admin@123`
- **Admin authorization PIN:** `2468`
- **Destination after login:** `restaurants/`
- **Role:** Admin

The seeded Admin has full restaurant, menu, inventory, Staff, reporting, configuration, and data-management access.

## Restaurant Staff

- **Staff ID:** `STF001`
- **Username / email:** `staff@autoserve.demo`
- **Password:** `Staff@123`
- **Destination after login:** `restaurants/`
- **Role:** Staff

The seeded Staff account can operate the live queue, fulfill orders, update inventory, and request cancellation with Admin PIN authorization.

## Guest Customer

- **Username:** Not required
- **Password:** Not required
- **Entry action:** Continue as Guest
- **Destination:** `customers/`
- **Role:** Guest customer

Guest customers can browse, order, pay, track an order, and play Tic-Tac-Toe, but cannot receive a game offer.

## Root Authentication Pages

All authentication and entry pages must remain in the project root:

- `index.html` — application entry and role selection
- `login.html` — shared customer, Admin, and Staff login
- `signup.html` — customer registration
- `forgot-password.html` — simulated credential recovery

Successful authentication routes users as follows:

```text
Customer login or Guest entry → customers/
Admin login                   → restaurants/
Staff login                   → restaurants/
```

Role permissions are resolved after login. Admin-only navigation and actions must remain unavailable to Staff even though both roles use the `restaurants/` application folder.

## Prototype Credential Rules

- Credential comparison is case-sensitive.
- Email addresses are normalized to lowercase before comparison.
- Staff can sign in using either Staff ID or email.
- A deactivated Staff account cannot sign in.
- Successful sessions persist through Local Storage.
- Signing out clears the active session without deleting application data.
- The Admin PIN is requested only for protected authorization actions and must not be displayed in ordinary storefront views.
- The prototype UI must identify this authentication as a simulation and not production security.

