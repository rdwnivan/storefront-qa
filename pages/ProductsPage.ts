import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export interface NewProduct {
  name: string;
  price: string;
  stock: string;
  category: string;
  description: string;
  imageUrl?: string;
}

/**
 * ProductsPage
 * ------------
 * Models GET /products and child pages /products/new, /products/:id/edit
 */
export class ProductsPage extends BasePage {
  readonly heading: Locator;
  readonly totalLabel: Locator;
  readonly searchInput: Locator;
  readonly categoryFilter: Locator;
  readonly sortFilter: Locator;
  readonly addProductButton: Locator;
  readonly productCards: Locator;
  readonly paginationPrev: Locator;
  readonly paginationNext: Locator;

  constructor(page: Page) {
    super(page);
    this.heading          = page.getByRole('heading', { name: 'Products' });
    this.totalLabel       = page.getByText(/\d+ total products/);
    this.searchInput      = page.getByPlaceholder('Search...');
    this.categoryFilter   = page.getByRole('combobox').first();
    this.sortFilter       = page.getByRole('combobox').nth(1);
    this.addProductButton = page.getByRole('link', { name: 'Add product' });
    this.productCards     = page.locator('.grid > div, [data-testid="product-card"]');
    this.paginationPrev   = page.getByRole('button', { name: /prev/i });
    this.paginationNext   = page.getByRole('button', { name: /next/i });
  }

  async goto() {
    await this.page.goto('/products');
    await expect(this.heading).toBeVisible();
  }

  async getTotalProductCount(): Promise<number> {
    const text = await this.totalLabel.textContent();
    return parseInt((text ?? '0').replace(/[^0-9]/g, ''), 10);
  }

  async getVisibleProductNames(): Promise<string[]> {
    // Product names are the clickable links on each card
    const links = this.page.locator('a[href*="/edit"]');
    return links.allTextContents();
  }

  async searchFor(term: string) {
    await this.searchInput.fill(term);
    // Wait for DOM to update (search is typically client-side)
    await this.page.waitForTimeout(500);
  }

  async clearSearch() {
    await this.searchInput.clear();
    await this.page.waitForTimeout(300);
  }

  async filterByCategory(category: string) {
    await this.categoryFilter.selectOption(category);
    await this.page.waitForTimeout(400);
  }

  async sortBy(value: string) {
    await this.sortFilter.selectOption(value);
    await this.page.waitForTimeout(400);
  }

  async clickAddProduct() {
    await this.addProductButton.click();
    await this.page.waitForURL('/products/new');
  }

  async clickProductByName(name: string) {
    await this.page.getByRole('link', { name }).click();
    await this.page.waitForURL(/\/products\/\d+\/edit/);
  }

  async addToCart(productName: string) {
    const card = this.page.locator('div').filter({ hasText: productName }).first();
    await card.getByText('+ Add to cart').click();
  }

  // ── New Product form ──────────────────────────────────────────

  async gotoNewProduct() {
    await this.page.goto('/products/new');
    await expect(this.page.getByRole('heading', { name: 'New product' })).toBeVisible();
  }

  async fillNewProductForm(product: NewProduct) {
    await this.page.getByLabel('Name').fill(product.name);
    await this.page.getByLabel(/Price/i).fill(product.price);
    await this.page.getByLabel('Stock').fill(product.stock);
    await this.page.getByRole('combobox').selectOption(product.category);
    await this.page.getByLabel('Description').fill(product.description);
    if (product.imageUrl) {
      await this.page.getByLabel(/Image URL/i).fill(product.imageUrl);
    }
  }

  async submitNewProductForm() {
    await this.page.getByRole('button', { name: 'Create' }).click();
  }

  async cancelNewProductForm() {
    await this.page.getByRole('button', { name: 'Cancel' }).click();
  }

  // ── Edit Product form ─────────────────────────────────────────

  async fillEditProductForm(updates: Partial<NewProduct>) {
    if (updates.name !== undefined) {
      await this.page.getByLabel('Name').fill(updates.name);
    }
    if (updates.price !== undefined) {
      await this.page.getByLabel(/Price/i).fill(updates.price);
    }
    if (updates.stock !== undefined) {
      await this.page.getByLabel('Stock').fill(updates.stock);
    }
    if (updates.category !== undefined) {
      await this.page.getByRole('combobox').selectOption(updates.category);
    }
    if (updates.description !== undefined) {
      await this.page.getByLabel('Description').fill(updates.description);
    }
  }

  async submitEditProductForm() {
    await this.page.getByRole('button', { name: 'Save changes' }).click();
  }

  async cancelEditProductForm() {
    await this.page.getByRole('button', { name: 'Cancel' }).click();
  }
}
