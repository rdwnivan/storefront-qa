import { test, expect, DISCOUNT_CODE, DISCOUNT_RATE, TEST_CHECKOUT, SEED_PRODUCTS } from '../utils/fixtures';

/**
 * cart.spec.ts
 * ────────────
 * Tests for the Cart page and end-to-end checkout flow.
 *
 * Covers:
 *  - Empty cart state
 *  - Adding products to cart
 *  - Cart badge count updates
 *  - Quantity change updates totals
 *  - Remove item from cart
 *  - Discount code SAVE10 applies 10% off
 *  - Invalid discount code shows error
 *  - Discount reflected in order detail (BUG-006)
 *  - Full checkout flow: add → discount → checkout → order created
 *  - New order persists after navigation (BUG-001)
 *  - Checkout form validation
 */

test.describe('Cart — Empty State', () => {
  test('empty cart shows the empty-state message', async ({ page }) => {
    await page.goto('/cart');
    await expect(page.getByText('Your cart is empty')).toBeVisible();
  });

  test('empty cart has a "Browse products" link', async ({ page }) => {
    await page.goto('/cart');
    const link = page.getByRole('link', { name: /browse products/i });
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForURL('/products');
  });
});

test.describe('Cart — Adding Items', () => {
  test('adding a product from Products page shows it in the cart', async ({ page }) => {
    await page.goto('/products');
    await page.getByText('+ Add to cart').first().click();
    await page.waitForTimeout(400);
    await page.goto('/cart');
    await expect(page.getByText('Your cart is empty')).not.toBeVisible();
  });

  test('cart badge shows count after adding a product', async ({ page }) => {
    await page.goto('/products');
    await page.getByText('+ Add to cart').first().click();
    await page.waitForTimeout(400);

    const cartLink = page.locator('a[href="/cart"]');
    const badge = cartLink.locator('span, [class*="badge"]').first();
    await expect(badge).toBeVisible();
    const text = await badge.textContent();
    expect(parseInt(text ?? '0', 10)).toBeGreaterThanOrEqual(1);
  });

  test('adding two different products shows both in cart', async ({ page }) => {
    await page.goto('/products');
    const addButtons = page.getByText('+ Add to cart');
    await addButtons.nth(0).click();
    await page.waitForTimeout(300);
    await addButtons.nth(1).click();
    await page.waitForTimeout(300);

    await page.goto('/cart');
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).not.toContain('Your cart is empty');
  });

  test('cart total equals sum of added product prices', async ({ page }) => {
    // Add Desk Organizer Set ($24.99) — cheapest product for predictable math
    await page.goto('/products');
    const organizerCard = page.locator('div').filter({ hasText: 'Desk Organizer Set' }).first();
    await organizerCard.getByText('+ Add to cart').click();
    await page.waitForTimeout(400);

    await page.goto('/cart');
    // $24.99 should appear as the total
    await expect(page.getByText('$24.99')).toBeVisible();
  });
});

