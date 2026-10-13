# Golf Club POS Prototype (Practice Project)

A self-directed practice project: an interactive, high-fidelity prototype of
the point-of-sale part of a golf-club management system. "Royal Green Golf
Club" is a made-up club used for the demo data.

This is a **prototype**, but the codebase is architected so the mock service
layer can be swapped for real HTTP calls to a FastAPI/PostgreSQL backend
with minimal changes to the UI.

---

## 1. Project structure

```
golf-pos/
├── src/
│   ├── types/           Domain types (mirrors intended Postgres schema)
│   ├── data/             Seed data: products, members, staff, tills, VAT rates
│   ├── services/         Mock "API" layer — one file per resource, all async
│   │   ├── db.ts               In-memory database + historical data generator
│   │   ├── productsService.ts
│   │   ├── membersService.ts
│   │   ├── ordersService.ts
│   │   ├── paymentsService.ts
│   │   ├── refundsService.ts
│   │   ├── inventoryService.ts
│   │   ├── tillsService.ts
│   │   ├── reportsService.ts
│   │   ├── staffService.ts
│   │   └── stripeService.ts    Stripe abstraction (mocked for the prototype)
│   ├── context/           React state: Auth, Till, Basket
│   ├── components/        Shared UI + POS-specific components (basket, modals)
│   ├── pages/              One file per sidebar route
│   ├── App.tsx, main.tsx, index.css
├── .env.example
└── package.json
```

## 2. How to run it

Requires Node.js 18+.

```bash
cd golf-pos
npm install
npm run dev
```

Open the URL Vite prints (typically `http://localhost:5173`).

To produce a static production build:

```bash
npm run build
npm run preview
```

## 3. Demo login credentials

Login is PIN-based, as it would be on a shared clubhouse terminal.

| PIN  | Name          | Role     |
|------|---------------|----------|
| 1234 | Sarah Jones   | Cashier  |
| 2345 | Michael Osei  | Manager  |
| 3456 | Priya Patel   | Admin    |
| 4567 | Tom Fielding  | Staff    |

## 4. Suggested demo flow (5–10 minutes)

1. Log in with PIN **1234** (Cashier).
2. You land on the **POS** screen.
3. Click **Find Member / Add Customer** → search "John Smith" → select him.
   His member pricing is now applied automatically to eligible products.
4. Add **Club Sandwich**, **Coffee**, and **Golf Gloves** to the basket.
5. Note the subtotal, member discount, VAT, and total in the basket panel.
6. Click **Pay**, choose **Apple Pay**.
7. The simulated Stripe Terminal appears — click **Simulate Successful Payment**.
8. View the payment confirmation, then **Continue to receipt**.
9. Print/email the receipt (simulated), then **New Sale**.
10. Go to **Orders** — the new order appears at the top with status *Paid*.
    Open it to see the full breakdown, payment record, and a **Refund** option.
11. Go to **Inventory** — Golf Gloves stock has been reduced by 1.
12. Go to **Dashboard** or **Reports** — today's sales and the new transaction
    are reflected in the charts and totals.

Other flows worth showing: **Refunds** (full / partial / per-item, from an
order's detail page), **Staff → Till Management** (open/close till with cash
reconciliation), **Settings** (VAT rates, discount rules, Stripe config,
audit log), and the barcode field on the POS screen (try `5051234500011`
for the Club Sandwich).

## 5. Main features implemented

- Full POS: categories, product grid, search, barcode entry, basket,
  quantity controls, line removal
- Member lookup (name / membership no. / email / phone) with automatic
  member pricing and a visible "Member price" badge
- Non-member customer types: Visitor, Guest, Staff, Corporate
- Basket-level percentage discounts plus automatic member pricing
- VAT calculated per product from configurable tax rates (Standard /
  Zero-rated / Exempt), shown net/VAT/gross throughout
- Full payment flow: Card, Contactless, Apple Pay, Google Pay, Cash, and
  Charge to Member Account, all via a clean Stripe service abstraction
- Simulated Stripe Terminal screen with success/fail/cancel outcomes
- Receipt screen with simulated print/email
- Orders list with date-range filters and search, full order detail
- Refunds: full, partial, and per-item, with reason codes and a simulated
  Stripe refund, updating order/payment status and the audit log
- Inventory: stock levels, low/out-of-stock badges, manual adjustments with
  history, automatic deduction on sale
