# StoreFront QA — Bug Report & Automated Tests

QA assessment for the [StoreFront Admin Panel](https://qa-assessment-ten.vercel.app).

## Contents

| File / Folder | Description |
|---|---|
| `BUG_REPORT.md` | Manual QA bug report — 11 bugs documented with severity, repro steps, expected vs actual behaviour |
| `tests/` | Playwright end-to-end test suites (63 tests) |
| `pages/` | Page Object Models for each section of the app |
| `utils/fixtures.ts` | Shared test data and custom Playwright fixtures |
| `playwright.config.ts` | Playwright configuration (multi-browser, base URL, retries) |

---

## Bug Report Summary

11 bugs found across all severity levels:

| ID | Severity | Title |
|---|---|---|
| BUG-001 | 🔴 Critical | New order disappears after placement (not persisted) |
| BUG-002 | 🔴 Critical | Edit product changes are not saved |
| BUG-003 | 🔴 Critical | Add new product does not persist after page refresh |
| BUG-004 | 🟠 High | Search only filters current page, not full catalog |
| BUG-005 | 🟡 Medium | Broken product image for 4K Webcam Pro |
| BUG-006 | 🟠 High | Applied discount code not reflected in order detail total |
| BUG-007 | 🟡 Medium | Order count mismatch between Overview and Orders page |
| BUG-008 | 🟠 High | Add product form submits with all required fields empty |
| BUG-009 | 🟠 High | Negative price and zero stock values accepted |
| BUG-010 | 🟢 Low | Low stock count in stat card inconsistent with Low Stock panel |
| BUG-011 | 🟢 Low | Checkout address field accepts arbitrary text |

See [`BUG_REPORT.md`](./BUG_REPORT.md) for full details on each bug.

---

## Automated Tests

**63 tests** across 4 suites, built with [Playwright](https://playwright.dev).

### Setup

```bash
npm install
npx playwright install --with-deps
```

### Running Tests

```bash
# Run all tests
npm test

# Headed browser (watch tests run)
npm run test:headed

# Playwright UI (recommended for development)
npm run test:ui

# Run a specific suite
npm run test:overview
npm run test:products
npm run test:orders
npm run test:cart

# Run only the regression tests for known bugs
npx playwright test --grep "\[BUG-"

# View HTML report
npm run test:report
```

### Test Suites

| Suite | Tests | What it covers |
|---|---|---|
| `overview.spec.ts` | 10 | Stat cards, recent orders, low-stock panel, cross-page count consistency |
| `products.spec.ts` | 20 | Listing, pagination, search, category filter, add/edit product, image loading |
| `orders.spec.ts` | 14 | Order list, status filters, detail page, line-item arithmetic |
| `cart.spec.ts` | 19 | Empty state, add items, discount code, full checkout flow, item removal |

### Regression Tests for Known Bugs

Tests tagged `[BUG-XXX]` are intentionally written to **fail against the current app** and will pass once the corresponding bug is fixed. This gives developers unambiguous acceptance criteria.

| Tag | Bug |
|---|---|
| `[BUG-001]` | Placed order disappears after page refresh |
| `[BUG-002]` | Product edits lost after navigating away |
| `[BUG-003]` | New product disappears after reload |
| `[BUG-004]` | Search only filters the current page |
| `[BUG-005]` | 4K Webcam Pro has a 404 image URL |
| `[BUG-006]` | Order detail total ignores applied discount |
| `[BUG-007]` | Overview shows 13 orders, Orders page shows 12 |
| `[BUG-008]` | Add product form allows empty required fields |
| `[BUG-009]` | Negative price accepted without validation |

### Design Decisions

- **Page Object Model** — selectors live in `pages/`, isolated from test logic. A DOM change only requires updating one file.
- **Custom fixtures** — page objects injected via Playwright's fixture system for clean, readable tests.
- **Arithmetic assertions** — order detail tests independently recompute `price × qty` and compare to the displayed value, catching rounding and rendering bugs.
- **Multi-browser** — config runs Chromium, Firefox, WebKit, and Pixel 5 mobile viewport.

---

## Environment

- **Browser:** Chrome 124, Windows 10, 1920×1080
- **App version:** v2.4.1
- **Test date:** April 20, 2026
