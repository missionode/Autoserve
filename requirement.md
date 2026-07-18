# Autocode Prototype Requirements

## 1. Document Status

- Product name: Autocode (working name; the inspiration template currently uses Autoserve)
- Application category: Hotel/restaurant ordering, payment, KOT, and guest-waiting system
- Prototype stage: Stage 2 — requirements definition
- Inspiration design: Completed in `design_template/index.html`
- Customer module: Approved
- Restaurant/storefront module: To be discussed next
- Prototype implementation: Begins after the requirements are approved

### Hotel/KOT workflow amendment (approved)

- Customers enter from the hotel/store QR, browse items currently marked available by the kitchen, and choose self-service pickup or dine-in table service.
- Payment must succeed before an order is created and before a Kitchen Order Ticket (KOT) is generated.
- Every paid order receives a sequential KOT number, a token, and an immutable kitchen snapshot containing its items, instructions, table, and service preference.
- After payment, the customer is sent directly to the game/waiting screen while the KOT moves through New, Accepted, Preparing, Ready, and Served.
- The operational model uses item availability (`Available`, `Limited`, `Temporarily unavailable`, or `Sold out for today`) instead of decrementing numeric stock for every customer order.
- When a self-service KOT becomes Ready, the customer is told to collect the displayed token at the pickup counter.
- When a table-service KOT becomes Ready, the customer is told that the food is ready and will be served at the selected table.
- Cancelling an availability-based KOT does not restore numeric stock because no numeric stock was deducted.

## 2. Technical Constraints

- Multi-view Single Page Application (SPA)
- Pure HTML5
- Vanilla JavaScript (ES6+)
- Tailwind CSS using the official browser CDN package
- Tailwind Typography plugin where supported and required
- No heavy frontend framework
- Application state managed in JavaScript
- Local Storage used for prototype persistence and continuity
- Responsive support for mobile, tablet, and desktop
- Customer and restaurant experiences stored in separate folders
- All authentication and entry files stored at the project root
- Successful login routes each user to the corresponding customer or restaurant folder

## 3. Proposed Project Structure

```text
/
├── index.html
├── login.html
├── signup.html
├── forgot-password.html
├── authentication.md
├── requirement.md
├── worksheet.md
├── customers/
├── restaurants/
└── design_template/
```

All authentication pages remain at the root. Customer login, customer sign-up, and guest continuation route into `customers/`. Admin and Staff login route into `restaurants/`, where role-aware permissions determine the available views and actions. The exact internal folder structure may be refined without changing these routing and separation requirements.

## 4. Customer Module

### 4.1 Customer objective

The customer module must let a customer enter a restaurant experience, browse available items, build and pay for an order, receive a sequential token, track fulfillment, and play Tic-Tac-Toe while waiting. Signed-in customers with an eligible paid order can earn a complimentary item by winning the game.

### 4.2 Roles and access levels

#### Guest customer

A guest can:

- Browse a restaurant menu
- Search and filter menu items
- Customize items
- Build and modify a cart
- Complete checkout and simulated payment
- Receive and track an order token
- Play Tic-Tac-Toe for entertainment
- View the current order and receipt on the same browser

A guest cannot earn a game reward or retain permanent cross-device order history.

Guest checkout requires:

- Customer name
- Mobile number

#### Signed-in customer

A signed-in customer has all guest capabilities and can also:

- Earn a game reward for an eligible paid order
- View active and completed orders
- View previous receipts
- Reorder available items
- Access and update a customer profile
- Retain game reward records

### 4.3 Restaurant entry

- Customers can enter through a restaurant-specific URL or QR code.
- A restaurant QR identifies the selected restaurant.
- A table QR identifies both the restaurant and table number.
- A detected table number is carried into checkout but may be reviewed by the customer.
- The application restores a valid session, active order, and unfinished cart from Local Storage.
- Missing or invalid restaurant data produces a clear error and retry path.

### 4.4 Authentication

Customers can sign in, create an account, or continue as guests.

Customer authentication uses the shared root pages. Successful customer login, registration, or guest continuation routes into the `customers/` application folder.

Sign-up fields:

- Name
- Mobile number
- Email address
- Password

Sign-in accepts:

- Email address or mobile number
- Password

Prototype authentication rules:

- Authentication and sessions are simulated with Local Storage.
- The UI must indicate that authentication is for prototype use and is not production security.
- An existing guest cart is preserved when the customer signs in.
- Associating a previously placed guest order with a newly created account is not automatic.

### 4.5 Digital menu

The menu is generated dynamically from menu and inventory state.

Required categories:

- All
- Main Course
- Snacks
- Sides
- Beverages
- Desserts

Required menu capabilities:

