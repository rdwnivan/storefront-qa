# StoreFront Admin Panel — QA Bug Report

**Tester:** Ridwan  
**Date:** April 20, 2026  
**App Version:** v2.4.1  
**Environment:** Chrome (latest), Windows 10, 1920×1080  
**Base URL:** https://qa-assessment-ten.vercel.app

---

## BUG-001 — New Order Disappears After Placement (Not Persisted)

**Severity:** Critical

**Steps to Reproduce:**
1. Go to the Products page.
2. Click "+ Add to cart" on any product (e.g., 4K Webcam Pro).
3. Navigate to Cart.
4. Fill in Name, Email, and Address fields.
5. Click "Place Order".
6. Observe the success message and note the new order ID (e.g., ORD-1013).
7. Navigate to the Orders page.
8. Refresh the page or revisit later.

**Expected Behavior:** The newly created order (ORD-1013) should appear in the Orders list and persist across page refreshes and sessions.

**Actual Behavior:** The order is missing from the Orders list after the page is refreshed. The Overview dashboard momentarily shows the order but it disappears on reload. Orders placed by the user are not persisted to the backend.

**Screenshot Reference:** Screenshot_2026-04-20_072956 — ORD-1013 briefly visible in the order detail view before disappearing.

---

## BUG-002 — Edit Product Changes Are Not Saved

**Severity:** Critical

**Steps to Reproduce:**
1. Go to the Products page.
2. Click on any product name (e.g., "4K Webcam Pro") to open the Edit Product form.
3. Modify the Name, Price, Stock, or Description field.
4. Click "Save changes".
5. Navigate away and return to the Products page.
6. Click the same product again.

**Expected Behavior:** The product should reflect the updated values after saving.

**Actual Behavior:** All fields revert to their original values. Changes are not persisted — the save operation appears to succeed (no error shown) but data is not written to the backend.

**Screenshot Reference:** Screenshot_2026-04-20_073208 — Edit form showing original data (4K Webcam Pro, $129.99, Stock 19) after a prior save attempt.

---

## BUG-003 — Add New Product Does Not Persist

**Severity:** Critical

**Steps to Reproduce:**
1. Go to the Products page.
2. Click "Add product" (top-right button).
3. Fill in all fields: Name, Price, Stock, Category, Description.
4. Click "Create".
5. Navigate to the Products page.
6. Refresh the page.

**Expected Behavior:** The newly created product should appear in the product listing and persist on refresh.

**Actual Behavior:** The product may briefly appear after creation but disappears on page refresh. No product is actually saved to the backend.

**Screenshot Reference:** Screenshot_2026-04-20_073154 — New product form shown with all required fields present.

---

## BUG-004 — Search Does Not Work Across Paginated Pages

**Severity:** High

**Steps to Reproduce:**
1. Go to the Products page (shows 6 products per page, paginated across pages 1, 2, 3).
2. On page 1, type a search term into the search box (e.g., "Standing Desk").
3. Note the results shown.
4. Navigate to page 2 or page 3 manually.

**Expected Behavior:** The search query should filter products across all pages or search all 15 products regardless of the current page, returning all matching results.

**Actual Behavior:** Search only filters the products visible on the current page (6 products). Products on other pages are not included in the search results — e.g., searching "Standing Desk" on page 1 returns no results even though "Standing Desk Converter" exists in the full catalog.

---

## BUG-005 — Broken Product Image (4K Webcam Pro)

**Severity:** Medium

**Steps to Reproduce:**
1. Navigate to the Products page.
2. Observe the first product card: "4K Webcam Pro".

**Expected Behavior:** A product image should be displayed in the card.

**Actual Behavior:** The image fails to load, showing only broken image alt text ("4K Webcam Pro"). The image URL stored is intentionally or accidentally invalid: `https://images.unsplash.com/photo-this-image-does-not-exist-404?w=300&h=300&fit=crop`. All other products display images correctly.

**Screenshot Reference:** Screenshot_2026-04-20_073325 — Broken image placeholder visible for "4K Webcam Pro" card in the top-left.

---

## BUG-006 — Order Detail Total Does Not Reflect Applied Discount

**Severity:** High

**Steps to Reproduce:**
1. Go to the Cart page.
2. Add one or more products.
3. Enter the discount code `SAVE10` and apply it.
4. Verify that a 10% discount is shown in the cart summary.
5. Fill in the checkout details and place the order.
6. Go to Orders and click "View" on the newly created order.

**Expected Behavior:** The order detail page should show the discounted total (with the 10% reduction applied) or display a line item indicating the discount.

**Actual Behavior:** The order detail page shows the full pre-discount total with no indication that a discount was applied. There is no discount line item in the order breakdown.

---

## BUG-007 — Overview Dashboard "Recent Orders" Shows Stale/Inconsistent Order Count

