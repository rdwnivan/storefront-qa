import { test, expect } from '../utils/fixtures';

/**
 * overview.spec.ts
 * ────────────────
 * Tests for the Overview dashboard at GET /
 *
 * Covers:
 *  - Page loads and renders all four stat cards
 *  - Stat card values are numeric and non-negative
 *  - Revenue value matches expected format
 *  - Recent Orders section is present and non-empty
 *  - Low Stock section lists products with stock counts
 *  - Consistency: ORDERS count matches Orders page total
 *  - Navigation: clicking a recent order goes to its detail page
 */

test.describe('Overview Dashboard', () => {
  test.beforeEach(async ({ overviewPage }) => {
    await overviewPage.goto();
  });

  // ── Rendering ─────────────────────────────────────────────────

  test('page loads and shows the correct heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
    await expect(page.getByText('Here is what is happening today')).toBeVisible();
  });

  test('all four stat cards are visible', async ({ page }) => {
    await expect(page.getByText('REVENUE')).toBeVisible();
    await expect(page.getByText('ORDERS')).toBeVisible();
    await expect(page.getByText('PENDING')).toBeVisible();
    await expect(page.getByText('PRODUCTS')).toBeVisible();
  });

  test('stat cards display numeric values', async ({ page }) => {
    // Revenue should start with a dollar sign
    const revenueSection = page.getByText('REVENUE').locator('xpath=ancestor::div[1]');
    await expect(revenueSection.getByText(/^\$[\d,]+\.\d{2}$/)).toBeVisible();

    // Orders, Pending, Products should be plain integers
    for (const label of ['ORDERS', 'PENDING', 'PRODUCTS']) {
      const section = page.getByText(label).locator('xpath=ancestor::div[1]');
      const valueEl = section.locator('p, h2, span').filter({ hasText: /^\d+$/ }).first();
      const value   = parseInt((await valueEl.textContent() ?? '0'), 10);
      expect(value).toBeGreaterThanOrEqual(0);
    }
  });

  // ── Recent Orders section ──────────────────────────────────────

  test('Recent Orders section is visible', async ({ page }) => {
    await expect(page.getByText('Recent Orders')).toBeVisible();
  });

  test('Recent Orders lists at least one order', async ({ page }) => {
    // Each row has an ORD-XXXX identifier
    const orderLinks = page.locator('text=/ORD-\\d+/');
    await expect(orderLinks.first()).toBeVisible();
    const count = await orderLinks.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('Recent Orders shows customer name, amount, and status badge', async ({ page }) => {
    // Sarah Johnson appears in seed data as a recent order
    await expect(page.getByText('Sarah Johnson')).toBeVisible();
    // At least one dollar amount should appear
    await expect(page.locator('text=/\\$\\d+\\.\\d{2}/').first()).toBeVisible();
    // At least one status badge
    const statuses = ['Pending', 'Shipped', 'Processing', 'Delivered', 'Cancelled'];
    let found = false;
    for (const s of statuses) {
      if (await page.getByText(s).count() > 0) { found = true; break; }
    }
    expect(found).toBe(true);
  });

  // ── Low Stock section ──────────────────────────────────────────

  test('Low Stock section is visible', async ({ page }) => {
    await expect(page.getByText('Low Stock')).toBeVisible();
  });

  test('Low Stock section lists products with stock numbers', async ({ page }) => {
    // Known low-stock products from seed data
    await expect(page.getByText('Ultrawide Monitor 34 inch')).toBeVisible();
    // Each entry should have a small stock count visible (red/orange number)
    const stockNumbers = page.locator('text=/^\\d{1,2}$/');
    await expect(stockNumbers.first()).toBeVisible();
  });

  // ── Cross-page consistency ─────────────────────────────────────

  test('ORDERS stat count should match total on the Orders page (regression: known mismatch BUG-007)', async ({ page, ordersPage }) => {
    // Read overview count
    const ordersSection = page.getByText('ORDERS').locator('xpath=ancestor::div[1]');
    const overviewCountEl = ordersSection.locator('p, h2').filter({ hasText: /^\d+$/ }).first();
    const overviewCount = parseInt((await overviewCountEl.textContent() ?? '0'), 10);

    // Navigate to Orders page and read its count
    await ordersPage.goto();
    const ordersPageCount = await ordersPage.getTotalOrderCount();

    // This assertion documents the known bug — it will FAIL until the bug is fixed,
    // which is exactly the regression-catching behaviour we want.
    expect(overviewCount).toBe(ordersPageCount);
  });

  // ── Navigation ────────────────────────────────────────────────

  test('clicking a Recent Order row navigates to the order detail page', async ({ page }) => {
    // Click on ORD-1001 link or row
    await page.locator('text=ORD-1001').click();
    await page.waitForURL(/\/orders\/ORD-1001/);
    await expect(page.getByRole('heading', { name: 'ORD-1001' })).toBeVisible();
  });

  test('sidebar navigation links are all present', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Overview' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Products' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Orders' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Cart' })).toBeVisible();
  });
});