- Responsive item grid
- Category filters
- Text search by item name
- Vegetarian and non-vegetarian indicators
- Item image
- Item name
- Short description
- Base price
- Availability state
- Item details view or modal
- Clear empty search and category states

Sold-out behavior:

- Sold-out items remain visible.
- Sold-out items are clearly labelled.
- Ordering controls are disabled when stock is zero.
- Availability changes must be reflected from current inventory state.

### 4.6 Item customization

Supported item options include:

- Quantity
- Size or portion
- Spice level
- Add-ons
- Special instructions

Rules:

- Required choices must be completed before adding an item.
- Price-changing selections must update the displayed item total.
- Inventory is validated before the item is added.
- Cart entries retain their selected options and instructions.

### 4.7 Cart

- The cart is a slide-out drawer on desktop.
- The cart uses a mobile-appropriate full-screen drawer on small screens.
- The customer can increase or decrease quantities.
- The customer can remove items.
- The customer can return to menu browsing without losing the cart.
- The cart persists across refreshes.
- Only items from one restaurant can be in the cart at a time.
- Changing restaurants while a cart contains items requires confirmation before clearing it.

Cart totals include:

- Subtotal
- Configurable tax
- Applied discount, when applicable
- Final total

No delivery charge is required because the prototype supports dine-in and takeaway only.

Inventory must be checked when:

- Adding an item
- Increasing quantity
- Opening checkout
- Initiating payment

If requested stock is no longer available, the customer must reduce or remove the affected item before payment.

### 4.8 Checkout

The customer selects:

- Dine-in
- Takeaway

Dine-in orders require a table number. A table number may come from the entry QR or be entered/selected during checkout. Takeaway orders do not require a table number.

Checkout fields and information:

- Customer name
- Mobile number
- Order type
- Table number when applicable
- Optional order notes
- Item and customization summary
- Subtotal, tax, discount, and total
- Terms acceptance

A final inventory validation must complete before payment begins.

### 4.9 Simulated UPI payment

The payment experience simulates a UPI intent using a mock UPI application selection or UPI ID.

Required outcomes:

- Processing
- Success
- Failure
- Cancellation
- Pending followed by success or failure

Payment rules:

- An order is created only after a successful payment callback.
- Failed, cancelled, or unresolved payments do not permanently deduct inventory.
- The cart is preserved after failure or cancellation.
- The customer can retry payment.
- Duplicate submissions must not create duplicate transactions, orders, or tokens.
- Successful payments store a simulated transaction ID and timestamp.

### 4.10 Order and token creation

After successful payment, the application must:

1. Create the order.
2. Record successful payment details.
3. Deduct purchased quantities from inventory.
4. Generate the restaurant's next token.
5. Add the order to the restaurant service queue.
6. Clear the customer's cart.
7. Display order confirmation.

Token rules:

- Tokens are sequential three-digit values beginning at `100`.
- The sequence is maintained independently for each restaurant.
- One successful order receives exactly one token.
- Refreshing or repeating a callback cannot generate another token.

Order confirmation displays:

- Token number
- Order number
- Restaurant
- Items and customizations
- Amount paid
- Order type
- Table number when applicable
- Payment status
- Current fulfillment status
- Estimated waiting time

### 4.11 Order tracking

Required order states:

1. Payment confirmed
2. Order received
3. Preparing
4. Ready
5. Delivered
6. Cancelled

The tracking view displays:

- Large token number
- Current order status
- Elapsed waiting time
- Estimated waiting time
- Order summary
- Payment information
- Earned game reward when applicable
- Pickup or dine-in instructions
- Tic-Tac-Toe entry action while the order is active

For the Local Storage prototype, open customer and restaurant tabs should synchronize relevant changes using browser storage events.

### 4.12 Tic-Tac-Toe waiting game

Tic-Tac-Toe is the only game included in the first prototype.

General game requirements:

- Available from active-order tracking
- Playable by guests and signed-in customers
- Customer plays against a beatable computer opponent
- Winning is determined by gameplay skill, not random reward selection
- Clearly identifies the current turn
- Prevents moves in occupied cells
- Makes the computer move automatically
- Detects win, loss, and draw states
- Prevents additional moves after completion
- Responsive on mobile and desktop
- Keeps token and order status visible while playing
- Shows or triggers an order-ready interruption when fulfillment changes to Ready

Guest message:

> Play for fun! Sign in and place an order to unlock a complimentary reward when you win.

Signed-in customer without an eligible active order:

> Place an order to unlock a reward-eligible match.

Eligible customer message:

> Beat the computer to win a complimentary item with your current order.

### 4.13 Game reward eligibility

A customer is reward-eligible only when all of the following are true:

