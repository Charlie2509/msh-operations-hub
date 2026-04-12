export const ORDER_STATUSES = [
  'New',
  'Stock Check',
  'Partially Allocated',
  'To Order from Macron',
  'Ordered from Macron',
  'Awaiting Delivery',
  'Partially Delivered',
  'Fully Delivered',
  'Awaiting Artwork',
  'In Production',
  'Ready to Dispatch',
  'Ready for Collection',
  'Completed',
  'Delayed / Customs Hold'
];

export const BOX_TYPES = {
  Reserve: [1, 2, 3, 4, 5, 6, 7, 8],
  'Small Order': [1, 2, 3, 4, 5],
  'Web Order': [1, 2, 3, 4]
};

export const DELIVERY_STATUSES = [
  'Not Ordered Yet',
  'Awaiting Delivery',
  'Partially Delivered',
  'Fully Delivered',
  'Delayed / Customs Hold'
];

export const PAYMENT_STATUSES = [
  'Not Required Yet',
  'Awaiting Payment',
  'Part Paid',
  'Paid'
];

export const ORDER_TYPES = ['Web', 'Instore', 'Email', 'Phone', 'Bulk Club'];

export const orders = [
  {
    id: '1001',
    orderNumber: 'WEB-1001',
    customerName: 'Tom Harris',
    club: 'Worthing FC',
    team: 'U14',
    orderType: 'Web',
    status: 'Awaiting Artwork',
    boxType: 'Web Order',
    boxNumber: 2,
    personalisationDetails: 'Badge + initials TH',
    missingItems: [{ id: 'm-1001-1', name: 'Red training top', size: 'M', quantity: 1, fulfilled: false, receivedQuantity: 0 }],
    internalNotes: 'Badges and initials in stock. Waiting on one Macron garment.',
    customerPhone: '07400111222',
    customerEmail: 'tom@example.com',
    needsOrderingFromMacron: 'Yes',
    deliveryStatus: 'Partially Delivered',
    paymentStatus: 'Paid',
    deliveryTracking: []
  },
  {
    id: '1002',
    orderNumber: 'EMAIL-1002',
    customerName: 'Eastbourne United Admin',
    club: 'Eastbourne United AFC',
    team: 'First Team',
    orderType: 'Email',
    status: 'Ordered from Macron',
    boxType: 'Reserve',
    boxNumber: 4,
    personalisationDetails: 'Full squad numbers and badges',
    missingItems: [{ id: 'm-1002-1', name: 'Full delivery', size: '', quantity: 1, fulfilled: false, receivedQuantity: 0 }],
    internalNotes: 'Artwork approved and paid. Split delivery expected.',
    customerPhone: '01323 555555',
    customerEmail: 'kitorders@eastbourneunited.example',
    needsOrderingFromMacron: 'Yes',
    deliveryStatus: 'Awaiting Delivery',
    paymentStatus: 'Paid',
    deliveryTracking: []
  },
  {
    id: '1003',
    orderNumber: 'POS-1003',
    customerName: 'Jake Miller',
    club: 'Hastings United',
    team: '',
    orderType: 'Instore',
    status: 'Ready for Collection',
    boxType: 'Small Order',
    boxNumber: 1,
    personalisationDetails: 'Initials JM',
    missingItems: [],
    internalNotes: 'Ready for customer text once POS flow is finalised.',
    customerPhone: '07555123456',
    customerEmail: 'jake@example.com',
    needsOrderingFromMacron: 'No',
    deliveryStatus: 'Fully Delivered',
    paymentStatus: 'Paid',
    deliveryTracking: []
  }
];
