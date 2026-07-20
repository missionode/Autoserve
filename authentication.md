# Autocode Prototype Authentication

> These credentials are for the local prototype only. They must not be reused for real accounts or production deployment. Authentication is simulated in the browser using Local Storage.

## Customer

- **Username / email:** `customer@autoserve.demo`
- **Mobile number:** `9000000001`
- **Password:** `Customer@123`
- **Destination after login:** `customers/`
- **Role:** Signed-in customer

The seeded customer can place orders, track active orders, view history, submit Support requests, play all waiting games, and earn an eligible Tic-Tac-Toe reward.

Customer login and registration also provide a simulated **Continue with Google** flow. It creates or reuses `google.customer@autoserve.demo`, preserves an active guest order, and does not contact Google or request real account data.

## Restaurant Admin

- **Username / email:** `admin@autoserve.demo`
- **Password:** `Admin@123`
- **Owner recovery PIN:** `2468` (not shared with Staff)
- **Daily administrative token:** Generated in Restaurant settings and expires at local midnight
- **Destination after login:** `restaurants/`
- **Role:** Admin

The seeded Admin has full restaurant, menu, inventory, Staff, reporting, configuration, and data-management access.

## Restaurant Staff

- **Staff ID:** `STF001`
- **Username / email:** `staff@autoserve.demo`
- **Password:** `Staff@123`
- **Destination after login:** `restaurants/`
- **Role:** Staff

The seeded Staff account can operate the live queue, fulfill orders, update availability, submit Support requests, and request protected administrative actions with the current daily administrative token.

## Super Admin

- **Username:** `superadmin`
- **Password:** `SuperAdmin@123`
- **Destination after login:** `super_admin/`
- **Role:** Platform Super Admin

The Super Admin reviews restaurant company and licence details, approves or rejects restaurant applications, manages platform users and restaurants, reviews activity, and can contact Support.

## Support

- **Username:** `support`
- **Password:** `Support@123`
- **Destination after login:** `support/`
- **Role:** Autoserve Support

The Support account can review requests from every Help workspace, search and filter the queue, take ownership, reply, resolve or reopen requests, and review Support activity.

## Guest Customer

- **Username:** Not required
- **Password:** Not required
- **Entry action:** Continue as Guest
- **Destination:** `customers/`
- **Role:** Guest customer

Guest customers can browse, order, pay, track an order, submit a Support request, and play all games, but cannot receive a game reward.

## Root Authentication Pages

All authentication and entry pages must remain in the project root:

- `index.html` — application entry and role selection
- `login.html` — shared Customer, Admin, Staff, Super Admin, and Support login
- `signup.html` — customer registration
- `restaurant-signup.html` — restaurant company and licence onboarding
- `forgot-password.html` — simulated credential recovery

Successful authentication routes users as follows:

```text
Customer login or Guest entry → customers/
Admin login                   → restaurants/
Staff login                   → restaurants/
Super Admin login             → super_admin/
Support login                 → support/
```

Role permissions are resolved after login. Admin-only navigation and actions must remain unavailable to Staff even though both roles use the `restaurants/` application folder.

## Prototype Credential Rules

- Credential comparison is case-sensitive.
- Email addresses are normalized to lowercase before comparison.
- Staff can sign in using either Staff ID or email.
- A deactivated Staff account cannot sign in.
- Successful sessions persist through Local Storage.
- Signing out clears the active session without deleting application data.
- The restaurant’s daily administrative token is requested only for protected delegated actions. It expires at local midnight and can be reloaded by an Admin.
- The prototype UI must identify this authentication as a simulation and not production security.