- Products catalogue with VAT breakdown per item
- Members directory with account balance and account transaction history
- Customers view aggregated from order history
- Payments log with method/processor filters
- Till management: open/close with cash reconciliation and session history
- Staff accounts and role-based permission summary (Admin/Manager/Cashier/Staff)
- Dashboard and Reports: sales over time, category/payment-method mix, top
  products, VAT-by-rate breakdown, sales-by-staff
- Audit log of key actions (till open/close, refunds, stock adjustments)
- Error states: payment failure, insufficient member balance, out-of-stock
  products, invalid/unknown barcode, no member match

## 6. What is mocked

- **All data** lives in an in-memory store (`src/services/db.ts`), seeded on
  load with ~34 products, 8 members, and ~58 generated historical orders/
  payments/refunds so the dashboard and reports have something realistic to
  show. Refreshing the page resets everything to this seed state.
- **Stripe**: `src/services/stripeService.ts` is the single point of contact
  with Stripe. In demo mode it never makes a network call — it resolves with
  realistic fake IDs (`pi_demo_…`, `re_demo_…`) after a short simulated
  delay. No card numbers, CVV, or PINs are collected anywhere in the app.
- **Printing/emailing receipts** just flips a "sent" indicator in the UI.
- **Barcode scanning** is a text field you type or paste into — no hardware
  integration.
- **Authentication** is a 4-digit PIN check against the in-memory staff list,
  not a real session/JWT system.

## 7. What needs real Stripe credentials

Nothing in this prototype requires Stripe credentials to run — it's fully
functional in demo mode out of the box (`VITE_DEMO_MODE=true` in
`.env.example`). To move towards production:

- Add a FastAPI backend endpoint that calls `stripe.paymentIntents.create()`
  and returns the client secret — `createPaymentIntent()` in
  `stripeService.ts` would call that endpoint instead of mocking.
- For in-person payments, integrate the real **Stripe Terminal SDK** (a
  connected card reader) behind `processTerminalPayment()`.
- Add a backend endpoint wrapping `stripe.refunds.create()` for
  `refundPayment()`.
- The Stripe **secret key** must live only in backend environment variables
  and never be sent to the browser — only the publishable key is safe on
  the frontend, and only where Stripe.js needs it directly.

## 8. What would need to change for production

- Replace `src/services/db.ts` and the other service files' bodies with real
  `fetch()`/HTTP calls to a FastAPI backend — the function signatures were
  deliberately kept as the intended REST contract (see comments at the top
  of each service file), so consuming components shouldn't need to change.
- Stand up PostgreSQL with the schema outlined in `src/types/index.ts`
  (users, roles, members, customers, products, categories, inventory,
  inventory_movements, orders, order_items, payments, refunds,
  payment_methods, tills, till_sessions, discounts, member_accounts,
  member_account_transactions, tax_rates, suppliers, audit_logs).
- Real authentication: JWT or session-based, with PINs (or better,
  passwords/SSO) verified server-side, plus enforced role-based access
  control on every endpoint — the frontend role checks here are UI-only.
- Persist till sessions and enforce that a till must be opened before sales
  can be taken on it.
- Wire barcode scanning to real hardware (most USB/Bluetooth scanners act as
  keyboard input, so the existing text field will likely work unmodified).
- Real receipt printing (ESC/POS thermal printer integration) and
  transactional email sending.
- Connect to the wider golf club management platform (members, bookings,
  tee times, CRM, accounting) via shared services/APIs rather than the
  isolated mock data used here.
- Add automated tests, error monitoring, and proper environment-based
  configuration (staging/production Stripe keys, database URLs, etc).

## 9. Known limitations

- Data resets on page refresh (in-memory only) — by design, for a
  self-contained demo that needs no backend or database to run.
- "Hold Order" shows a confirmation but doesn't yet persist a resumable
  held basket — this is a placeholder for the intended workflow.
- Product/staff creation and editing (Add Product, Edit Product) are
  scaffolded in the service layer but not yet exposed as forms in the UI —
  only viewing is wired up for those two areas.
- Not tested on touch hardware; the layout is desktop-first with tablet-
  friendly spacing, and testing on a real touch screen would be the next
  step.
- Bundle isn't code-split yet (single ~200KB gzipped JS bundle) — fine for a
  demo, but worth addressing with route-based `lazy()` imports before
  production.