- The customer is signed in.
- The customer has a successfully paid active order.
- The active order is not Ready, Delivered, or Cancelled.
- The order has not already consumed its reward attempt.

Rules:

- Each paid order receives one reward-eligible match.
- A win, loss, or draw consumes the eligible attempt.
- Refreshing, reopening, or navigating away cannot restore the attempt.
- Additional games are practice-only and cannot produce rewards for that order.
- Guests can play but cannot earn a reward.
- Winning without eligibility produces a congratulatory result and an eligibility explanation.

### 4.14 Reward behavior

Primary reward:

- One complimentary beverage added to the current active order at `₹0`

Fallback reward:

- One complimentary side added to the current active order at `₹0`

Reward application process:

1. Confirm customer and order eligibility.
2. Confirm the attempt is unused.
3. Check primary reward inventory.
4. Use the fallback reward if the beverage is unavailable.
5. If neither reward is available, record the win and flag a manual alternative for staff.
6. Add the available reward to the active order.
7. Deduct reward inventory.
8. Mark the attempt as consumed.
9. Update customer tracking and the restaurant queue.

Reward rules:

- The already-paid total is not changed.
- The reward is labelled `Tic-Tac-Toe Reward — Complimentary`.
- The reward origin is visible to restaurant staff.
- The system must not add an unavailable reward item.
- A reward cannot be added after the order reaches Ready, Delivered, or Cancelled.
- The operation must be idempotent and cannot issue the reward twice.

### 4.15 Ready and fulfillment experience

When an order becomes Ready:

- A prominent notification or overlay appears.
- An active game pauses or yields to the notification.
- The token and collection instructions are displayed.
- The recorded game result is preserved.

When restaurant staff mark the order Delivered:

- Tracking displays the final Delivered state.
- The active order is moved into history.
- The final summary includes purchased items, any complimentary reward, payment confirmation, and completion time.

### 4.16 Profile, history, and reorder

Signed-in customers require:

- Profile view
- Active orders view
- Completed order history
- Order details and receipt view
- Reward history
- Reorder action

Reorder rules:

- Reorder adds only currently available items.
- Current prices and customization availability apply.
- Unavailable items are reported and skipped or require customer review.
- Reordering does not bypass cart, inventory validation, checkout, or payment.

Guest customers can access the current order and receipt only while the relevant local browser data remains available.

### 4.17 Customer help and error handling

Customer help content must explain:

- How to browse and order
- Dine-in and takeaway behavior
- Token allocation
- Payment verification
- Order tracking
- Tic-Tac-Toe eligibility and rewards
- Sold-out and inventory behavior

Required recoverable states include:

- Restaurant unavailable
- Empty menu or category
- Item sold out
- Insufficient quantity
- Invalid table reference
- Payment failed
- Payment cancelled
- Payment pending
- Duplicate payment action
- Missing active order
- Reward out of stock
- Local data unavailable or cleared
- General not-found state

Errors must clearly state what happened and provide an appropriate retry, correction, or navigation action.

### 4.18 Customer screens

The customer experience requires the following views or SPA routes:

1. Restaurant entry
2. Login wrapper
3. Sign-up wrapper
4. Digital menu
5. Item details and customization
6. Cart drawer
7. Checkout
8. UPI payment simulation
9. Payment result
10. Order confirmation
11. Active order tracking
12. Tic-Tac-Toe
13. Active orders
14. Order history
15. Order details and receipt
16. Customer profile
17. Help and FAQ
18. Not-found and recoverable error states

### 4.19 Customer acceptance journey

The primary customer flow is complete when a user can:

```text
Open a restaurant URL or QR
→ Sign in, sign up, or continue as guest
→ Browse, search, and filter the live menu
→ Customize an available item
→ Add it to the persistent cart
→ Select dine-in or takeaway
→ Review totals and pass final inventory validation
→ Complete a successful simulated UPI payment
→ Receive one sequential restaurant token
→ Track the active order
→ Play Tic-Tac-Toe while waiting
→ Receive a current-order complimentary item after an eligible win
→ Receive an order-ready notification
→ Have the order marked delivered
→ View the final receipt and, when signed in, order history
```

## 5. Restaurant/Storefront Module

### 5.1 Restaurant roles

The restaurant/storefront prototype supports two roles: Admin and Staff.

#### Admin

The Admin has complete restaurant-level access and can:

- View the operational dashboard
- View and manage active orders
- Update preparation and fulfillment statuses
- Mark orders Ready or Delivered
- View payment and token details
- Manage menu items and categories
- Change prices and customization options
- Manage inventory quantities
- Toggle sold-out and emergency inventory cutoffs
- Configure the Tic-Tac-Toe primary and fallback rewards
- View completed and cancelled orders
- View prototype reports
- Manage the restaurant profile and operational settings
- Create, update, deactivate, and reset Staff accounts
- Import and export JSON data
- Create and purge backups
- Reset prototype data

