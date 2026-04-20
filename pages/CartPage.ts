import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export interface CheckoutDetails {
  name: string;
  email: string;
  address: string;
}

/**
 * CartPage
 * --------
 * Models GET /cart — add items, apply discounts, place orders.
 */
export class CartPage extends BasePage {
  readonly emptyMessage: Locator;
  readonly discountInput: Locator;
  readonly applyDiscountButton: Locator;
  readonly discountFeedback: Locator;
  readonly placeOrderButton: Locator;
  readonly cartItems: Locator;
  readonly subtotalLine: Locator;
  readonly discountLine: Locator;
  readonly totalLine: Locator;

  constructor(page: Page) {
    super(page);
    this.emptyMessage        = page.getByText('Your cart is empty');
    this.discountInput       = page.getByPlaceholder(/discount/i).or(page.getByLabel(/discount/i));
    this.applyDiscountButton = page.getByRole('button', { name: /apply/i });
    this.discountFeedback    = page.locator('[data-testid="discount-feedback"], .discount-message, .text-green-600, .text-red-600').first();
    this.placeOrderButton    = page.getByRole('button', { name: /place order/i });
    this.cartItems           = page.locator('[data-testid="cart-item"], .cart-item, table tbody tr');
    this.subtotalLine        = page.getByText(/subtotal/i).locator('..');
    this.discountLine        = page.getByText(/discount/i).locator('..');
    this.totalLine           = page.getByText(/^total$/i).locator('..');
  }

  async goto() {
    await this.page.goto('/cart');
  }

  async isEmpty(): Promise<boolean> {
    return this.emptyMessage.isVisible();
  }

  async getCartItemCount(): Promise<number> {
    return this.cartItems.count();
  }

  /** Read total displayed in the cart summary. Returns NaN if not found. */
  async getDisplayedTotal(): Promise<number> {
    // The total value is typically the last dollar amount on the page
    const totalAmounts = this.page.locator('text=/\\$[0-9]+\\.[0-9]{2}/');
    const count = await totalAmounts.count();
    if (count === 0) return NaN;
    const text = await totalAmounts.last().textContent();
    return parseFloat((text ?? '0').replace(/[^0-9.]/g, ''));
  }

  async getSubtotal(): Promise<number> {
    const amounts = this.page.locator('text=/\\$[0-9]+\\.[0-9]{2}/');
    const count = await amounts.count();
    if (count === 0) return NaN;
    const text = await amounts.first().textContent();
    return parseFloat((text ?? '0').replace(/[^0-9.]/g, ''));
  }

  async applyDiscount(code: string) {
    await this.discountInput.fill(code);
    await this.applyDiscountButton.click();
    await this.page.waitForTimeout(500);
  }

  async fillCheckoutForm(details: CheckoutDetails) {
    await this.page.getByLabel(/name/i).fill(details.name);
    await this.page.getByLabel(/email/i).fill(details.email);
    await this.page.getByLabel(/address/i).fill(details.address);
  }

  async placeOrder(): Promise<string | null> {
    await this.placeOrderButton.click();
    // Wait for either redirect to order detail or a success message
    await Promise.race([
      this.page.waitForURL(/\/orders\/ORD-\d+/, { timeout: 8000 }),
      this.page.waitForSelector('text=/order.*placed|order.*created|success/i', { timeout: 8000 }),
    ]).catch(() => {});

    // Extract new order ID from URL if redirected
    const url = this.page.url();
    const match = url.match(/ORD-(\d+)/);
    return match ? `ORD-${match[1]}` : null;
  }

  async removeItem(index = 0) {
    const removeButtons = this.page.getByRole('button', { name: /remove|delete|×/i });
    await removeButtons.nth(index).click();
    await this.page.waitForTimeout(300);
  }

  async changeQuantity(index: number, qty: number) {
    const qtyInputs = this.page.locator('input[type="number"]');
    await qtyInputs.nth(index).fill(String(qty));
    await this.page.waitForTimeout(300);
  }
}
