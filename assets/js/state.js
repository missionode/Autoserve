(function createAutoCodeState(global) {
  "use strict";

  const STORAGE_KEY = "autocode.prototype.state";
  const SCHEMA_VERSION = 7;
  const listeners = new Set();

  const now = () => new Date().toISOString();
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const createAdministrativeToken = () => String(Math.floor(100000 + Math.random() * 900000));
  const nextLocalMidnight = () => { const date = new Date(); date.setHours(24, 0, 0, 0); return date.toISOString(); };

  function seedState() {
    const createdAt = now();

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
          currency: "INR",
          taxPercent: 5,
          dineInEnabled: true,
          takeawayEnabled: true,
          dineInServiceMode: "both",
          tableNumbers: ["T01", "T02", "T03", "T04", "T05", "T06"],
          brandLogoPath: "assets/images/branding/demo-kitchen-logo.jpg",
          complaintPhone: "+91 90000 00999",
          qrGuestMessage: "Scan to view the menu and place your order",
          administrativeToken: createAdministrativeToken(),
          administrativeTokenExpiresAt: nextLocalMidnight(),
          tokenStart: 100,
          nextToken: 100,
          nextKot: 1,
          lowStockDefault: 5,
          primaryRewardItemId: "item_cold_coffee",
          fallbackRewardItemId: "item_fries",
          createdAt,
          updatedAt: createdAt
        }
      ],
      users: [
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
      payments: [],
      orders: [],
      inventoryAudit: [],
      gameAttempts: [],
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
