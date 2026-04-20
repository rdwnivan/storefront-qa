import { test, expect, SEED_ORDERS } from '../utils/fixtures';

/**
 * orders.spec.ts
 * ──────────────
 * Tests for GET /orders (list) and GET /orders/:id (detail).
 *
 * Covers:
 *  - Order list renders all seed orders
 *  - Status filter tabs work correctly
 *  - Order count shown on the page
 *  - Order detail: customer info, line items, total
 *  - Order total arithmetic is correct
 *  - Status is displayed on detail page
 *  - Back navigation from detail → list
 */

test.describe('Orders — List', () => {
  test.beforeEach(async ({ ordersPage }) => {
    await ordersPage.goto();
  });

  test('page loads with correct heading and total count', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Orders' })).toBeVisible();
    await expect(page.getByText(/\d+ total orders/)).toBeVisible();
  });

  test('order list shows 12 seed orders', async ({ ordersPage }) => {
    const count = await ordersPage.getTotalOrderCount();
    expect(count).toBe(12);
  });

  test('all seed order IDs are visible in the list', async ({ page }) => {
    for (const order of SEED_ORDERS) {
      await expect(page.getByText(order.id)).toBeVisible();
    }
  });

  test('order rows show customer name, total, status, and date', async ({ page }) => {
    const row = page.locator('tr').filter({ hasText: 'ORD-1001' });
    await expect(row.getByText('Sarah Johnson')).toBeVisible();
    await expect(row.getByText('$105.98')).toBeVisible();
    await expect(row.getByText(/delivered/i)).toBeVisible();
  });

  test('each order row has a "View" link', async ({ page }) => {
    const viewLinks = page.getByRole('link', { name: 'View' });
    const count = await viewLinks.count();
    expect(count).toBe(12);
  });

  // ── Status filter tabs ─────────────────────────────────────────

  test('filtering by "pending" shows only pending orders', async ({ ordersPage, page }) => {
    await ordersPage.filterByStatus('pending');
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    // Every visible row should have a "pending" badge
    for (let i = 0; i < count; i++) {
      await expect(rows.nth(i).getByText(/pending/i)).toBeVisible();
    }
  });

  test('filtering by "delivered" shows only delivered orders', async ({ ordersPage, page }) => {
    await ordersPage.filterByStatus('delivered');
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      await expect(rows.nth(i).getByText(/delivered/i)).toBeVisible();
    }
  });

  test('filtering by "All" restores the full order list', async ({ ordersPage, page }) => {
    await ordersPage.filterByStatus('pending');
    await ordersPage.filterByStatus('All');
    const count = await ordersPage.getTotalOrderCount();
    expect(count).toBe(12);
  });

  test('filtering by "cancelled" shows ORD-1008', async ({ page }) => {
    await page.getByRole('button', { name: /cancelled/i }).click();
    await page.waitForTimeout(400);
    await expect(page.getByText('ORD-1008')).toBeVisible();
    await expect(page.getByText('David Brown')).toBeVisible();
  });
});

test.describe('Orders — Detail Page', () => {
  test('clicking View navigates to order detail page', async ({ ordersPage, page }) => {
    await ordersPage.goto();
    await ordersPage.viewOrder('ORD-1001');
    await expect(page.getByRole('heading', { name: 'ORD-1001' })).toBeVisible();
  });

  test('ORD-1001 detail shows correct customer info', async ({ page }) => {
    await page.goto('/orders/ORD-1001');
    await expect(page.getByText('Sarah Johnson')).toBeVisible();
    await expect(page.getByText('sarah.j@email.com')).toBeVisible();
    await expect(page.getByText('789 Maple Ave, Seattle, WA 98101').or(page.getByText(/Seattle/))).toBeVisible();
  });

  test('ORD-1001 status badge shows "delivered"', async ({ ordersPage, page }) => {
    await page.goto('/orders/ORD-1001');
    await expect(page.getByText(/delivered/i)).toBeVisible();
  });

  test('ORD-1003 detail shows correct line items', async ({ page }) => {
    await page.goto('/orders/ORD-1003');
    await expect(page.getByText('Mechanical Keyboard RGB')).toBeVisible();
    await expect(page.getByText('Wireless Mouse')).toBeVisible();
    await expect(page.getByText('Desk Organizer Set')).toBeVisible();
  });

  test('ORD-1003 total matches sum of line item subtotals', async ({ ordersPage, page }) => {
    await page.goto('/orders/ORD-1003');
    const items = await ordersPage.getOrderLineItems();

    const computedTotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const displayedTotal = await ordersPage.getOrderTotal();

    // Allow $0.01 floating-point tolerance
    expect(Math.abs(computedTotal - displayedTotal)).toBeLessThanOrEqual(0.01);
  });

  test('each line item: subtotal equals price × qty', async ({ ordersPage, page }) => {
    await page.goto('/orders/ORD-1003');
    const items = await ordersPage.getOrderLineItems();
    expect(items.length).toBeGreaterThan(0);

    for (const item of items) {
      const expected = parseFloat((item.price * item.qty).toFixed(2));
      expect(Math.abs(item.subtotal - expected)).toBeLessThanOrEqual(0.01);
    }
  });

  test('"← Orders" back link returns to orders list', async ({ page }) => {
    await page.goto('/orders/ORD-1001');
    await page.getByRole('link', { name: /← Orders|back/i }).click();
    await page.waitForURL('/orders');
    await expect(page.getByRole('heading', { name: 'Orders' })).toBeVisible();
  });

  test('navigating directly to a valid order URL works', async ({ page }) => {
    await page.goto('/orders/ORD-1002');
    await expect(page.getByRole('heading', { name: 'ORD-1002' })).toBeVisible();
    await expect(page.getByText('Mike Chen')).toBeVisible();
    await expect(page.getByText(/shipped/i)).toBeVisible();
  });

  test('navigating to a non-existent order shows 404 or not-found message', async ({ page }) => {
    await page.goto('/orders/ORD-9999');
    const notFound =
      await page.getByText(/not found|does not exist|404/i).isVisible() ||
      await page.getByRole('heading', { name: /404/ }).isVisible();
    expect(notFound).toBe(true);
  });
});