**Severity:** Medium

**Steps to Reproduce:**
1. Go to the Orders page and count the total orders — it states "12 total orders".
2. Navigate to the Overview dashboard.
3. Observe the "ORDERS" stat card.

**Expected Behavior:** The orders count on the Overview dashboard should match the total displayed on the Orders page.

**Actual Behavior:** The Overview shows "13" orders, while the Orders page lists only 12. The counts are out of sync. Additionally, the "4 fulfilled" sub-label on REVENUE does not correspond to the delivered orders visible in the order list (which shows 4 delivered orders — this part is correct — but the total is wrong).

**Screenshot Reference:** Screenshot_2026-04-20_072940 — Overview showing "13" orders; Orders page shows "12 total orders".

---

## BUG-008 — "Add New Product" Form Accepts Submission with Empty Required Fields

**Severity:** High

**Steps to Reproduce:**
1. Go to Products → click "Add product".
2. Leave the Name, Price, Stock, and Category fields completely empty.
3. Click "Create".

**Expected Behavior:** The form should validate required fields and display error messages (e.g., "Name is required", "Price must be a positive number"), preventing submission until all required fields are filled.

**Actual Behavior:** The form submits without any validation errors shown. No inline field-level error messages appear for empty required fields. This can lead to products being created with no name, $0 price, or zero stock.

---

## BUG-009 — Negative Price and Zero Stock Are Accepted on Product Form

**Severity:** High

**Steps to Reproduce:**
1. Go to Products → click "Add product" or click an existing product to edit.
2. Enter a negative value in the Price field (e.g., `-50`).
3. Enter `0` or a negative value in the Stock field.
4. Click "Create" / "Save changes".

**Expected Behavior:** The form should reject negative prices and warn on zero/negative stock values, as these are invalid product configurations for a retail admin system.

**Actual Behavior:** No validation error is shown. The form accepts negative prices and zero/negative stock values without any warning or rejection.

---

## BUG-010 — Low Stock Threshold Logic Inconsistent with Overview

**Severity:** Low

**Steps to Reproduce:**
1. Go to the Overview dashboard.
2. Observe the "Low Stock" panel on the right side — it lists Ultrawide Monitor 34 inch (5), Standing Desk Converter (8), and Ergonomic Office Chair (12).
3. Note that the Products stat card says "2 low stock".

**Expected Behavior:** The "2 low stock" number in the stat card should match the number of items listed in the Low Stock panel.

**Actual Behavior:** The stat card says "2 low stock" but the Low Stock panel shows 3 products. The threshold definition and count are inconsistent.

**Screenshot Reference:** Screenshot_2026-04-20_072940 — Overview panel showing 3 low-stock items but stat card showing "2 low stock".

---

## BUG-011 — Order Detail Page: Address Field Accepts and Displays Arbitrary Text

**Severity:** Low

**Steps to Reproduce:**
1. Go to Cart, add a product.
2. In the checkout form, enter a single nonsense word in the Address field (e.g., "test").
3. Place the order.
4. View the order detail page.

**Expected Behavior:** Either the address field should validate for a plausible format, or the order detail should clearly label the address as unverified/incomplete.

**Actual Behavior:** The order is placed with "test" as the address and displayed as-is on the order detail page with no validation warning.

**Screenshot Reference:** Screenshot_2026-04-20_072956 — ORD-1013 showing Address: "test".

---

## Testing Approach & What I Would Test Next

My testing approach followed a risk-based, user-journey strategy. I started from the most critical workflows — creating products, editing them, and placing orders — since these are the core CRUD operations that the entire admin panel depends on. I then moved to supporting features (search, filters, discounts, dashboard stats) and finally edge cases (empty form submission, invalid input values).

For each page I tested: happy path (valid inputs, expected flows), sad path (empty fields, invalid data, boundary values), and cross-page consistency (do counts and data match between Overview, Orders, and Products?).

**Given more time, I would test:**
- **Concurrent state**: Open the app in two browser tabs, make changes in one, and verify the other reflects them (tests real-time sync vs stale state).
- **Pagination edge cases**: Navigate to the last page, delete a product, and verify the page count updates correctly.
- **Discount code robustness**: Test expired codes, invalid codes, codes applied twice, codes with mixed-case input (e.g., `save10`, `Save10`).
- **Category filter + search combination**: Filter by "Electronics" then search — does search respect the active category filter?
- **Responsive/mobile layout**: Test on 375px viewport (mobile) for navigation collapse, card overflow, and form usability.
- **Order status filter persistence**: Apply a filter (e.g., "pending"), navigate to an order detail, click back — does the filter state restore?
- **Image URL validation**: What happens when a non-image URL or a URL with CORS restrictions is entered in the Image URL field?
- **XSS/injection**: Enter `<script>alert(1)</script>` in name/description fields to check for basic sanitisation.
