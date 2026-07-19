(function createAutoCodeState(global) {
  "use strict";

  const STORAGE_KEY = "autocode.prototype.state";
  const SCHEMA_VERSION = 13;
  const listeners = new Set();

  const now = () => new Date().toISOString();
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const createAdministrativeToken = () => String(Math.floor(100000 + Math.random() * 900000));
  const nextLocalMidnight = () => { const date = new Date(); date.setHours(24, 0, 0, 0); return date.toISOString(); };

  function sampleHistory() {
    const start = new Date(); start.setHours(0, 1, 0, 0);
    const at = (minutesAgo) => new Date(Math.max(Date.now() - minutesAgo * 60000, start.getTime())).toISOString();
    const item = (itemId, name, quantity, unitPrice, options) => ({ itemId, name, quantity, unitPrice, lineTotal: unitPrice * quantity, sizeId: "regular", sizeName: "Regular", spiceLevel: options?.spiceLevel || "", addOns: [], instructions: "", ...(options || {}) });
    const burger = item("item_burger", "Classic Veg Burger", 1, 189, { spiceLevel: "Medium" });
    const reward = item("item_cold_coffee", "Cold Coffee", 1, 0, { rewardSource: "tic_tac_toe", rewardIssuedAt: at(152) });
    const fries = item("item_fries", "Seasoned Fries", 2, 99, { spiceLevel: "Peri Peri" });
    const brownie = item("item_brownie", "Chocolate Brownie", 1, 119);
    const paidSnapshot = (items, subtotal, tax, total, capturedAt) => ({ items: clone(items), subtotal, tax, taxPercent: 5, total, capturedAt });
    const staffEvent = (type, label, timestamp) => ({ type, label, at: timestamp, actor: "staff_demo", actorName: "Demo Staff" });
    const orders = [
      { id: "order_sample_100", restaurantId: "rest_autoserve_demo", customerId: "customer_demo", customerName: "Demo Customer", mobile: "9000000001", orderType: "dine-in", serviceMode: "table-service", tableNumber: "T03", orderNotes: "No onion in the burger", token: "100", kotNumber: "0001", kotStatus: "served", status: "delivered", paymentStatus: "success", paymentId: "payment_sample_100", transactionId: "SIM-UPI-100", items: [burger, reward], paidSnapshot: paidSnapshot([burger], 189, 9.45, 198.45, at(165)), subtotal: 189, tax: 9.45, taxPercent: 5, total: 198.45, estimatedMinutes: 12, inventoryModel: "availability", createdAt: at(165), preparingAt: at(158), readyAt: at(149), deliveredAt: at(144), updatedAt: at(144), timeline: [{ type: "order_created", label: "Paid order created", at: at(165), actor: "customer_demo", actorName: "Demo Customer" }, { type: "payment_confirmed", label: "Payment confirmed", at: at(164), actor: "system", actorName: "System" }, staffEvent("order_received", "Order accepted", at(160)), staffEvent("preparing", "Preparation started", at(158)), { type: "reward_issued", label: "Cold Coffee reward added", at: at(152), actor: "customer_demo", actorName: "Demo Customer" }, staffEvent("ready", "Order marked Ready", at(149)), staffEvent("delivered", "Table delivery confirmed", at(144))] },
      { id: "order_sample_101", restaurantId: "rest_autoserve_demo", customerId: "guest_sample", customerName: "Walk-in Guest", mobile: "9000000012", orderType: "takeaway", serviceMode: "self-service", tableNumber: "", orderNotes: "", token: "101", kotNumber: "0002", kotStatus: "served", status: "delivered", paymentStatus: "success", paymentId: "payment_sample_101", transactionId: "SIM-UPI-101", items: [fries], paidSnapshot: paidSnapshot([fries], 198, 9.9, 207.9, at(105)), subtotal: 198, tax: 9.9, taxPercent: 5, total: 207.9, estimatedMinutes: 6, inventoryModel: "availability", createdAt: at(105), preparingAt: at(99), readyAt: at(92), deliveredAt: at(84), updatedAt: at(84), timeline: [{ type: "order_created", label: "Paid order created", at: at(105), actor: "guest", actorName: "Walk-in Guest" }, { type: "payment_confirmed", label: "Payment confirmed", at: at(104), actor: "system", actorName: "System" }, staffEvent("order_received", "Order accepted", at(101)), staffEvent("preparing", "Preparation started", at(99)), staffEvent("ready", "Pickup token marked Ready", at(92)), staffEvent("delivered", "Counter collection confirmed", at(84))] },
      { id: "order_sample_102", restaurantId: "rest_autoserve_demo", customerId: "customer_demo", customerName: "Demo Customer", mobile: "9000000001", orderType: "dine-in", serviceMode: "table-service", tableNumber: "T03", orderNotes: "", token: "102", kotNumber: "0003", kotStatus: "cancelled", status: "cancelled", paymentStatus: "refunded", paymentId: "payment_sample_102", transactionId: "SIM-UPI-102", items: [brownie], paidSnapshot: paidSnapshot([brownie], 119, 5.95, 124.95, at(48)), subtotal: 119, tax: 5.95, taxPercent: 5, total: 124.95, estimatedMinutes: 5, inventoryModel: "availability", createdAt: at(48), cancelledAt: at(42), updatedAt: at(42), cancelledBy: "staff_demo", cancellation: { id: "cancel_sample_102", reasonType: "item_unavailable", reason: "Brownie batch was unavailable after the order was placed", requestedBy: "staff_demo", requestedByName: "Demo Staff", authorizedBy: "admin_demo", authorizedByName: "Demo Admin", statusAtCancellation: "payment_confirmed", restoredItems: [], at: at(42) }, refund: { id: "refund_sample_102", status: "refunded", mode: "simulated", amount: 124.95, transactionId: "SIM-REF-102", createdAt: at(42) }, timeline: [{ type: "order_created", label: "Paid order created", at: at(48), actor: "customer_demo", actorName: "Demo Customer" }, { type: "payment_confirmed", label: "Payment confirmed", at: at(47), actor: "system", actorName: "System" }, staffEvent("cancellation_requested", "Cancellation requested: item unavailable", at(43)), { type: "cancellation_authorized", label: "Cancellation authorized by Demo Admin", at: at(42), actor: "admin_demo", actorName: "Demo Admin" }, { type: "refund_created", label: "Simulated refund created", at: at(42), actor: "system", actorName: "System" }] }
    ];
    const payments = [
      { id: "payment_sample_100", attemptId: "attempt_sample_100", restaurantId: "rest_autoserve_demo", customerId: "customer_demo", orderId: "order_sample_100", amount: 198.45, method: "upi-id", upiId: "demo@upi", status: "success", transactionId: "SIM-UPI-100", createdAt: at(165), updatedAt: at(164) },
      { id: "payment_sample_101", attemptId: "attempt_sample_101", restaurantId: "rest_autoserve_demo", customerId: "guest_sample", orderId: "order_sample_101", amount: 207.9, method: "upi-qr", status: "success", transactionId: "SIM-UPI-101", createdAt: at(105), updatedAt: at(104) },
      { id: "payment_sample_102", attemptId: "attempt_sample_102", restaurantId: "rest_autoserve_demo", customerId: "customer_demo", orderId: "order_sample_102", amount: 124.95, method: "upi-id", upiId: "demo@upi", status: "refunded", transactionId: "SIM-UPI-102", refundId: "refund_sample_102", refundedAt: at(42), createdAt: at(48), updatedAt: at(42) }
    ];
    return { orders, payments, authorizationAttempts: [{ id: "auth_sample_102", restaurantId: "rest_autoserve_demo", orderId: "order_sample_102", actorId: "staff_demo", actorName: "Demo Staff", authorizerId: "admin_demo", authorizerName: "Demo Admin", action: "order_cancellation", success: true, reason: "item_unavailable", at: at(42) }], gameAttempts: [{ id: "game_sample_100", restaurantId: "rest_autoserve_demo", customerId: "customer_demo", orderId: "order_sample_100", rewardEligible: true, result: "win", rewardStatus: "issued", rewardItemId: "item_cold_coffee", board: ["X", "O", "", "X", "O", "", "X", "", ""], createdAt: at(155), completedAt: at(152), updatedAt: at(152) }] };
  }

  function seedState() {
    const createdAt = now();
    const samples = sampleHistory();

    return {
      schemaVersion: SCHEMA_VERSION,
      revision: 1,
      createdAt,
      updatedAt: createdAt,
      activeSession: null,
      restaurants: [
        {
          id: "rest_autoserve_demo",
          slug: "autoserve-demo",
          name: "Autoserve Demo Kitchen",
          status: "open",
          approvalStatus: "approved",
          currency: "INR",
          taxPercent: 5,
          dineInEnabled: true,
          takeawayEnabled: true,
          dineInServiceMode: "both",
          tableNumbers: ["T01", "T02", "T03", "T04", "T05", "T06"],
          brandLogoPath: "assets/images/branding/demo-kitchen-logo.jpg",
          complaintPhone: "+91 90000 00999",
          qrGuestMessage: "Scan to view the menu and place your order",
          combosEnabled: true,
          comboSectionTitle: "Popular meal combos",
          featuredCombo: { id: "combo_signature", name: "Autoserve Signature Combo", itemIds: ["item_burger", "item_fries", "item_cold_coffee"], price: 349, active: true },
          combos: [{ id: "combo_signature", name: "Autoserve Signature Combo", itemIds: ["item_burger", "item_fries", "item_cold_coffee"], price: 349, active: true }, { id: "combo_snack", name: "Snack & Sip", itemIds: ["item_fries", "item_cold_coffee"], price: 199, active: true }, { id: "combo_sweet", name: "Coffee & Brownie Break", itemIds: ["item_cold_coffee", "item_brownie"], price: 219, active: true }],
          administrativeToken: createAdministrativeToken(),
          administrativeTokenExpiresAt: nextLocalMidnight(),
          tokenStart: 100,
          nextToken: 103,
          nextKot: 4,
          lowStockDefault: 5,
          primaryRewardItemId: "item_cold_coffee",
          fallbackRewardItemId: "item_fries",
          createdAt,
          updatedAt: createdAt
        }
      ],
      users: [
        {
          id: "super_admin_demo",
          role: "super_admin",
          name: "Demo Super Admin",
          username: "superadmin",
          email: "superadmin@autoserve.demo",
          password: "SuperAdmin@123",
          active: true,
          createdAt
        },
        {
          id: "customer_demo",
          role: "customer",
          name: "Demo Customer",
          email: "customer@autoserve.demo",
          mobile: "9000000001",
          password: "Customer@123",
          active: true,
          createdAt
        },
        {
          id: "admin_demo",
          restaurantId: "rest_autoserve_demo",
          role: "admin",
          name: "Demo Admin",
          email: "admin@autoserve.demo",
          password: "Admin@123",
          adminPinHash: "a1fb4e703a9ef1fa4936801721ff285a97ac85330856674412e054892afe6972",
          active: true,
          createdAt
        },
        {
          id: "staff_demo",
          restaurantId: "rest_autoserve_demo",
          role: "staff",
          name: "Demo Staff",
          staffId: "STF001",
          email: "staff@autoserve.demo",
          password: "Staff@123",
          active: true,
          createdAt
        }
      ],
      categories: [
        { id: "cat_main", restaurantId: "rest_autoserve_demo", name: "Main Course", order: 1, status: "published" },
        { id: "cat_snacks", restaurantId: "rest_autoserve_demo", name: "Snacks", order: 2, status: "published" },
        { id: "cat_sides", restaurantId: "rest_autoserve_demo", name: "Sides", order: 3, status: "published" },
        { id: "cat_beverages", restaurantId: "rest_autoserve_demo", name: "Beverages", order: 4, status: "published" },
        { id: "cat_desserts", restaurantId: "rest_autoserve_demo", name: "Desserts", order: 5, status: "published" }
      ],
      menuItems: [
        {
          id: "item_burger",
          restaurantId: "rest_autoserve_demo",
          categoryId: "cat_main",
          name: "Classic Veg Burger",
          description: "Grilled vegetable patty, crisp lettuce, tomato, and house sauce.",
          price: 189,
          dietary: "vegetarian",
          stock: 18,
          lowStockThreshold: 5,
          status: "published",
          availabilityStatus: "available",
          emergencyCutoff: false,
          preparationMinutes: 12,
          icon: "🍔",
          imagePath: "assets/images/menu/classic-veg-burger.jpg",
          sizes: [
            { id: "regular", name: "Regular", priceAdjustment: 0 },
            { id: "large", name: "Large", priceAdjustment: 60 }
          ],
          spiceLevels: ["Mild", "Medium", "Hot"],
          addOns: [
            { id: "extra_cheese", name: "Extra cheese", price: 35 },
            { id: "extra_patty", name: "Extra patty", price: 65 }
          ],
          updatedAt: createdAt
        },
        {
          id: "item_fries",
          restaurantId: "rest_autoserve_demo",
          categoryId: "cat_sides",
          name: "Seasoned Fries",
          description: "Crisp fries finished with the Autoserve spice blend.",
          price: 99,
          dietary: "vegetarian",
          stock: 24,
          lowStockThreshold: 6,
          status: "published",
          availabilityStatus: "available",
          emergencyCutoff: false,
          preparationMinutes: 6,
          icon: "🍟",
          imagePath: "assets/images/menu/seasoned-fries.jpg",
          sizes: [
            { id: "regular", name: "Regular", priceAdjustment: 0 },
            { id: "large", name: "Large", priceAdjustment: 45 }
          ],
          spiceLevels: ["Classic", "Peri Peri"],
          addOns: [
            { id: "cheese_dip", name: "Cheese dip", price: 30 }
          ],
          isRewardFallback: true,
          updatedAt: createdAt
        },
        {
          id: "item_cold_coffee",
          restaurantId: "rest_autoserve_demo",
          categoryId: "cat_beverages",
          name: "Cold Coffee",
          description: "Chilled coffee blended until smooth and creamy.",
          price: 129,
          dietary: "vegetarian",
          stock: 15,
          lowStockThreshold: 5,
          status: "published",
          availabilityStatus: "available",
          emergencyCutoff: false,
          preparationMinutes: 4,
          icon: "🥤",
          imagePath: "assets/images/menu/cold-coffee.jpg",
          sizes: [
            { id: "regular", name: "Regular", priceAdjustment: 0 },
            { id: "large", name: "Large", priceAdjustment: 40 }
          ],
          spiceLevels: [],
          addOns: [
            { id: "extra_shot", name: "Extra coffee shot", price: 30 },
            { id: "ice_cream", name: "Vanilla ice cream", price: 45 }
          ],
          isRewardPrimary: true,
          updatedAt: createdAt
        },
        {
          id: "item_brownie",
          restaurantId: "rest_autoserve_demo",
          categoryId: "cat_desserts",
          name: "Chocolate Brownie",
          description: "Warm chocolate brownie with a soft centre.",
          price: 119,
          dietary: "vegetarian",
          stock: 8,
          lowStockThreshold: 3,
          status: "published",
          availabilityStatus: "available",
          emergencyCutoff: false,
          preparationMinutes: 5,
          icon: "🍫",
          imagePath: "assets/images/menu/chocolate-brownie.jpg",
          sizes: [{ id: "regular", name: "Regular", priceAdjustment: 0 }],
          spiceLevels: [],
          addOns: [
            { id: "ice_cream", name: "Vanilla ice cream", price: 45 }
          ],
          updatedAt: createdAt
        }
      ],
      carts: [],
      payments: samples.payments,
      orders: samples.orders,
      inventoryAudit: [],
      gameAttempts: samples.gameAttempts,
      authorizationAttempts: samples.authorizationAttempts,
      backups: [],
      alerts: []
    };
  }

  function validateShape(state) {
    if (!state || typeof state !== "object") throw new Error("Application state is missing.");
    if (!Number.isInteger(state.schemaVersion)) throw new Error("State schema version is invalid.");
    if (!Array.isArray(state.users) || !Array.isArray(state.restaurants)) throw new Error("Core state collections are invalid.");
    return state;
  }

  function migrate(state) {
    validateShape(state);
    if (state.schemaVersion > SCHEMA_VERSION) {
      throw new Error("This data was created by a newer prototype version.");
    }
    if (state.schemaVersion === 1) {
      const defaults = {
        item_burger: { icon: "🍔", sizes: [{ id: "regular", name: "Regular", priceAdjustment: 0 }, { id: "large", name: "Large", priceAdjustment: 60 }], spiceLevels: ["Mild", "Medium", "Hot"], addOns: [{ id: "extra_cheese", name: "Extra cheese", price: 35 }, { id: "extra_patty", name: "Extra patty", price: 65 }] },
        item_fries: { icon: "🍟", sizes: [{ id: "regular", name: "Regular", priceAdjustment: 0 }, { id: "large", name: "Large", priceAdjustment: 45 }], spiceLevels: ["Classic", "Peri Peri"], addOns: [{ id: "cheese_dip", name: "Cheese dip", price: 30 }] },
        item_cold_coffee: { icon: "🥤", sizes: [{ id: "regular", name: "Regular", priceAdjustment: 0 }, { id: "large", name: "Large", priceAdjustment: 40 }], spiceLevels: [], addOns: [{ id: "extra_shot", name: "Extra coffee shot", price: 30 }, { id: "ice_cream", name: "Vanilla ice cream", price: 45 }] },
        item_brownie: { icon: "🍫", sizes: [{ id: "regular", name: "Regular", priceAdjustment: 0 }], spiceLevels: [], addOns: [{ id: "ice_cream", name: "Vanilla ice cream", price: 45 }] }
      };
      state.menuItems.forEach((item) => Object.assign(item, defaults[item.id] || { icon: "🍽️", sizes: [{ id: "regular", name: "Regular", priceAdjustment: 0 }], spiceLevels: [], addOns: [] }));
      state.schemaVersion = 2;
    }
    if (state.schemaVersion === 2) {
      state.restaurants.forEach((restaurant) => { restaurant.nextKot = Number(restaurant.nextKot || 1); });
      state.menuItems.forEach((item) => {
        item.availabilityStatus = item.availabilityStatus || (item.emergencyCutoff || item.status === "sold-out" || item.stock === 0 ? "unavailable" : "available");
      });
      state.orders.forEach((order, index) => {
        order.kotNumber ||= String(index + 1).padStart(4, "0");
        order.kotStatus ||= order.status === "delivered" ? "served" : order.status === "ready" ? "ready" : order.status === "preparing" ? "preparing" : "new";
      });
      state.schemaVersion = 3;
    }
    if (state.schemaVersion === 3) {
      state.restaurants.forEach((restaurant) => {
        restaurant.dineInEnabled ??= true;
        restaurant.takeawayEnabled ??= true;
        restaurant.dineInServiceMode ||= "both";
        restaurant.tableNumbers ||= ["T01", "T02", "T03", "T04", "T05", "T06"];
      });
      state.schemaVersion = 4;
    }
    if (state.schemaVersion === 4) {
      const menuImages = {
        item_burger: "assets/images/menu/classic-veg-burger.jpg",
        item_fries: "assets/images/menu/seasoned-fries.jpg",
        item_cold_coffee: "assets/images/menu/cold-coffee.jpg",
        item_brownie: "assets/images/menu/chocolate-brownie.jpg"
      };
      state.menuItems.forEach((item) => { item.imagePath ||= menuImages[item.id] || null; });
      state.schemaVersion = 5;
    }
    if (state.schemaVersion === 5) {
      state.restaurants.forEach((restaurant) => {
        restaurant.brandLogoPath ||= "assets/images/branding/demo-kitchen-logo.jpg";
        restaurant.complaintPhone ||= restaurant.contactPhone || "+91 90000 00999";
        restaurant.qrGuestMessage ||= "Scan to view the menu and place your order";
      });
      state.schemaVersion = 6;
    }
    if (state.schemaVersion === 6) {
      state.restaurants.forEach((restaurant) => {
        restaurant.administrativeToken ||= createAdministrativeToken();
        restaurant.administrativeTokenExpiresAt ||= nextLocalMidnight();
      });
      state.schemaVersion = 7;
    }
    if (state.schemaVersion === 7) {
      if (!state.orders.some((order) => ["delivered", "cancelled"].includes(order.status))) {
        const samples = sampleHistory();
        state.orders.push(...samples.orders);
        state.payments.push(...samples.payments);
        state.gameAttempts.push(...samples.gameAttempts);
        state.authorizationAttempts = [...(state.authorizationAttempts || []), ...samples.authorizationAttempts];
        state.restaurants.forEach((restaurant) => { restaurant.nextToken = Math.max(Number(restaurant.nextToken || 100), 103); restaurant.nextKot = Math.max(Number(restaurant.nextKot || 1), 4); });
      }
      state.schemaVersion = 8;
    }
    if (state.schemaVersion === 8) {
      if (!state.orders.some((order) => ["delivered", "cancelled"].includes(order.status))) {
        const samples = sampleHistory();
        const maxToken = state.orders.reduce((maximum, order) => Math.max(maximum, Number(order.token) || 0), 99);
        const maxKot = state.orders.reduce((maximum, order) => Math.max(maximum, Number(order.kotNumber) || 0), 0);
        samples.orders.forEach((order, index) => { order.token = String(maxToken + index + 1).padStart(3, "0"); order.kotNumber = String(maxKot + index + 1).padStart(4, "0"); });
        state.orders.push(...samples.orders);
        samples.payments.forEach((payment) => { if (!state.payments.some((entry) => entry.id === payment.id)) state.payments.push(payment); });
        samples.gameAttempts.forEach((attempt) => { if (!state.gameAttempts.some((entry) => entry.id === attempt.id)) state.gameAttempts.push(attempt); });
        state.authorizationAttempts = [...(state.authorizationAttempts || []), ...samples.authorizationAttempts.filter((attempt) => !(state.authorizationAttempts || []).some((entry) => entry.id === attempt.id))];
        state.restaurants.forEach((restaurant) => { restaurant.nextToken = Math.max(Number(restaurant.nextToken || 100), maxToken + 4); restaurant.nextKot = Math.max(Number(restaurant.nextKot || 1), maxKot + 4); });
      }
      state.schemaVersion = 9;
    }
    if (state.schemaVersion === 9) {
      state.restaurants.forEach((restaurant) => {
        restaurant.combosEnabled ??= true;
        restaurant.comboSectionTitle ||= "Popular meal combos";
        restaurant.featuredCombo ||= { id: "combo_signature", name: "Autoserve Signature Combo", itemIds: ["item_burger", "item_fries", "item_cold_coffee"], price: 349, active: true };
      });
      state.schemaVersion = 10;
    }
    if (state.schemaVersion === 10) {
      state.restaurants.forEach((restaurant) => {
        restaurant.combos ||= [restaurant.featuredCombo, { id: "combo_snack", name: "Snack & Sip", itemIds: ["item_fries", "item_cold_coffee"], price: 199, active: true }, { id: "combo_sweet", name: "Coffee & Brownie Break", itemIds: ["item_cold_coffee", "item_brownie"], price: 219, active: true }].filter(Boolean);
      });
      state.schemaVersion = 11;
    }
    if (state.schemaVersion === 11) {
      if (!state.users.some((user) => user.role === "super_admin")) state.users.unshift({ id: "super_admin_demo", role: "super_admin", name: "Demo Super Admin", username: "superadmin", email: "superadmin@autoserve.demo", password: "SuperAdmin@123", active: true, createdAt: now() });
      state.schemaVersion = 12;
    }
    if (state.schemaVersion === 12) {
      state.restaurants.forEach((restaurant) => { restaurant.approvalStatus ||= restaurant.id === "rest_autoserve_demo" ? "approved" : "pending"; if (restaurant.approvalStatus === "approved") restaurant.approvedAt ||= now(); });
      state.schemaVersion = 13;
    }
    if (state.schemaVersion < SCHEMA_VERSION) throw new Error("No migration is available for this prototype data.");
    return state;
  }

  function read() {
    let raw;
    try {
      raw = global.localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      const wrapped = new Error("Browser storage is unavailable. Allow local storage and try again.");
      wrapped.cause = error;
      throw wrapped;
    }
    if (!raw) {
      const seeded = seedState();
      try {
        global.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      } catch (error) {
        const wrapped = new Error("Browser storage is unavailable or full. Prototype data could not be initialized.");
        wrapped.cause = error;
        throw wrapped;
      }
      return clone(seeded);
    }

    try {
      return clone(migrate(JSON.parse(raw)));
    } catch (error) {
      const wrapped = new Error("Stored prototype data could not be loaded safely.");
      wrapped.cause = error;
      throw wrapped;
    }
  }

  function write(nextState, reason) {
    const validated = validateShape(clone(nextState));
    validated.schemaVersion = SCHEMA_VERSION;
    validated.revision = Number(validated.revision || 0) + 1;
    validated.updatedAt = now();
    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(validated));
    } catch (error) {
      const wrapped = new Error(error?.name === "QuotaExceededError" ? "Browser storage is full. Export or remove backups before trying again." : "Browser storage is unavailable. No changes were saved.");
      wrapped.cause = error;
      throw wrapped;
    }
    listeners.forEach((listener) => listener(clone(validated), { source: "local", reason: reason || "update" }));
    return clone(validated);
  }

  function update(mutator, reason) {
    const current = read();
    const draft = clone(current);
    const result = mutator(draft);
    return write(result && typeof result === "object" ? result : draft, reason);
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function reset() {
    const seeded = seedState();
    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    } catch (error) {
      const wrapped = new Error("Browser storage is unavailable or full. The prototype was not reset.");
      wrapped.cause = error;
      throw wrapped;
    }
    listeners.forEach((listener) => listener(clone(seeded), { source: "local", reason: "reset" }));
    return clone(seeded);
  }

  global.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY || !event.newValue) return;
    try {
      const state = clone(migrate(JSON.parse(event.newValue)));
      listeners.forEach((listener) => listener(state, { source: "storage", reason: "cross-tab" }));
    } catch (_error) {
      listeners.forEach((listener) => listener(null, { source: "storage", reason: "invalid-cross-tab-state" }));
    }
  });

  global.AutoCodeState = Object.freeze({
    key: STORAGE_KEY,
    schemaVersion: SCHEMA_VERSION,
    read,
    write,
    update,
    subscribe,
    reset,
    seedState
  });
})(window);
