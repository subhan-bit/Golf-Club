// ─────────────────────────────────────────────────────────────────────────
// Domain types. These mirror the intended production database schema
// (see /docs or README) so the mock service layer can later be swapped
// for real API calls with minimal changes to consuming components.
// ─────────────────────────────────────────────────────────────────────────

export type Role = 'ADMIN' | 'MANAGER' | 'CASHIER' | 'STAFF'

export interface StaffUser {
  id: string
  name: string
  pin: string // demo-only login PIN, never a real credential store
  role: Role
  active: boolean
  avatarInitials: string
}

export type VatRateType = 'STANDARD' | 'ZERO' | 'EXEMPT'

export interface VatRate {
  id: string
  name: string
  type: VatRateType
  rate: number // 0.20 = 20%
}

export type ProductCategory =
  | 'Food'
  | 'Drinks'
  | 'Bar'
  | 'Pro Shop'
  | 'Golf Equipment'
  | 'Clothing'
  | 'Membership'
  | 'Services'

export interface Product {
  id: string
  sku: string
  barcode: string
  name: string
  description?: string
  category: ProductCategory
  costPrice: number
  sellPrice: number
  memberPrice?: number
  vatRateId: string
  stockQty: number
  minStock: number
  supplierId?: string
  active: boolean
  imageEmoji: string // stand-in for product imagery in the prototype
}

export interface Supplier {
  id: string
  name: string
  contact: string
}

export type MembershipTier = 'Full Member' | 'Junior Member' | 'Social Member' | 'Corporate'
export type MembershipStatus = 'Active' | 'Suspended' | 'Lapsed'

export interface Member {
  id: string
  membershipNo: string
  name: string
  email: string
  phone: string
  tier: MembershipTier
  status: MembershipStatus
  accountBalance: number
  joined: string
  discountPercent: number
}

export type CustomerType = 'Member' | 'Visitor' | 'Guest' | 'Staff' | 'Corporate'

export interface Customer {
  id: string
  type: CustomerType
  name: string
  email?: string
  phone?: string
  memberId?: string
}

export interface BasketLine {
  lineId: string
  product: Product
  qty: number
  unitPrice: number // resolved price (member or standard) at time of adding
  memberDiscountApplied: boolean
  lineDiscountPercent?: number
  lineDiscountAmount?: number
}

export type PaymentMethodType =
  | 'Card'
  | 'Contactless'
  | 'Apple Pay'
  | 'Google Pay'
  | 'Cash'
  | 'Member Account'

export type OrderStatus = 'Held' | 'Paid' | 'Partially Refunded' | 'Refunded' | 'Failed' | 'Cancelled'

export interface OrderItem {
  id: string
  productId: string
  productName: string
  qty: number
  unitPrice: number
  vatRate: number
  discountAmount: number
  lineTotal: number // gross, after discount
  refundedQty: number
}

export interface Order {
  id: string
  orderNumber: string
  createdAt: string
  staffId: string
  staffName: string
  tillId: string
  customer?: Customer
  items: OrderItem[]
  subtotal: number
  discountTotal: number
  vatTotal: number
  total: number
  status: OrderStatus
  paymentId?: string
}

export interface PaymentTransaction {
  id: string
  txnNumber: string
  orderId: string
  orderNumber: string
  customerName?: string
  amount: number
  method: PaymentMethodType
  processor: 'Stripe' | 'Cash' | 'Internal'
  status: 'Paid' | 'Failed' | 'Refunded' | 'Partially Refunded'
  stripePaymentId?: string
  createdAt: string
}

export type RefundReason = 'Customer request' | 'Incorrect order' | 'Damaged item' | 'Other'

export interface Refund {
  id: string
  refundNumber: string
  orderId: string
  orderNumber: string
  amount: number
  reason: RefundReason
  note?: string
  staffName: string
  stripeRefundId?: string
  createdAt: string
  type: 'Full' | 'Partial' | 'Item'
}

export interface Till {
  id: string
  name: string
  location: string
  status: 'Open' | 'Closed'
  currentStaffId?: string
  currentStaffName?: string
  openingBalance: number
  expectedCash: number
  openedAt?: string
}

export interface TillSession {
  id: string
  tillId: string
  staffName: string
  openedAt: string
  closedAt?: string
  openingBalance: number
  expectedCash: number
  actualCash?: number
  difference?: number
  cashSales: number
  cardSales: number
}

export interface InventoryMovement {
  id: string
  productId: string
  productName: string
  type: 'Sale' | 'Adjustment' | 'Restock' | 'Waste'
  qtyChange: number
  balanceAfter: number
  staffName: string
  note?: string
  createdAt: string
}

export interface AuditLogEntry {
  id: string
  timestamp: string
  staffName: string
  action: string
  detail: string
}

export interface DiscountRule {
  id: string
  name: string
  appliesTo: 'Full Member' | 'Junior Member' | 'Social Member' | 'Corporate' | 'Staff' | 'Guest'
  percent: number
}

export interface MemberAccountTransaction {
  id: string
  memberId: string
  type: 'Charge' | 'Top Up' | 'Refund'
  amount: number
  balanceAfter: number
  orderNumber?: string
  createdAt: string
}

// New types for Tee Sheet booking module
export type TeeTimeStatus = 'Available' | 'Booked' | 'Blocked'

export interface TeeSlot {
  id: string;
  date: string;
  time: string;
  holes: 9 | 18;
  maxPlayers: number;
  status: TeeTimeStatus;
}

export interface TeeBookingPlayer {
  name: string;
  customerId?: string;
  isMember: boolean;
}

export interface TeeBooking {
  id: string;
  slotId: string;
  date: string;
  time: string;
  players: TeeBookingPlayer[];
  buggy: boolean;
  notes?: string;
  createdAt: string;
  createdByStaffId: string;
  status: 'Confirmed' | 'Cancelled';
}
