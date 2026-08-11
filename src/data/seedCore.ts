import type { VatRate, StaffUser, Supplier, Till, DiscountRule } from '../types'

export const VAT_RATES: VatRate[] = [
  { id: 'vat-std', name: 'Standard Rate', type: 'STANDARD', rate: 0.20 },
  { id: 'vat-zero', name: 'Zero-Rated', type: 'ZERO', rate: 0 },
  { id: 'vat-exempt', name: 'Exempt', type: 'EXEMPT', rate: 0 },
]

export const STAFF: StaffUser[] = [
  { id: 'stf-1', name: 'Sarah Jones', pin: '1234', role: 'CASHIER', active: true, avatarInitials: 'SJ' },
  { id: 'stf-2', name: 'Michael Osei', pin: '2345', role: 'MANAGER', active: true, avatarInitials: 'MO' },
  { id: 'stf-3', name: 'Priya Patel', pin: '3456', role: 'ADMIN', active: true, avatarInitials: 'PP' },
  { id: 'stf-4', name: 'Tom Fielding', pin: '4567', role: 'STAFF', active: true, avatarInitials: 'TF' },
]

export const SUPPLIERS: Supplier[] = [
  { id: 'sup-1', name: 'Fairway Foods Ltd', contact: 'orders@fairwayfoods.co.uk' },
  { id: 'sup-2', name: 'Titleist UK', contact: 'trade@titleist.co.uk' },
  { id: 'sup-3', name: 'ClubLine Apparel', contact: 'sales@clubline.co.uk' },
  { id: 'sup-4', name: 'Highland Beverage Co', contact: 'accounts@highlandbev.co.uk' },
]

export const TILLS: Till[] = [
  { id: 'till-1', name: 'Till 1', location: 'Clubhouse Bar', status: 'Open', currentStaffId: 'stf-1', currentStaffName: 'Sarah Jones', openingBalance: 150, expectedCash: 1245, openedAt: new Date(new Date().setHours(8, 0)).toISOString() },
  { id: 'till-2', name: 'Till 2', location: 'Pro Shop', status: 'Closed', openingBalance: 100, expectedCash: 100 },
  { id: 'till-3', name: 'Till 3', location: 'Halfway Hut', status: 'Closed', openingBalance: 75, expectedCash: 75 },
]

export const DISCOUNT_RULES: DiscountRule[] = [
  { id: 'disc-1', name: 'Full Member Discount', appliesTo: 'Full Member', percent: 10 },
  { id: 'disc-2', name: 'Junior Member Discount', appliesTo: 'Junior Member', percent: 10 },
  { id: 'disc-3', name: 'Social Member Discount', appliesTo: 'Social Member', percent: 5 },
  { id: 'disc-4', name: 'Corporate Discount', appliesTo: 'Corporate', percent: 5 },
  { id: 'disc-5', name: 'Staff Discount', appliesTo: 'Staff', percent: 20 },
  { id: 'disc-6', name: 'Guest', appliesTo: 'Guest', percent: 0 },
]

export const CLUB = {
  name: 'Royal Green Golf Club',
  address: '1 Fairway Lane, Surrey, GU21 4XJ',
  vatNumber: 'GB 123 4567 89',
  phone: '01483 555 0142',
}