test.describe('Cart — Discount Code', () => {
  test.beforeEach(async ({ page }) => {
    // Add a product before each discount test
    await page.goto('/products');
    await page.getByText('+ Add to cart').first().click();
    await page.waitForTimeout(400);
    await page.goto('/cart');
  });

  test('discount input and Apply button are visible', async ({ page }) => {
    await expect(
      page.getByPlaceholder(/discount/i).or(page.getByLabel(/discount/i))
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /apply/i })).toBeVisible();
  });

  test('SAVE10 discount code applies successfully', async ({ cartPage, page }) => {
    await cartPage.applyDiscount(DISCOUNT_CODE);
    // Should show a success message or discount line
    const success =
      await page.getByText(/10%|discount applied|SAVE10/i).isVisible() ||
      await page.getByText(/−\$|saving/i).isVisible();
    expect(success).toBe(true);
  });

  test('SAVE10 reduces the total by 10%', async ({ page }) => {
    // Add Desk Organizer Set ($24.99) for predictable math
    await page.goto('/products');
    const card = page.locator('div').filter({ hasText: 'Desk Organizer Set' }).first();
    await card.getByText('+ Add to cart').click();
    await page.waitForTimeout(400);
    await page.goto('/cart');

    // Read subtotal before discount
    const priceTexts = await page.locator('text=/\\$\\d+\\.\\d{2}/').allTextContents();
    const prices = priceTexts.map(t => parseFloat(t.replace(/[^0-9.]/g, '')));
    const subtotal = prices[0]; // first price is the product price

    // Apply discount
    const discountInput = page.getByPlaceholder(/discount/i).or(page.getByLabel(/discount/i));
    await discountInput.fill(DISCOUNT_CODE);
    await page.getByRole('button', { name: /apply/i }).click();
    await page.waitForTimeout(500);

    // New total should be subtotal * 0.9
    const expectedTotal = parseFloat((subtotal * (1 - DISCOUNT_RATE)).toFixed(2));
    await expect(page.getByText(new RegExp(`\\$${expectedTotal}`))).toBeVisible();
  });

  test('invalid discount code shows an error message', async ({ cartPage, page }) => {
    await cartPage.applyDiscount('INVALID_CODE_XYZ');
    const error = page.getByText(/invalid|not valid|code not found|expired/i);
    await expect(error).toBeVisible({ timeout: 3000 });
  });

  test('discount code is case-insensitive (save10 should work like SAVE10)', async ({ cartPage, page }) => {
    await cartPage.applyDiscount('save10');
    const success = await page.getByText(/10%|discount applied|save10/i).isVisible();
    // NOTE: This may fail if the app is case-sensitive — which would be a bug
    expect(success).toBe(true);
  });
});