Destructive actions such as purging backups or resetting data require an explicit confirmation step.

#### Staff

Staff access focuses on daily restaurant operations. Staff can:

- View active orders and tokens
- View customer order details
- Progress orders through preparation statuses
- Mark orders Ready or Delivered
- See dine-in table or takeaway information
- View payment verification status
- See complimentary items earned through Tic-Tac-Toe
- Update inventory quantities
- Temporarily mark items Sold Out or Available
- View completed orders from the current operating session
- Access operational help

Staff cannot:

- Change menu pricing
- Create or delete menu items or categories
- Configure game rewards
- Manage Admin or Staff accounts
- Change restaurant settings
- Import, export, purge, or reset data
- Access Admin reports

### 5.2 Restaurant authentication

As a restaurant user, I want to sign in with my assigned role so that I can access only the tools required for my responsibilities.

Authentication requirements:

- A user identifies or selects the restaurant before signing in.
- Restaurant authentication uses the shared root `login.html` page.
- Sign-in accepts an email address or Staff ID and password.
- The application resolves the account's Admin or Staff role.
- A successful login opens the role-appropriate operational dashboard.
- Successful Admin and Staff login routes into the `restaurants/` application folder.
- The authenticated prototype session persists in Local Storage.
- Protected views reject unauthorized access and return the user to restaurant login.
- A restaurant user can sign out from any storefront view.
- Deactivated Staff accounts cannot sign in.
- The prototype includes one default Admin account and at least one Staff account.
- Authentication is simulated and must be identified as non-production security.

Restaurant entry flow:

```text
Open restaurant portal
→ Select or identify restaurant
→ Enter email/Staff ID and password
→ Validate account
→ Resolve Admin or Staff permissions
→ Open the operational dashboard
```

The seeded prototype usernames, passwords, Admin authorization PIN, and routing destinations are maintained in `authentication.md`.

### 5.3 Inventory activity audit

Both Admin and Staff can update inventory quantities and temporary availability states. Every change must create an inventory activity record containing:

- Restaurant identifier
- Menu item identifier and name
- Acting user identifier and name
- Acting user role
- Change type
- Previous quantity or availability state
- New quantity or availability state
- Date and time
- Optional reason or note

The Admin can review the complete inventory activity history. Staff do not have access to the complete audit history.

### 5.4 Operational dashboard

As a restaurant user, I want an immediate overview of current operations so that I can identify waiting orders, delays, inventory issues, and required actions.

#### Shared dashboard information

Admin and Staff can see:

- Restaurant name and operating status
- Current date and time
- Signed-in user name and role
- New order count
- Preparing order count
- Ready order count
- Orders delivered during the current operating session
- Average preparation time
- Delayed order count
- Low-stock item count
- Sold-out item count
- Live token queue
- Recent operational alerts

#### Live token queue

Each active order card displays:

- Three-digit token
- Order number
- Dine-in or takeaway
- Table number for dine-in
- Customer name
- Ordered items and quantities
- Item customizations
- Customer order notes
- Payment verification state
- Tic-Tac-Toe complimentary reward when applicable
- Time received
- Elapsed waiting time
- Current fulfillment status
- Next permitted fulfillment action

Outstanding orders are presented chronologically, with the oldest outstanding order first. The queue uses clear urgency states:

- Normal: within expected preparation time
- Warning: approaching expected preparation time
- Delayed: past expected preparation time
- Ready: clearly highlighted for collection or service

#### Staff dashboard actions

Staff can:

- Accept a new order
- Start preparation
- Mark an order Ready
- Mark an order Delivered
- Open complete order details
- Update inventory quantities
- Toggle temporary Sold Out states
- Review completed orders from the current operating session

Required progression:

```text
Payment confirmed
→ Order received
→ Preparing
→ Ready
→ Delivered
```

Staff cannot skip directly from Order received to Delivered.

#### Admin dashboard additions

The Admin also sees:

- Current-session sales
- Total order count
- Average order value
- Payment success and failure summary
- Complimentary rewards issued
- Top-selling items
- Inventory alerts
- Recent Staff activity
- Data backup state
- Shortcuts to menu, Staff, reports, and settings

#### Operational alerts

The dashboard generates alerts for:

- New paid order
- Delayed order
- Low inventory
- Item becoming Sold Out
- Configured reward item unavailable
- Payment remaining Pending unusually long
- Import or backup failure
- Local Storage capacity or data failure

