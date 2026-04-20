import { test as base } from '@playwright/test';
import { OverviewPage } from '../pages/OverviewPage';
import { ProductsPage } from '../pages/ProductsPage';
import { OrdersPage }   from '../pages/OrdersPage';
import { CartPage }     from '../pages/CartPage';

/**
 * Custom fixture that injects fully-typed page objects into every test.
 *
 * Usage in tests:
 *   test('my test', async ({ overviewPage, productsPage }) => { ... })
 */
type Fixtures = {
  overviewPage: OverviewPage;
  productsPage: ProductsPage;
  ordersPage:   OrdersPage;
  cartPage:     CartPage;
};

export const test = base.extend<Fixtures>({
  overviewPage: async ({ page }, use) => {
    await use(new OverviewPage(page));
  },
  productsPage: async ({ page }, use) => {
    await use(new ProductsPage(page));
  },
  ordersPage: async ({ page }, use) => {
    await use(new OrdersPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
});

export { expect } from '@playwright/test';

// ── Shared test data ────────────────────────────────────────────────────────

export const DISCOUNT_CODE = 'SAVE10';
export const DISCOUNT_RATE = 0.10;

export const TEST_PRODUCT = {
  name:        'Test Headset Pro',
  price:       '89.99',
  stock:       '25',
  category:    'Electronics',
  description: 'Noise-cancelling test headset.',
};

export const TEST_CHECKOUT = {
  name:    'Jane Tester',
  email:   'jane.tester@example.com',
  address: '123 QA Street, Portland, OR 97201',
};

/** Known products from the seed data */
export const SEED_PRODUCTS = {
  webcam:    { name: '4K Webcam Pro',         price: 129.99 },
  chair:     { name: 'Ergonomic Office Chair', price: 299.99 },
  keyboard:  { name: 'Mechanical Keyboard RGB', price: 149.99 },
  organizer: { name: 'Desk Organizer Set',    price: 24.99  },
};

export const SEED_ORDERS = [
  { id: 'ORD-1001', customer: 'Sarah Johnson',  status: 'delivered' },
  { id: 'ORD-1002', customer: 'Mike Chen',       status: 'shipped'   },
  { id: 'ORD-1003', customer: 'Emily Davis',     status: 'processing'},
  { id: 'ORD-1004', customer: 'James Wilson',    status: 'pending'   },
];
