import type { Member } from '../types'

export const MEMBERS: Member[] = [
  { id: 'mem-1', membershipNo: 'GC-10284', name: 'John Smith', email: 'john.smith@example.com', phone: '07700 900123', tier: 'Full Member', status: 'Active', accountBalance: 125.00, joined: '2018-03-14', discountPercent: 10 },
  { id: 'mem-2', membershipNo: 'GC-10391', name: 'Sarah Williams', email: 'sarah.williams@example.com', phone: '07700 900456', tier: 'Full Member', status: 'Active', accountBalance: 42.50, joined: '2020-06-02', discountPercent: 10 },
  { id: 'mem-3', membershipNo: 'GC-10412', name: 'David Brown', email: 'david.brown@example.com', phone: '07700 900789', tier: 'Social Member', status: 'Active', accountBalance: 0, joined: '2021-11-20', discountPercent: 5 },
  { id: 'mem-4', membershipNo: 'GC-10457', name: 'James Wilson', email: 'james.wilson@example.com', phone: '07700 900321', tier: 'Full Member', status: 'Active', accountBalance: 210.00, joined: '2016-01-09', discountPercent: 10 },
  { id: 'mem-5', membershipNo: 'GC-10502', name: 'Michael Taylor', email: 'michael.taylor@example.com', phone: '07700 900654', tier: 'Junior Member', status: 'Active', accountBalance: 15.00, joined: '2023-04-18', discountPercent: 10 },
  { id: 'mem-6', membershipNo: 'GC-10530', name: 'Emma Clarke', email: 'emma.clarke@example.com', phone: '07700 900987', tier: 'Corporate', status: 'Active', accountBalance: 0, joined: '2022-09-01', discountPercent: 5 },
  { id: 'mem-7', membershipNo: 'GC-09876', name: 'Robert Green', email: 'robert.green@example.com', phone: '07700 900111', tier: 'Full Member', status: 'Suspended', accountBalance: -15.00, joined: '2015-07-23', discountPercent: 10 },
  { id: 'mem-8', membershipNo: 'GC-08234', name: 'Alice Turner', email: 'alice.turner@example.com', phone: '07700 900222', tier: 'Social Member', status: 'Lapsed', accountBalance: 0, joined: '2012-05-30', discountPercent: 5 },
]