Alerts can be dismissed, but unresolved underlying conditions remain represented in the relevant dashboard metric or panel.

#### Dashboard empty and recovery states

The dashboard provides clear states for:

- No active orders
- No completed orders in the current session
- No inventory alerts
- Restaurant closed
- Missing or corrupted local data
- Changes received from another browser tab

Order, status, and inventory changes synchronize between open prototype tabs using browser storage events.

### 5.5 Order preparation and fulfillment

#### New paid order

After a customer payment succeeds:

- The order enters the queue as Payment confirmed.
- Purchased inventory has already been deducted.
- A new-order alert appears.
- Staff can open the order and select Accept Order.
- Duplicate acceptance from multiple tabs is prevented.

Accept Order changes the state to Order received and records the acting user and timestamp.

#### Order detail review

Restaurant users can review:

- Items and quantities
- Size, spice level, and add-ons
- Customer instructions
- Dine-in table or takeaway type
- Payment verification state
- Complimentary game reward
- Order and payment timestamps

Payment verification is read-only for Staff.

#### Preparation

Selecting Start Preparing:

- Changes the order state to Preparing.
- Records the acting user and time.
- Starts the preparation elapsed-time metric.
- Updates customer tracking.
- Moves the order into the Preparing queue.

If an item cannot be prepared, Staff can flag Item unavailable, Equipment issue, Customer clarification required, or Other operational issue. The order receives an Attention required state and an internal note. Staff cannot silently remove a paid item.

#### Game reward during preparation

When an eligible customer earns a Tic-Tac-Toe reward:

- The order receives a visible reward badge.
- The complimentary beverage or fallback side is added at `₹0`.
- Staff are alerted if preparation has already started.
- The event is added to the order timeline.
- Rewards cannot be added after the order reaches Ready.

#### Mark Ready

Before marking an order Ready, the restaurant user confirms:

- All purchased items are prepared.
- All complimentary items are included.
- Packaging or dine-in presentation is complete.

The system then:

- Changes the status to Ready.
- Records the acting user and timestamp.
- Notifies the customer.
- Highlights the token in the Ready queue.
- Stops the preparation timer.
- Starts a ready-waiting timer.

#### Mark Delivered

After verifying the token or table number, the restaurant user can select Mark Delivered. A confirmation prompt is required.

The system:

- Changes the status to Delivered.
- Records the acting user and completion time.
- Removes the order from the active queue.
- Adds it to current-session completed orders.
- Updates customer tracking and history.
- Includes it in dashboard metrics and reports.

#### Order activity timeline

The order stores events for:

- Order created
- Payment confirmed
- Token allocated
- Order accepted
- Preparation started
- Reward added when applicable
- Operational issue raised and resolved
- Marked Ready
- Marked Delivered
- Cancellation requested, authorized, or rejected
- Order reopened when applicable

Each event records its timestamp and acting user.

#### Reopening a Delivered order

- Staff cannot reopen a Delivered order.
- Admin can reopen a mistakenly delivered order during the current operating session.
- Reopening requires a reason and creates an audit event.
- A reopened order returns to Ready, not Preparing.

#### Staff cancellation with Admin PIN

Staff can cancel a paid order only with Admin PIN authorization.

Cancellation flow:

1. Staff selects Request Cancellation.
2. Staff chooses or enters a cancellation reason.
3. The application displays a protected Admin PIN prompt.
4. An authorized Admin enters the PIN without exposing it to Staff.
5. A valid PIN permits the Staff user to confirm cancellation.
6. An invalid PIN leaves the order unchanged and records the failed authorization attempt.

Cancellation rules:

- Admin users can cancel directly after confirmation and a required reason.
- Staff users cannot bypass the Admin PIN prompt.
- The prototype stores an encoded or hashed PIN representation rather than displaying the PIN in readable application state.
- Repeated invalid attempts are rate-limited within the prototype session.
- Cancellation records the initiating Staff user, authorizing Admin identity, reason, time, and order state at cancellation.
- The application creates a simulated refund state.
- If preparation has not started, purchased and complimentary inventory is restored.
- If preparation has started, the authorization flow requires an explicit choice for whether each affected item can return to stock.
- Cancelled tokens are never reused.
- The customer tracking view is updated with the Cancelled and simulated refund states.
- The cancellation operation is idempotent and cannot restore inventory or issue a refund more than once.

Required progression:

```text
Payment confirmed
→ Order received
→ Preparing
→ Ready
→ Delivered
```

Cancellation is an audited terminal branch from any non-Delivered active state.

### 5.6 Menu and category management

Only Admin can manage the permanent menu structure and pricing.

#### Menu item capabilities

Admin can:

