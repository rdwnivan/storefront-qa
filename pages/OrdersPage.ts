import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * OrdersPage
 * ----------
 * Models GET /orders and GET /orders/:id
 */
export class OrdersPage extends BasePage {
  readonly heading: Locator;
  readonly totalLabel: Locator;
  readonly orderRows: Locator;

  constructor(page: Page) {
    super(page);
    this.heading    = page.getByRole('heading', { name: 'Orders' });
    this.totalLabel = page.getByText(/\d+ total orders/);
    this.orderRows  = page.locator('table tbody tr');
  }

  async goto() {
    await this.page.goto('/orders');
    await expect(this.heading).toBeVisible();
  }

  async getTotalOrderCount(): Promise<number> {
    const text = await this.totalLabel.textContent();
    return parseInt((text ?? '0').replace(/[^0-9]/g, ''), 10);
  }

  async getVisibleOrderIds(): Promise<string[]> {
    const cells = this.page.locator('td').filter({ hasText: /ORD-\d+/ });
    return cells.allTextContents();
  }

  async filterByStatus(status: string) {
    // Status filter tabs: All | pending | processing | shipped | delivered | cancelled
    await this.page.getByRole('button', { name: new RegExp(status, 'i') }).click();
    await this.page.waitForTimeout(400);
  }

  async viewOrder(orderId: string) {
    const row = this.page.locator('tr').filter({ hasText: orderId });
    await row.getByRole('link', { name: 'View' }).click();
    await this.page.waitForURL(`/orders/${orderId}`);
  }

  // ── Order Detail page ─────────────────────────────────────────

  async getOrderStatus(): Promise<string> {
    // Status badge is typically a styled span near the heading
    const badge = this.page.locator('span, div').filter({ hasText: /^(pending|processing|shipped|delivered|cancelled)$/i }).first();
    return (await badge.textContent() ?? '').trim().toLowerCase();
  }

  async getOrderTotal(): Promise<number> {
    const totalCell = this.page.getByText('Total').locator('xpath=following-sibling::td').last();
    const text = await totalCell.textContent();
    return parseFloat((text ?? '0').replace(/[^0-9.]/g, ''));
  }

  async getOrderLineItems(): Promise<{ product: string; price: number; qty: number; subtotal: number }[]> {
    const rows = this.page.locator('table tbody tr');
    const count = await rows.count();
    const items = [];
    for (let i = 0; i < count; i++) {
      const cells = rows.nth(i).locator('td');
      const product  = (await cells.nth(0).textContent() ?? '').trim();
      const price    = parseFloat((await cells.nth(1).textContent() ?? '0').replace(/[^0-9.]/g, ''));
      const qty      = parseInt((await cells.nth(2).textContent() ?? '0').trim(), 10);
      const subtotal = parseFloat((await cells.nth(3).textContent() ?? '0').replace(/[^0-9.]/g, ''));
      if (product) items.push({ product, price, qty, subtotal });
    }
    return items;
  }
}
