import { PrismaClient } from '@prisma/client';

const database = new PrismaClient();

const ids = {
  adminUser: '10000000-0000-4000-8000-000000000001',
  reviewerUser: '10000000-0000-4000-8000-000000000002',
  adminIdentity: '20000000-0000-4000-8000-000000000001',
  reviewerIdentity: '20000000-0000-4000-8000-000000000002',
  restaurant: '30000000-0000-4000-8000-000000000001',
  membership: '40000000-0000-4000-8000-000000000001',
  licence: '50000000-0000-4000-8000-000000000001',
  table: '60000000-0000-4000-8000-000000000001',
  counter: '70000000-0000-4000-8000-000000000001',
  approval: '80000000-0000-4000-8000-000000000001',
  correlation: '90000000-0000-4000-8000-000000000001',
  category: 'a0000000-0000-4000-8000-000000000001',
  menuItem: 'b0000000-0000-4000-8000-000000000001',
  availability: 'c0000000-0000-4000-8000-000000000001',
  cart: 'd0000000-0000-4000-8000-000000000001',
  cartLine: 'e0000000-0000-4000-8000-000000000001',
} as const;

try {
  await database.$transaction([
    database.foundationProbe.upsert({
      where: { name: 'stage-4.1' },
      update: {},
      create: { name: 'stage-4.1' },
    }),
    database.user.upsert({
      where: { id: ids.adminUser },
      update: { displayName: 'Demo Restaurant Admin' },
      create: {
        id: ids.adminUser,
        displayName: 'Demo Restaurant Admin',
        primaryEmail: 'admin@demo.autoserve.local',
        status: 'ACTIVE',
      },
    }),
    database.user.upsert({
      where: { id: ids.reviewerUser },
      update: { displayName: 'Demo Platform Reviewer' },
      create: {
        id: ids.reviewerUser,
        displayName: 'Demo Platform Reviewer',
        primaryEmail: 'reviewer@demo.autoserve.local',
        status: 'ACTIVE',
      },
    }),
    database.authIdentity.upsert({
      where: { id: ids.adminIdentity },
      update: {},
      create: {
        id: ids.adminIdentity,
        userId: ids.adminUser,
        provider: 'PASSWORD',
        providerSubject: 'demo-restaurant-admin',
        normalizedHandle: 'admin@demo.autoserve.local',
        verifiedAt: new Date('2026-07-20T00:00:00.000Z'),
      },
    }),
    database.authIdentity.upsert({
      where: { id: ids.reviewerIdentity },
      update: {},
      create: {
        id: ids.reviewerIdentity,
        userId: ids.reviewerUser,
        provider: 'PASSWORD',
        providerSubject: 'demo-platform-reviewer',
        normalizedHandle: 'reviewer@demo.autoserve.local',
        verifiedAt: new Date('2026-07-20T00:00:00.000Z'),
      },
    }),
    database.restaurant.upsert({
      where: { id: ids.restaurant },
      update: { displayName: 'Demo Kitchen' },
      create: {
        id: ids.restaurant,
        legalName: 'Demo Kitchen Private Limited',
        displayName: 'Demo Kitchen',
        slug: 'demo-kitchen',
        status: 'ACTIVE',
        complaintPhone: '+919876543210',
      },
    }),
    database.restaurantMembership.upsert({
      where: { id: ids.membership },
      update: { status: 'ACTIVE' },
      create: {
        id: ids.membership,
        restaurantId: ids.restaurant,
        userId: ids.adminUser,
        role: 'ADMIN',
        status: 'ACTIVE',
        staffCode: 'ADMIN-001',
      },
    }),
    database.restaurantLicence.upsert({
      where: { id: ids.licence },
      update: { status: 'APPROVED' },
      create: {
        id: ids.licence,
        restaurantId: ids.restaurant,
        licenceType: 'FSSAI',
        licenceNumber: 'DEMO-FSSAI-2026',
        privateObjectKey: 'licences/demo-kitchen/fssai.pdf',
        status: 'APPROVED',
        issuedAt: new Date('2026-01-01T00:00:00.000Z'),
        expiresAt: new Date('2027-01-01T00:00:00.000Z'),
      },
    }),
    database.restaurantTable.upsert({
      where: { id: ids.table },
      update: { isActive: true },
      create: {
        id: ids.table,
        restaurantId: ids.restaurant,
        code: 'T01',
        displayName: 'Table 1',
        capacity: 4,
      },
    }),
    database.pickupCounter.upsert({
      where: { id: ids.counter },
      update: { isActive: true },
      create: {
        id: ids.counter,
        restaurantId: ids.restaurant,
        code: 'C01',
        displayName: 'Main pickup counter',
      },
    }),
    database.approvalDecision.upsert({
      where: { id: ids.approval },
      update: {},
      create: {
        id: ids.approval,
        restaurantId: ids.restaurant,
        decision: 'APPROVED',
        reason: 'Deterministic local-development approval fixture',
        decidedById: ids.reviewerUser,
        decidedAt: new Date('2026-07-20T00:00:00.000Z'),
        correlationId: ids.correlation,
      },
    }),
    database.category.upsert({
      where: { id: ids.category },
      update: { status: 'PUBLISHED' },
      create: {
        id: ids.category,
        restaurantId: ids.restaurant,
        name: 'Burgers',
        slug: 'burgers',
        status: 'PUBLISHED',
      },
    }),
    database.menuItem.upsert({
      where: { id: ids.menuItem },
      update: { priceMinor: 24900n },
      create: {
        id: ids.menuItem,
        restaurantId: ids.restaurant,
        categoryId: ids.category,
        name: 'Classic Veg Burger',
        slug: 'classic-veg-burger',
        description: 'Deterministic catalog fixture',
        priceMinor: 24900n,
        isVegetarian: true,
        status: 'PUBLISHED',
      },
    }),
    database.menuItemAvailability.upsert({
      where: { id: ids.availability },
      update: { status: 'AVAILABLE', remainingCount: null },
      create: {
        id: ids.availability,
        restaurantId: ids.restaurant,
        menuItemId: ids.menuItem,
        status: 'AVAILABLE',
      },
    }),
    database.cart.upsert({
      where: { id: ids.cart },
      update: { status: 'ACTIVE' },
      create: {
        id: ids.cart,
        restaurantId: ids.restaurant,
        customerId: ids.adminUser,
        status: 'ACTIVE',
        expiresAt: new Date('2027-01-01T00:00:00.000Z'),
      },
    }),
    database.cartLine.upsert({
      where: { id: ids.cartLine },
      update: { quantity: 1, lineTotalMinor: 24900n },
      create: {
        id: ids.cartLine,
        restaurantId: ids.restaurant,
        cartId: ids.cart,
        menuItemId: ids.menuItem,
        quantity: 1,
        itemNameSnapshot: 'Classic Veg Burger',
        unitPriceMinorSnapshot: 24900n,
        lineTotalMinor: 24900n,
        configurationSnapshot: { size: 'Regular', addOns: [] },
      },
    }),
  ]);
} finally {
  await database.$disconnect();
}