- Create, edit, archive, and restore menu items
- Upload or select item images
- Set item name and description
- Set base price and tax category
- Set vegetarian or non-vegetarian dietary type
- Configure sizes and price adjustments
- Configure spice levels
- Configure add-ons and their prices
- Set preparation-time estimates
- Set initial stock and a low-stock threshold
- Mark an item Available, Sold Out, or Hidden
- Preview an item before publishing
- Duplicate an existing item
- Search and filter menu items
- Save items as drafts before publishing

#### Category capabilities

Admin can:

- Create categories
- Rename categories
- Reorder categories
- Archive categories
- Assign and move menu items between categories

Removing or archiving a category requires its active items to be moved or archived.

#### Item publishing and availability states

```text
Draft → Published → Hidden → Archived
                    ↕
                  Sold Out
```

Sold Out is a temporary availability condition, not a permanent publishing state. Staff can change stock and temporary Sold Out/Available states but cannot change the permanent publishing state.

#### Menu validation and history rules

- Item name, price, category, and image are required before publishing.
- Prices and price adjustments cannot be negative.
- Customization option names must be unique within an item.
- Archived items remain represented in historical order records.
- An item referenced by an active or historical order cannot be permanently deleted.
- Only Admin can create items, delete drafts, change prices, or change customization definitions.
- Price and menu changes apply to new cart additions and do not alter paid orders.
- Existing unpaid customer carts are revalidated when prices, options, or availability change.
- Customer views receive menu changes through Local Storage and browser storage-event synchronization.

### 5.7 Inventory control

Admin and Staff can view:

- Item name and category
- Current stock quantity
- Low-stock threshold
- Available, Low Stock, Sold Out, or Emergency Cutoff state
- Reward-item designation
- Last update time
- Last updating user

Permitted stock operations:

- Increase stock after replenishment
- Decrease stock after waste or correction
- Enter an exact stock value
- Add an optional adjustment reason
- Apply reviewed bulk stock updates

Stock cannot fall below zero. Every inventory action produces the audit record defined in section 5.3.

#### Automatic inventory behavior

- Successful payment deducts purchased inventory.
- Issuing a complimentary reward deducts reward inventory.
- Failed or cancelled payment does not deduct inventory.
- Authorized cancellation restores inventory according to section 5.5.
- Stock reaching zero immediately sets the item to Sold Out.
- Stock rising above zero returns the item to Available unless an emergency cutoff is active or the item is Hidden/Archived.
- Customer carts revalidate after inventory changes.
- Paid orders retain their allocated items when later stock reaches zero.

#### Low-stock alerts

- Admin configures a low-stock threshold per item.
- Stock at or below the threshold produces a Low Stock alert.
- Zero stock produces a Sold Out alert.
- Alerts appear on the dashboard and inventory view.
- Restocking above the threshold resolves the alert automatically.

#### Emergency cutoff

Admin and Staff can stop an item from selling without changing its recorded stock. Activating an emergency cutoff requires a reason and records the acting user and timestamp.

While active:

- The item appears Sold Out to customers.
- The stock quantity remains unchanged.
- Existing paid orders remain active.
- Removing the cutoff restores Available only when stock is above zero and the item remains Published.

#### Reward inventory

- The primary complimentary beverage and fallback side are identified in inventory.
- The dashboard warns when either reward item is low or unavailable.
- The fallback is used when the primary reward is unavailable.
- When both are unavailable, the eligible win is flagged for a manual Staff alternative.
- Staff cannot replace or remove a paid item without Admin PIN authorization.

#### Concurrent inventory changes

Before saving an inventory change, the application compares the currently stored value with the value originally loaded. If another tab changed the record, the application displays the latest value and requires the user to review and resubmit. Inventory lists synchronize using browser storage events.

Required filters:

- All items
- Low stock
- Sold out
- Emergency cutoff
- Reward items
- Recently updated

### 5.8 Staff account administration

Admin can:

- Create a Staff account
- Assign name, Staff ID, email, and password
- Reset a Staff password
- Activate or deactivate a Staff account
- Review last login and current account state
- Review Staff operational activity

Rules:

- Staff IDs and emails must be unique within the restaurant.
- A deactivated account cannot start a new session.
- Deactivation does not remove historical activity records.
- The application must not expose stored passwords in the UI.
- Staff cannot create accounts, change roles, or access account administration.
- The prototype has one Admin role per configured Admin account and does not allow Staff privilege escalation.

### 5.9 Order history and Admin reports

#### Shared current-session history

Admin and Staff can view orders completed or cancelled in the current operating session. The view supports search by token or order number and filters by status, order type, and time.

#### Admin historical access

Admin can view all retained orders and filter by:

