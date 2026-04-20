import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * OverviewPage
 * ------------
 * Models the dashboard at GET /
 */
export class OverviewPage extends BasePage {
  readonly heading: Locator;
  readonly revenueCard: Locator;
  readonly ordersCard: Locator;
  readonly pendingCard: Locator;
  readonly productsCard: Locator;
  readonly recentOrdersSection: Locator;
  readonly lowStockSection: Locator;

  constructor(page: Page) {
    super(page);
    this.heading             = page.getByRole('heading', { name: 'Overview' });
    this.revenueCard         = page.getByText('REVENUE').locator('..');
    this.ordersCard          = page.getByText('ORDERS').locator('..');
    this.pendingCard         = page.getByText('PENDING').locator('..');
    this.productsCard        = page.getByText('PRODUCTS').locator('..');
    this.recentOrdersSection = page.getByText('Recent Orders').locator('..');
    this.lowStockSection     = page.getByText('Low Stock').locator('..');
  }

  async goto() {
    await this.page.goto('/');
    await expect(this.heading).toBeVisible();
  }

  /** Read the numeric value from a stat card (e.g. "13" from the ORDERS card). */
  async getStatValue(card: Locator): Promise<number> {
    // The large number sits in the first element after the label
    const valueText = await card.locator('p, h2, span').filter({ hasNotText: /[A-Z]{2,}/ }).first().textContent();
    return parseInt((valueText ?? '0').replace(/[^0-9]/g, ''), 10);
  }

  async getLowStockItems(): Promise<string[]> {
    const items = this.page.locator('[data-testid="low-stock-item"], .low-stock-item');
    // Fallback: grab items inside the Low Stock section by product name text
    const names = await this.page
      .getByText('Low Stock')
      .locator('xpath=following-sibling::*')
      .locator('text=/\\$/') // lines that contain a price
      .allTextContents();
    return names;
  }
}