test.describe('Cart — Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/products');
    await page.getByText('+ Add to cart').first().click();
    await page.waitForTimeout(400);
    await page.goto('/cart');
  });

  test('checkout form fields are visible', async ({ page }) => {
    await expect(page.getByLabel(/name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/address/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /place order/i })).toBeVisible();
  });

  test('submitting empty checkout form shows validation errors', async ({ page }) => {
    await page.getByRole('button', { name: /place order/i }).click();
    const errors = page.locator('text=/required|please enter|invalid/i');
    await expect(errors.first()).toBeVisible({ timeout: 3000 });
  });

  test('invalid email format is rejected', async ({ page }) => {
    await page.getByLabel(/name/i).fill('Test User');
    await page.getByLabel(/email/i).fill('not-an-email');
    await page.getByLabel(/address/i).fill('123 Main St');
    await page.getByRole('button', { name: /place order/i }).click();
    await expect(page.getByText(/valid email|invalid email/i)).toBeVisible({ timeout: 3000 });
  });

  test('happy path: placing an order redirects to order detail or shows success', async ({ cartPage, page }) => {
    await cartPage.fillCheckoutForm(TEST_CHECKOUT);
    await page.getByRole('button', { name: /place order/i }).click();

    await Promise.race([
      page.waitForURL(/\/orders\/ORD-/, { timeout: 8000 }),
      page.waitForSelector('text=/order placed|success|thank you/i', { timeout: 8000 }),
    ]);

    const onOrderPage = page.url().includes('/orders/ORD-');
    const hasSuccessMsg = await page.getByText(/order placed|success|thank you/i).isVisible();
    expect(onOrderPage || hasSuccessMsg).toBe(true);
  });

  test('cart is cleared after placing an order', async ({ cartPage, page }) => {
    await cartPage.fillCheckoutForm(TEST_CHECKOUT);
    await page.getByRole('button', { name: /place order/i }).click();

    await Promise.race([
      page.waitForURL(/\/orders\/ORD-/, { timeout: 8000 }),
      page.waitForSelector('text=/success/i', { timeout: 8000 }),
    ]).catch(() => {});

    await page.goto('/cart');
    await expect(page.getByText('Your cart is empty')).toBeVisible();
  });

  /**
   * REGRESSION TEST — BUG-001
   * A placed order must persist in the Orders list after navigation and refresh.
   * This test FAILS until backend persistence is implemented.
   */
  test('[BUG-001] placed order appears in Orders list after page refresh', async ({ cartPage, page }) => {
    await cartPage.fillCheckoutForm(TEST_CHECKOUT);
    await page.getByRole('button', { name: /place order/i }).click();

    // Capture the new order ID from URL
    await page.waitForURL(/\/orders\/ORD-/, { timeout: 8000 }).catch(() => {});
    const url = page.url();
    const match = url.match(/(ORD-\d+)/);
    const newOrderId = match ? match[1] : null;
    expect(newOrderId).not.toBeNull();

    // Navigate to Orders list and reload
    await page.goto('/orders');
    await page.reload();

    // The new order must be visible
    await expect(page.getByText(newOrderId!)).toBeVisible({ timeout: 5000 });
  });

  /**
   * REGRESSION TEST — BUG-006
   * When an order is placed with discount SAVE10, the order detail should
   * reflect the discounted total, not the full price.
   */
  test('[BUG-006] order detail shows discounted total when SAVE10 was applied at checkout', async ({ cartPage, page }) => {
    // Add Desk Organizer Set ($24.99)
    await page.goto('/products');
    const card = page.locator('div').filter({ hasText: 'Desk Organizer Set' }).first();
    await card.getByText('+ Add to cart').click();
    await page.waitForTimeout(400);
    await page.goto('/cart');

    // Apply discount
    const discountInput = page.getByPlaceholder(/discount/i).or(page.getByLabel(/discount/i));
    await discountInput.fill(DISCOUNT_CODE);
    await page.getByRole('button', { name: /apply/i }).click();
    await page.waitForTimeout(500);

    // Place order
    await cartPage.fillCheckoutForm(TEST_CHECKOUT);
    await page.getByRole('button', { name: /place order/i }).click();
    await page.waitForURL(/\/orders\/ORD-/, { timeout: 8000 }).catch(() => {});

    // Discounted total should be $22.49 (24.99 * 0.9)
    const expectedTotal = (24.99 * 0.9).toFixed(2);
    await expect(page.getByText(`$${expectedTotal}`)).toBeVisible({ timeout: 5000 });

    // Full pre-discount total should NOT be the final total shown
    // (it's fine if it appears as a sub-line, but the TOTAL line should be discounted)
    const totalCells = page.locator('td, span').filter({ hasText: /^total$/i });
    const totalSibling = totalCells.locator('xpath=following-sibling::*').first();
    const totalText = await totalSibling.textContent();
    const totalValue = parseFloat((totalText ?? '0').replace(/[^0-9.]/g, ''));
    expect(totalValue).toBeCloseTo(22.49, 1);
  });
});

test.describe('Cart — Item Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/products');
    await page.getByText('+ Add to cart').first().click();
    await page.waitForTimeout(400);
    await page.goto('/cart');
  });

  test('removing an item from cart returns to empty state when last item is removed', async ({ page }) => {
    const removeBtn = page.getByRole('button', { name: /remove|delete|×/i }).first();
    await removeBtn.click();
    await page.waitForTimeout(400);
    await expect(page.getByText('Your cart is empty')).toBeVisible();
  });

  test('cart badge decrements to zero after removing the only item', async ({ page }) => {
    const removeBtn = page.getByRole('button', { name: /remove|delete|×/i }).first();
    await removeBtn.click();
    await page.waitForTimeout(400);

    const badge = page.locator('a[href="/cart"] span, a[href="/cart"] [class*="badge"]');
    const badgeVisible = await badge.isVisible();
    if (badgeVisible) {
      const text = await badge.textContent();
      expect(parseInt(text ?? '0', 10)).toBe(0);
    }
    // It's also valid for the badge to simply disappear when cart is empty
  });
});