- Date or date range
- Delivered or Cancelled status
- Dine-in or takeaway
- Payment state
- Token or order number
- Customer name or mobile number
- Complimentary reward issued
- Acting Staff member

Each record preserves its order snapshot, payment details, reward, cancellation/refund information, and activity timeline.

#### Prototype reporting

Admin reports include:

- Total sales
- Total paid orders
- Delivered and cancelled order counts
- Average order value
- Average preparation time
- Average ready-to-delivery time
- Delayed order count
- Payment success, failure, cancellation, and pending counts
- Top-selling items
- Low-stock and sold-out items
- Complimentary rewards issued
- Staff fulfillment activity

Reports can be filtered by current session or selected date range. Values are calculated from stored prototype data and must not be presented as production-grade accounting records.

### 5.10 Restaurant profile and operational preferences

Admin can configure:

- Restaurant name and identifier
- Logo and contact details
- Address
- Operating status: Open or Closed
- Operating hours
- Dine-in and takeaway availability
- Currency display, fixed to INR for the initial prototype
- Configurable tax percentage
- Default preparation estimate
- Warning and delayed-order thresholds
- Token sequence starting value, defaulting to `100`
- Primary and fallback Tic-Tac-Toe rewards
- Admin authorization PIN
- Local auto-save behavior

Rules:

- Closing the restaurant prevents new customer orders but does not remove active orders.
- Changing tax or prices affects new checkout calculations, not paid orders.
- Token changes cannot cause reuse of an existing token within retained restaurant data.
- Changing reward configuration does not alter already-issued rewards.
- Sensitive settings such as the Admin PIN require confirmation before replacement.

### 5.11 Data persistence, backup, import, and export

Local Storage is the prototype's primary data store. The application persists:

- Restaurant configuration
- User accounts and sessions
- Menu and categories
- Inventory and audit history
- Customers required for prototype flows
- Carts
- Payments
- Orders, tokens, and timelines
- Game attempts and rewards
- Alerts and operating-session data

#### Auto-save

- State-changing actions save immediately.
- Saved data includes a schema version and last-updated timestamp.
- The UI indicates successful save or a recoverable save failure.
- Cross-tab updates use browser storage events.
- An optional automatic JSON snapshot can be configured within browser-supported prototype limitations.

#### JSON export

Admin can download an export containing the selected restaurant's complete prototype state. The export includes:

- Schema version
- Export timestamp
- Restaurant identifier
- Data collections
- Integrity metadata sufficient for prototype validation

#### JSON import

Import is Admin-only and follows this flow:

1. Select a JSON file.
2. Parse without changing current state.
3. Validate schema version, required collections, identifiers, and data types.
4. Display a summary of records and validation warnings.
5. Create a pre-import backup.
6. Require explicit confirmation.
7. Replace or merge data according to the selected supported import mode.
8. Report success or roll back to the pre-import state on failure.

The initial prototype must support full replacement. Merge can be included only if identity conflicts can be handled safely.

#### Backup management

Admin can:

- Create a named manual snapshot
- View snapshot timestamp and size
- Restore a snapshot after confirmation
- Download a snapshot as JSON
- Purge one or all snapshots after confirmation

Purging backups does not purge active application state.

#### Prototype reset

- Reset is Admin-only.
- Reset requires the Admin password or authorization PIN plus typed confirmation.
- A final downloadable backup is offered before reset.
- The reset scope is shown clearly.
- Reset restores seeded prototype data and records a local reset event where possible.

### 5.12 Help and FAQ

The restaurant Help view provides searchable, categorized guidance for:

- Signing in and role permissions
- Reading the token queue
- Accepting and preparing orders
- Marking orders Ready or Delivered
- Identifying delayed orders
- Payment verification
- Cancelling with Admin PIN
- Inventory replenishment
- Emergency cutoffs
- Game reward handling
- Menu management
- Staff account management
- JSON export, import, restore, and purge
- Local Storage limitations and recovery

Help content must distinguish Admin-only actions from Staff actions and provide links back to the relevant application view.

### 5.13 Storefront alerts and error handling

Required recoverable states include:

- Invalid or expired restaurant session
- Unauthorized route access
- Deactivated Staff account
- No active orders
- Conflicting status change from another tab
- Invalid status transition
- Payment record missing or not successful
- Inventory conflict or invalid quantity
- Reward unavailable
- Incorrect or rate-limited Admin PIN
- Import schema failure
- Backup creation or restoration failure
- Local Storage unavailable, full, or corrupted
- Restaurant configuration missing
- General not-found state

Errors must explain what happened, preserve safe current data, and provide an appropriate retry, reload, correction, or return action. The system must not silently discard orders, inventory changes, or imported data.

