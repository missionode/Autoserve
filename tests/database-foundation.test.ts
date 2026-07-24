import { PrismaClient } from '@prisma/client';
import { afterAll, describe, expect, it } from 'vitest';

const database = new PrismaClient();
const restaurantId = '30000000-0000-4000-8000-000000000001';

afterAll(async () => database.$disconnect());

describe('Stage 4.2 identity and restaurant foundation', () => {
  it('seeds one coherent approved restaurant tenancy', async () => {
    const restaurant = await database.restaurant.findUniqueOrThrow({
      where: { id: restaurantId },
      include: {
        memberships: true,
        licences: true,
        tables: true,
        counters: true,
        approvalDecisions: true,
      },
    });

    expect(restaurant.status).toBe('ACTIVE');
    expect(restaurant.memberships).toHaveLength(1);
    expect(restaurant.memberships[0]?.role).toBe('ADMIN');
    expect(restaurant.licences[0]?.status).toBe('APPROVED');
    expect(restaurant.tables[0]?.code).toBe('T01');
    expect(restaurant.counters[0]?.code).toBe('C01');
    expect(restaurant.approvalDecisions[0]?.decision).toBe('APPROVED');
  });

  it('rejects invalid table capacity at the database boundary', async () => {
    await expect(
      database.$executeRawUnsafe(
        `INSERT INTO restaurant_tables (id, restaurant_id, code, display_name, capacity, updated_at)
         VALUES ('60000000-0000-4000-8000-000000000099', $1::uuid, 'INVALID-CAPACITY', 'Invalid', 0, now())`,
        restaurantId,
      ),
    ).rejects.toThrow();
  });

  it('rejects duplicate restaurant-scoped table codes', async () => {
    await expect(
      database.$executeRawUnsafe(
        `INSERT INTO restaurant_tables (id, restaurant_id, code, display_name, capacity, updated_at)
         VALUES ('60000000-0000-4000-8000-000000000098', $1::uuid, 'T01', 'Duplicate', 2, now())`,
        restaurantId,
      ),
    ).rejects.toThrow();
  });

  it('rejects tenant-owned records for an unknown restaurant', async () => {
    await expect(
      database.$executeRawUnsafe(
        `INSERT INTO pickup_counters (id, restaurant_id, code, display_name, updated_at)
         VALUES ('70000000-0000-4000-8000-000000000099', 'ffffffff-ffff-4fff-8fff-ffffffffffff', 'ORPHAN', 'Orphan', now())`,
      ),
    ).rejects.toThrow();
  });
});
