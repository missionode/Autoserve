import { PrismaClient } from '@prisma/client';
import { afterAll, describe, expect, it } from 'vitest';

const database = new PrismaClient();
const restaurantId = '30000000-0000-4000-8000-000000000001';
const menuItemId = 'b0000000-0000-4000-8000-000000000001';
const cartId = 'd0000000-0000-4000-8000-000000000001';

afterAll(async () => database.$disconnect());

describe('Stage 4.2 catalog and cart foundation', () => {
  it('seeds a coherent priced cart snapshot', async () => {
    const cart = await database.cart.findUniqueOrThrow({
      where: { id: cartId },
      include: { lines: true },
    });
    expect(cart.restaurantId).toBe(restaurantId);
    expect(cart.lines).toHaveLength(1);
    expect(cart.lines[0]?.unitPriceMinorSnapshot).toBe(24900n);
    expect(cart.lines[0]?.lineTotalMinor).toBe(24900n);
  });

  it('rejects LIMITED availability without a remaining count', async () => {
    await expect(
      database.$executeRawUnsafe(
        `UPDATE menu_item_availability SET status = 'LIMITED', remaining_count = NULL WHERE menu_item_id = $1::uuid`,
        menuItemId,
      ),
    ).rejects.toThrow();
  });

  it('rejects a cart line whose total does not match quantity and unit price', async () => {
    await expect(
      database.$executeRawUnsafe(
        `INSERT INTO cart_lines
           (id, restaurant_id, cart_id, menu_item_id, quantity, item_name_snapshot,
            unit_price_minor_snapshot, line_total_minor, updated_at)
         VALUES
           ('e0000000-0000-4000-8000-000000000099', $1::uuid, $2::uuid, $3::uuid, 2,
            'Invalid total', 24900, 24900, now())`,
        restaurantId,
        cartId,
        menuItemId,
      ),
    ).rejects.toThrow();
  });

  it('rejects a tenant-mismatched cart-line relationship', async () => {
    await expect(
      database.$executeRawUnsafe(
        `INSERT INTO cart_lines
           (id, restaurant_id, cart_id, menu_item_id, quantity, item_name_snapshot,
            unit_price_minor_snapshot, line_total_minor, updated_at)
         VALUES
           ('e0000000-0000-4000-8000-000000000098',
            'ffffffff-ffff-4fff-8fff-ffffffffffff', $1::uuid, $2::uuid, 1,
            'Cross tenant', 24900, 24900, now())`,
        cartId,
        menuItemId,
      ),
    ).rejects.toThrow();
  });
});