### 5.14 Restaurant/storefront screens

The restaurant experience requires these views or SPA routes:

1. Restaurant login
2. Operational dashboard
3. Live order queue
4. Order details and activity timeline
5. Current-session completed orders
6. Full order history for Admin
7. Inventory control
8. Inventory activity history for Admin
9. Menu item list
10. Menu item editor and preview
11. Category management
12. Staff account management
13. Admin reports
14. Restaurant profile and preferences
15. Game reward configuration
16. Backup, import, export, and reset
17. Help and FAQ
18. Unauthorized, not-found, and recoverable error views

Navigation is role-aware and does not display inaccessible Admin routes to Staff.

### 5.15 Restaurant acceptance journeys

#### Staff fulfillment journey

```text
Sign in as Staff
→ View chronological live queue
→ Accept the oldest paid order
→ Review items, customizations, and reward
→ Start preparation
→ Mark the complete order Ready
→ Customer receives notification
→ Verify token or table
→ Mark Delivered
→ Order moves to current-session history
```

#### Staff inventory journey

```text
Open inventory
→ Search or filter an item
→ Replenish, correct, or activate emergency cutoff
→ Enter an optional reason
→ Save after conflict validation
→ Customer availability and dashboard alerts update
→ Audit record identifies the Staff user and change
```

#### Staff cancellation journey

```text
Open active order
→ Request Cancellation
→ Enter reason
→ Admin enters protected authorization PIN
→ Confirm stock-restoration choices when required
→ Simulated refund and cancellation are recorded once
→ Customer tracking updates
→ Token remains retired
```

#### Admin management journey

```text
Sign in as Admin
→ Review operational metrics and alerts
→ Manage menu, inventory, rewards, and Staff
→ Review order history, audit activity, and reports
→ Configure restaurant preferences
→ Export or back up validated prototype state
```

#### Data recovery journey

```text
Open data preferences
→ Select JSON import or stored backup
→ Validate without mutating active state
→ Review summary and warnings
→ Create pre-change backup
→ Confirm operation
→ Complete successfully or roll back safely
```

## 6. Shared System Rules

### 6.1 Source of truth

- Menu, inventory, customer, payment, order, token, reward, and restaurant state use stable unique identifiers.
- Paid orders store immutable snapshots of names, prices, taxes, and customizations.
- Derived totals and reports are recalculated from validated records.
- State mutations are idempotent where duplicate invocation could affect payment, stock, tokens, rewards, cancellation, or restoration.

### 6.2 Cross-view continuity

- Customer and restaurant views share the same versioned Local Storage state model.
- Browser storage events synchronize relevant updates across tabs.
- Each mutation includes an updated timestamp and, where needed, a revision value for conflict detection.
- A user-facing refresh/retry path exists when synchronization fails.

### 6.3 Accessibility and responsive behavior

- All primary actions are keyboard accessible.
- Controls have visible focus states and accessible labels.
- Status and availability are not communicated by color alone.
- Text and controls maintain readable contrast.
- Dialogs manage focus and can be dismissed safely where dismissal is permitted.
- Customer and storefront views work on mobile, tablet, and desktop.
- Touch targets are appropriately sized for restaurant and customer mobile use.

### 6.4 Prototype limitations

- Authentication, UPI payment, refunds, notifications, and file continuity are simulations.
- Local Storage is browser- and device-specific and is not a production database.
- Cross-device real-time synchronization is not provided.
- The Play CDN and browser-based Tailwind setup are intended for prototyping, not production deployment.
- Security-sensitive values stored client-side cannot provide production-grade protection.

## 7. Complete Prototype Definition of Done

The prototype is complete when:

- The approved inspiration theme is applied consistently.
- Customer and restaurant experiences are separated into their approved folders.
- Root login and sign-up wrappers route users correctly.
- Guest and signed-in customer journeys work with persistent state.
- Menu, customization, cart, inventory checks, checkout, and payment simulation work end to end.
- Successful payment creates exactly one order and sequential restaurant token.
- Restaurant users can fulfill the order through the approved status sequence.
- Customer tracking reflects restaurant status changes.
- Tic-Tac-Toe works for guests and eligible signed-in customers.
- An eligible win issues at most one in-stock current-order reward.
- Admin and Staff permissions are enforced in navigation and actions.
- Staff cancellation requires valid Admin PIN authorization.
- Menu, inventory, alerts, history, reports, Staff accounts, and preferences follow the approved rules.
- JSON export, validated import, backup, restoration, purge, and reset flows behave safely.
- Required empty, failure, conflict, and recovery states are represented.
- The application remains usable across supported responsive sizes and keyboard interaction.
