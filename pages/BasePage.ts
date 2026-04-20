import { Page, Locator, expect } from '@playwright/test';

/**
 * BasePage
 * --------
 * Shared helpers and nav elements available on every page.
 */
export class BasePage {
  readonly page: Page;

  // Sidebar navigation links
  readonly navOverview: Locator;
  readonly navProducts: Locator;
  readonly navOrders: Locator;
  readonly navCart: Locator;

  constructor(page: Page) {
    this.page = page;
    this.navOverview = page.getByRole('link', { name: 'Overview' });
    this.navProducts = page.getByRole('link', { name: 'Products' });
    this.navOrders  = page.getByRole('link', { name: 'Orders' });
    this.navCart    = page.getByRole('link', { name: 'Cart' });
  }

  async goToOverview() {
    await this.navOverview.click();
    await this.page.waitForURL('/');
  }

  async goToProducts() {
    await this.navProducts.click();
    await this.page.waitForURL('/products');
  }

  async goToOrders() {
    await this.navOrders.click();
    await this.page.waitForURL('/orders');
  }

  async goToCart() {
    await this.navCart.click();
    await this.page.waitForURL('/cart');
  }

  /** Assert the sidebar brand is visible — quick sanity check. */
  async assertAppLoaded() {
    await expect(this.page.getByText('StoreFront')).toBeVisible();
  }

  /** Return the cart badge count, or 0 if no badge is shown. */
  async getCartCount(): Promise<number> {
    const badge = this.navCart.locator('..').getByText(/^\d+$/);
    const count = await badge.count();
    if (count === 0) return 0;
    const text = await badge.first().textContent();
    return parseInt(text ?? '0', 10);
  }
}
