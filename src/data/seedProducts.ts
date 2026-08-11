import type { Product } from '../types'

// 30+ realistic golf-club products across all categories.
// vatRateId references VAT_RATES in seedCore.ts
let n = 0
const id = () => `prod-${String(++n).padStart(3, '0')}`

export const PRODUCTS: Product[] = [
  // FOOD (mostly standard-rated when eaten in / hot food)
  { id: id(), sku: 'FD-001', barcode: '5051234500011', name: 'Club Sandwich', category: 'Food', costPrice: 3.20, sellPrice: 8.95, memberPrice: 7.95, vatRateId: 'vat-std', stockQty: 24, minStock: 8, supplierId: 'sup-1', active: true, imageEmoji: '🥪' },
  { id: id(), sku: 'FD-002', barcode: '5051234500028', name: 'Caesar Salad', category: 'Food', costPrice: 3.00, sellPrice: 9.50, memberPrice: 8.50, vatRateId: 'vat-std', stockQty: 18, minStock: 6, supplierId: 'sup-1', active: true, imageEmoji: '🥗' },
  { id: id(), sku: 'FD-003', barcode: '5051234500035', name: 'Steak Pie', category: 'Food', costPrice: 4.50, sellPrice: 12.50, memberPrice: 11.00, vatRateId: 'vat-std', stockQty: 15, minStock: 5, supplierId: 'sup-1', active: true, imageEmoji: '🥧' },
  { id: id(), sku: 'FD-004', barcode: '5051234500042', name: 'Soup of the Day', category: 'Food', costPrice: 1.50, sellPrice: 5.50, memberPrice: 4.95, vatRateId: 'vat-std', stockQty: 20, minStock: 5, supplierId: 'sup-1', active: true, imageEmoji: '🍲' },
  { id: id(), sku: 'FD-005', barcode: '5051234500059', name: 'Fish & Chips', category: 'Food', costPrice: 5.00, sellPrice: 13.95, memberPrice: 12.50, vatRateId: 'vat-std', stockQty: 12, minStock: 5, supplierId: 'sup-1', active: true, imageEmoji: '🍟' },
  { id: id(), sku: 'FD-006', barcode: '5051234500066', name: 'Bacon Roll', category: 'Food', costPrice: 1.80, sellPrice: 5.95, memberPrice: 5.25, vatRateId: 'vat-std', stockQty: 3, minStock: 8, supplierId: 'sup-1', active: true, imageEmoji: '🥓' },
  { id: id(), sku: 'FD-007', barcode: '5051234500073', name: 'Shortbread (packet)', category: 'Food', costPrice: 0.80, sellPrice: 2.50, vatRateId: 'vat-zero', stockQty: 40, minStock: 10, supplierId: 'sup-1', active: true, imageEmoji: '🍪' },

  // DRINKS (non-alcoholic — standard rate for consumed on-premises)
  { id: id(), sku: 'DR-001', barcode: '5051234500080', name: 'Coca-Cola', category: 'Drinks', costPrice: 0.60, sellPrice: 2.50, vatRateId: 'vat-std', stockQty: 60, minStock: 20, supplierId: 'sup-4', active: true, imageEmoji: '🥤' },
  { id: id(), sku: 'DR-002', barcode: '5051234500097', name: 'Coffee', category: 'Drinks', costPrice: 0.45, sellPrice: 3.00, vatRateId: 'vat-std', stockQty: 999, minStock: 0, supplierId: 'sup-4', active: true, imageEmoji: '☕' },
  { id: id(), sku: 'DR-003', barcode: '5051234500103', name: 'Tea', category: 'Drinks', costPrice: 0.35, sellPrice: 2.50, vatRateId: 'vat-std', stockQty: 999, minStock: 0, supplierId: 'sup-4', active: true, imageEmoji: '🍵' },
  { id: id(), sku: 'DR-004', barcode: '5051234500110', name: 'Orange Juice', category: 'Drinks', costPrice: 0.90, sellPrice: 3.25, vatRateId: 'vat-std', stockQty: 30, minStock: 10, supplierId: 'sup-4', active: true, imageEmoji: '🧃' },
  { id: id(), sku: 'DR-005', barcode: '5051234500127', name: 'Sparkling Water', category: 'Drinks', costPrice: 0.55, sellPrice: 2.75, vatRateId: 'vat-std', stockQty: 45, minStock: 15, supplierId: 'sup-4', active: true, imageEmoji: '💧' },

  // BAR (alcoholic — standard rate)
  { id: id(), sku: 'BR-001', barcode: '5051234500134', name: 'Beer (Pint)', category: 'Bar', costPrice: 1.80, sellPrice: 5.50, memberPrice: 5.00, vatRateId: 'vat-std', stockQty: 80, minStock: 20, supplierId: 'sup-4', active: true, imageEmoji: '🍺' },
  { id: id(), sku: 'BR-002', barcode: '5051234500141', name: 'House Wine (Glass)', category: 'Bar', costPrice: 2.20, sellPrice: 7.00, memberPrice: 6.25, vatRateId: 'vat-std', stockQty: 36, minStock: 12, supplierId: 'sup-4', active: true, imageEmoji: '🍷' },
  { id: id(), sku: 'BR-003', barcode: '5051234500158', name: 'Gin & Tonic', category: 'Bar', costPrice: 2.00, sellPrice: 8.00, vatRateId: 'vat-std', stockQty: 5, minStock: 10, supplierId: 'sup-4', active: true, imageEmoji: '🍸' },
  { id: id(), sku: 'BR-004', barcode: '5051234500165', name: 'Whisky (Single)', category: 'Bar', costPrice: 2.80, sellPrice: 9.50, vatRateId: 'vat-std', stockQty: 22, minStock: 8, supplierId: 'sup-4', active: true, imageEmoji: '🥃' },
  { id: id(), sku: 'BR-005', barcode: '5051234500172', name: 'Prosecco (Bottle)', category: 'Bar', costPrice: 8.00, sellPrice: 24.00, vatRateId: 'vat-std', stockQty: 10, minStock: 4, supplierId: 'sup-4', active: true, imageEmoji: '🍾' },

  // PRO SHOP
  { id: id(), sku: 'PS-001', barcode: '5051234500189', name: 'Golf Balls (Sleeve of 3)', category: 'Pro Shop', costPrice: 8.00, sellPrice: 18.00, memberPrice: 16.00, vatRateId: 'vat-std', stockQty: 45, minStock: 15, supplierId: 'sup-2', active: true, imageEmoji: '⛳' },
  { id: id(), sku: 'PS-002', barcode: '5051234500196', name: 'Golf Gloves', category: 'Pro Shop', costPrice: 6.50, sellPrice: 15.00, memberPrice: 12.00, vatRateId: 'vat-std', stockQty: 11, minStock: 10, supplierId: 'sup-2', active: true, imageEmoji: '🧤' },
  { id: id(), sku: 'PS-003', barcode: '5051234500202', name: 'Golf Cap', category: 'Pro Shop', costPrice: 10.00, sellPrice: 25.00, memberPrice: 21.00, vatRateId: 'vat-std', stockQty: 28, minStock: 10, supplierId: 'sup-3', active: true, imageEmoji: '🧢' },
  { id: id(), sku: 'PS-004', barcode: '5051234500219', name: 'Tee Pegs (Pack of 50)', category: 'Pro Shop', costPrice: 1.50, sellPrice: 4.50, vatRateId: 'vat-std', stockQty: 2, minStock: 15, supplierId: 'sup-2', active: true, imageEmoji: '📍' },
  { id: id(), sku: 'PS-005', barcode: '5051234500226', name: 'Golf Umbrella', category: 'Pro Shop', costPrice: 12.00, sellPrice: 32.00, memberPrice: 28.00, vatRateId: 'vat-std', stockQty: 9, minStock: 5, supplierId: 'sup-3', active: true, imageEmoji: '☂️' },
  { id: id(), sku: 'PS-006', barcode: '5051234500233', name: 'Ball Marker Set', category: 'Pro Shop', costPrice: 3.00, sellPrice: 9.00, vatRateId: 'vat-std', stockQty: 33, minStock: 10, supplierId: 'sup-2', active: true, imageEmoji: '🔘' },

  // GOLF EQUIPMENT
  { id: id(), sku: 'GE-001', barcode: '5051234500240', name: 'Driver — Titleist TSR2', category: 'Golf Equipment', costPrice: 220.00, sellPrice: 399.00, memberPrice: 379.00, vatRateId: 'vat-std', stockQty: 4, minStock: 2, supplierId: 'sup-2', active: true, imageEmoji: '🏌️' },
  { id: id(), sku: 'GE-002', barcode: '5051234500257', name: 'Iron Set (7-piece)', category: 'Golf Equipment', costPrice: 380.00, sellPrice: 649.00, memberPrice: 599.00, vatRateId: 'vat-std', stockQty: 3, minStock: 1, supplierId: 'sup-2', active: true, imageEmoji: '⛏️' },
  { id: id(), sku: 'GE-003', barcode: '5051234500264', name: 'Putter', category: 'Golf Equipment', costPrice: 90.00, sellPrice: 159.00, memberPrice: 145.00, vatRateId: 'vat-std', stockQty: 6, minStock: 2, supplierId: 'sup-2', active: true, imageEmoji: '🥌' },
  { id: id(), sku: 'GE-004', barcode: '5051234500271', name: 'Golf Bag — Stand', category: 'Golf Equipment', costPrice: 85.00, sellPrice: 149.00, memberPrice: 135.00, vatRateId: 'vat-std', stockQty: 7, minStock: 3, supplierId: 'sup-2', active: true, imageEmoji: '🎒' },

  // CLOTHING
  { id: id(), sku: 'CL-001', barcode: '5051234500288', name: 'Polo Shirt', category: 'Clothing', costPrice: 16.00, sellPrice: 45.00, memberPrice: 39.00, vatRateId: 'vat-std', stockQty: 34, minStock: 10, supplierId: 'sup-3', active: true, imageEmoji: '👕' },
  { id: id(), sku: 'CL-002', barcode: '5051234500295', name: 'Waterproof Jacket', category: 'Clothing', costPrice: 45.00, sellPrice: 129.00, memberPrice: 115.00, vatRateId: 'vat-std', stockQty: 14, minStock: 5, supplierId: 'sup-3', active: true, imageEmoji: '🧥' },
  { id: id(), sku: 'CL-003', barcode: '5051234500301', name: 'Golf Trousers', category: 'Clothing', costPrice: 22.00, sellPrice: 65.00, memberPrice: 58.00, vatRateId: 'vat-std', stockQty: 19, minStock: 6, supplierId: 'sup-3', active: true, imageEmoji: '👖' },
  { id: id(), sku: 'CL-004', barcode: '5051234500318', name: 'Golf Socks (Pair)', category: 'Clothing', costPrice: 3.50, sellPrice: 9.50, vatRateId: 'vat-std', stockQty: 50, minStock: 15, supplierId: 'sup-3', active: true, imageEmoji: '🧦' },

  // MEMBERSHIP (exempt from VAT — sport subscription)
  { id: id(), sku: 'MB-001', barcode: '5051234500325', name: 'Visitor Day Membership', category: 'Membership', costPrice: 0, sellPrice: 35.00, vatRateId: 'vat-exempt', stockQty: 999, minStock: 0, active: true, imageEmoji: '🪪' },
  { id: id(), sku: 'MB-002', barcode: '5051234500332', name: 'Guest Pass', category: 'Membership', costPrice: 0, sellPrice: 15.00, vatRateId: 'vat-exempt', stockQty: 999, minStock: 0, active: true, imageEmoji: '🎫' },

  // SERVICES
  { id: id(), sku: 'SV-001', barcode: '5051234500349', name: 'Buggy Hire (18 holes)', category: 'Services', costPrice: 0, sellPrice: 35.00, memberPrice: 28.00, vatRateId: 'vat-std', stockQty: 999, minStock: 0, active: true, imageEmoji: '🛺' },
  { id: id(), sku: 'SV-002', barcode: '5051234500356', name: 'Golf Cart Hire', category: 'Services', costPrice: 0, sellPrice: 25.00, memberPrice: 20.00, vatRateId: 'vat-std', stockQty: 999, minStock: 0, active: true, imageEmoji: '🚗' },
  { id: id(), sku: 'SV-003', barcode: '5051234500363', name: 'Club Rental (Full Set)', category: 'Services', costPrice: 0, sellPrice: 30.00, memberPrice: 25.00, vatRateId: 'vat-std', stockQty: 999, minStock: 0, active: true, imageEmoji: '🎿' },
  { id: id(), sku: 'SV-004', barcode: '5051234500370', name: 'Driving Range Bucket (Large)', category: 'Services', costPrice: 1.00, sellPrice: 6.00, memberPrice: 4.50, vatRateId: 'vat-std', stockQty: 999, minStock: 0, active: true, imageEmoji: '🥎' },
  { id: id(), sku: 'SV-005', barcode: '5051234500387', name: 'Lesson with Pro (30 min)', category: 'Services', costPrice: 0, sellPrice: 40.00, vatRateId: 'vat-std', stockQty: 999, minStock: 0, active: true, imageEmoji: '👨‍🏫' },
]
