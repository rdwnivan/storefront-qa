import { test, expect, TEST_PRODUCT, SEED_PRODUCTS } from '../utils/fixtures';

/**
 * products.spec.ts
 * ────────────────
 * Tests for the Products page and Add/Edit product flows.
 *
 * Covers:
 *  - Product listing renders correctly
 *  - Search filters products by name
 *  - Category filter shows only matching products
 *  - Sort changes product order
 *  - Pagination navigates between pages
 *  - Search regression: only current-page products returned (BUG-004)
 *  - Add product form validation (BUG-008, BUG-009)
 *  - Add product happy path
 *  - Edit product happy path
 *  - Edit product: changes persist after navigation (BUG-002)
 *  - "Add to cart" button updates cart badge
 *  - Broken product image detected (BUG-005)
 */

test.describe('Products — Listing', () => {
  test.beforeEach(async ({ productsPage }) => {
    await productsPage.goto();
  });

  test('page loads with heading and total count', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible();
    await expect(page.getByText(/\d+ total products/)).toBeVisible();
  });

  test('displays product cards with name, category, stock, and price', async ({ page }) => {
    // Check one known seed product is rendered correctly
    const card = page.locator('div').filter({ hasText: 'Ergonomic Office Chair' }).first();
    await expect(card.getByText('Furniture')).toBeVisible();
    await expect(card.getByText('$299.99')).toBeVisible();
    await expect(card.getByText(/in stock/)).toBeVisible();
  });

  test('product cards show "Add to cart" button', async ({ page }) => {
    const addButtons = page.getByText('+ Add to cart');
    await expect(addButtons.first()).toBeVisible();
    const count = await addButtons.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('total product count matches 15 seed products', async ({ productsPage }) => {
    const total = await productsPage.getTotalProductCount();
    expect(total).toBe(15);
  });

  test('shows 6 products per page (pagination)', async ({ page }) => {
    const productLinks = page.locator('a[href*="/edit"]');
    const count = await productLinks.count();
    expect(count).toBe(6);
  });

  test('pagination: Next button advances to page 2', async ({ page }) => {
    const page1Names = await page.locator('a[href*="/edit"]').allTextContents();
    await page.getByRole('button', { name: /next/i }).click();
    await page.waitForTimeout(400);
    const page2Names = await page.locator('a[href*="/edit"]').allTextContents();

    // Page 2 must have different products
    expect(page2Names).not.toEqual(page1Names);
    expect(page2Names.length).toBeGreaterThan(0);
  });

  test('pagination: Prev button goes back to page 1', async ({ page }) => {
    const page1Names = await page.locator('a[href*="/edit"]').allTextContents();
    await page.getByRole('button', { name: /next/i }).click();
    await page.waitForTimeout(400);
    await page.getByRole('button', { name: /prev/i }).click();
    await page.waitForTimeout(400);
    const currentNames = await page.locator('a[href*="/edit"]').allTextContents();
    expect(currentNames).toEqual(page1Names);
  });
});

test.describe('Products — Search', () => {
  test.beforeEach(async ({ productsPage }) => {
    await productsPage.goto();
  });

  test('searching by name filters visible products', async ({ productsPage, page }) => {
    await productsPage.searchFor('Keyboard');
    const names = await productsPage.getVisibleProductNames();
    expect(names.some(n => n.toLowerCase().includes('keyboard'))).toBe(true);
    // Products not matching the query should be hidden
    expect(names.every(n => n.toLowerCase().includes('keyboard'))).toBe(true);
  });

  test('searching with no match shows empty state or zero cards', async ({ productsPage, page }) => {
    await productsPage.searchFor('zzz_no_match_xyz');
    const names = await productsPage.getVisibleProductNames();
    // Either no product cards are shown, or an empty-state message appears
    const isEmpty = names.length === 0 || await page.getByText(/no products|no results/i).isVisible();
    expect(isEmpty).toBe(true);
  });

  test('clearing search restores all products on current page', async ({ productsPage, page }) => {
    await productsPage.searchFor('Keyboard');
    await productsPage.clearSearch();
    const names = await productsPage.getVisibleProductNames();
    expect(names.length).toBe(6); // full page restored
  });

  /**
   * REGRESSION TEST — BUG-004
   * Search only filters the current page, not the full 15-product catalog.
   * Searching for a product on page 2+ from page 1 returns no results.
   * This test FAILS until the bug is fixed — which is the desired behaviour.
   */
  test('[BUG-004] search finds products that exist on page 2 when searched from page 1', async ({ productsPage, page }) => {
    // "Standing Desk Converter" is NOT on page 1 of the default sort
    await productsPage.searchFor('Standing Desk');
    const names = await productsPage.getVisibleProductNames();
    expect(names.some(n => n.includes('Standing Desk'))).toBe(true);
  });
});

test.describe('Products — Category Filter', () => {
  test.beforeEach(async ({ productsPage }) => {
    await productsPage.goto();
  });

  test('filtering by Electronics shows only electronics products', async ({ productsPage, page }) => {
    await productsPage.filterByCategory('Electronics');
    const cards = page.locator('div').filter({ hasText: /Electronics/ });
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    // No "Furniture" category text should appear in product cards
    const furnitureCards = page.locator('[class*="card"], .grid > div').filter({ hasText: 'Furniture' });
    expect(await furnitureCards.count()).toBe(0);
  });

  test('filtering by All restores full listing', async ({ productsPage, page }) => {
    await productsPage.filterByCategory('Electronics');
    await productsPage.filterByCategory('All');
    const names = await productsPage.getVisibleProductNames();
    expect(names.length).toBe(6);
  });
});

test.describe('Products — Add Product', () => {
  test.beforeEach(async ({ productsPage }) => {
    await productsPage.gotoNewProduct();
  });

  test('"Add product" button navigates to /products/new', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'New product' })).toBeVisible();
  });

  test('form renders all required fields', async ({ page }) => {
    await expect(page.getByLabel('Name')).toBeVisible();
    await expect(page.getByLabel(/Price/i)).toBeVisible();
    await expect(page.getByLabel('Stock')).toBeVisible();
    await expect(page.getByRole('combobox')).toBeVisible();
    await expect(page.getByLabel('Description')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
  });

  /**
   * REGRESSION TEST — BUG-008
   * Form should NOT submit when required fields are empty.
   * Currently no validation exists — this test FAILS until fixed.
   */
  test('[BUG-008] submitting empty form shows validation errors', async ({ page }) => {
    await page.getByRole('button', { name: 'Create' }).click();
    // Expect at least one field-level error to appear
    const errors = page.locator('text=/required|invalid|must be/i');
    await expect(errors.first()).toBeVisible({ timeout: 3000 });
  });

  /**
   * REGRESSION TEST — BUG-009
   * Negative price should be rejected by form validation.
   */
  test('[BUG-009] negative price is rejected with a validation error', async ({ productsPage, page }) => {
    await page.getByLabel('Name').fill('Bad Product');
    await page.getByLabel(/Price/i).fill('-50');
    await page.getByLabel('Stock').fill('10');
    await page.getByRole('combobox').selectOption('Electronics');
    await page.getByLabel('Description').fill('test');
    await page.getByRole('button', { name: 'Create' }).click();
    // Should NOT navigate away; should show error
    await expect(page).toHaveURL('/products/new');
    await expect(page.locator('text=/negative|invalid price|must be positive/i')).toBeVisible({ timeout: 3000 });
  });

  test('[BUG-009] zero stock is rejected or warned about', async ({ productsPage, page }) => {
    await page.getByLabel('Name').fill('Zero Stock Product');
    await page.getByLabel(/Price/i).fill('10.00');
    await page.getByLabel('Stock').fill('0');
    await page.getByRole('combobox').selectOption('Electronics');
    await page.getByLabel('Description').fill('test');
    await page.getByRole('button', { name: 'Create' }).click();
    // Should show warning or validation error
    const warning = page.locator('text=/stock|quantity|must be/i');
    await expect(warning.first()).toBeVisible({ timeout: 3000 });
  });

  test('Cancel button returns to products listing', async ({ productsPage, page }) => {
    await page.getByRole('button', { name: 'Cancel' }).click();
    await page.waitForURL('/products');
    await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible();
  });

  test('happy path: filling all fields and clicking Create succeeds', async ({ productsPage, page }) => {
    await productsPage.fillNewProductForm(TEST_PRODUCT);
    await productsPage.submitNewProductForm();
    // Should either redirect to /products or show success message
    const redirected = await page.waitForURL('/products', { timeout: 5000 }).then(() => true).catch(() => false);
    const hasSuccess = await page.getByText(/created|success/i).isVisible().catch(() => false);
    expect(redirected || hasSuccess).toBe(true);
  });

  /**
   * REGRESSION TEST — BUG-003
   * After creating a product and returning to /products, the new product
   * should appear in the listing. This currently fails because data is not persisted.
   */
  test('[BUG-003] newly created product appears in the product list after creation', async ({ productsPage, page }) => {
    await productsPage.fillNewProductForm(TEST_PRODUCT);
    await productsPage.submitNewProductForm();
    await page.goto('/products');
    // After reload, the new product name should still be visible somewhere
    await expect(page.getByText(TEST_PRODUCT.name)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Products — Edit Product', () => {
  test('clicking a product name opens the edit form pre-filled', async ({ page }) => {
    await page.goto('/products');
    await page.getByRole('link', { name: 'Ergonomic Office Chair' }).click();
    await page.waitForURL(/\/products\/\d+\/edit/);

    await expect(page.getByRole('heading', { name: 'Edit product' })).toBeVisible();
    await expect(page.getByLabel('Name')).toHaveValue('Ergonomic Office Chair');
    await expect(page.getByLabel(/Price/i)).toHaveValue('299.99');
  });

  /**
   * REGRESSION TEST — BUG-002
   * Edits should persist after saving and navigating back.
   * Currently they do not — this test FAILS until the backend persistence is fixed.
   */
  test('[BUG-002] saved changes persist after navigating away and back', async ({ productsPage, page }) => {
    await page.goto('/products');
    await page.getByRole('link', { name: 'Desk Organizer Set' }).click();
    await page.waitForURL(/\/products\/\d+\/edit/);

    const updatedName = 'Desk Organizer Set (UPDATED)';
    await page.getByLabel('Name').fill(updatedName);
    await page.getByRole('button', { name: 'Save changes' }).click();

    // Navigate away and come back
    await page.goto('/products');
    await page.reload();

    // The updated name should still be visible
    await expect(page.getByText(updatedName)).toBeVisible({ timeout: 5000 });
  });

  test('Cancel on edit form returns to products page without changing anything', async ({ page }) => {
    await page.goto('/products');
    await page.getByRole('link', { name: 'Ergonomic Office Chair' }).click();
    await page.waitForURL(/\/products\/\d+\/edit/);

    await page.getByLabel('Name').fill('SHOULD NOT SAVE');
    await page.getByRole('button', { name: 'Cancel' }).click();
    await page.waitForURL('/products');

    // Original name should still be visible
    await expect(page.getByText('Ergonomic Office Chair')).toBeVisible();
    // Modified name must not appear
    await expect(page.getByText('SHOULD NOT SAVE')).not.toBeVisible();
  });
});

test.describe('Products — Image Handling', () => {
  /**
   * REGRESSION TEST — BUG-005
   * The 4K Webcam Pro has a broken image URL in seed data.
   * This test checks that all product images load without errors.
   */
  test('[BUG-005] all product images on page 1 load successfully (no broken images)', async ({ page }) => {
    await page.goto('/products');

    // Intercept all image requests and track failures
    const brokenImages: string[] = [];
    page.on('response', response => {
      if (response.request().resourceType() === 'image' && !response.ok()) {
        brokenImages.push(response.url());
      }
    });

    // Reload to capture all image requests
    await page.reload();
    await page.waitForLoadState('networkidle');

    expect(brokenImages).toHaveLength(0);
  });
});

test.describe('Products — Cart Integration', () => {
  test('"Add to cart" from products page increments the cart badge', async ({ page }) => {
    await page.goto('/products');
    const cartBadgeBefore = await page.locator('nav a[href="/cart"]').locator('span').count();

    await page.getByText('+ Add to cart').first().click();
    await page.waitForTimeout(500);

    // The cart link should now show a badge (or the badge number increases)
    const cartLink = page.locator('a[href="/cart"]');
    await expect(cartLink.locator('span, [class*="badge"]')).toBeVisible();
  });

  test('adding the same product twice increases cart count to 2', async ({ page }) => {
    await page.goto('/products');
    await page.getByText('+ Add to cart').first().click();
    await page.waitForTimeout(300);
    await page.getByText('+ Add to cart').first().click();
    await page.waitForTimeout(300);

    // Navigate to cart and verify count
    await page.goto('/cart');
    const bodyText = await page.locator('body').textContent();
    // Either qty shows 2 or there are 2 separate line items
    expect(bodyText).toMatch(/2/);
  });
});
