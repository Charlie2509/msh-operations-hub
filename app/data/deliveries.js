export const deliveries = [
  {
    id: 'delivery-2001',
    reference: 'MAC-APR-2001',
    deliveryDate: '2026-04-08',
    notes: 'Initial partial shipment for WEB-1001 and EMAIL-1002.',
    customsHold: 'No',
    partialDelivery: 'Yes',
    status: 'Partially Delivered',
    createdAt: '2026-04-08T09:00:00.000Z',
    items: [
      {
        id: 'd-item-2001-1',
        name: 'Red training top',
        size: 'M',
        quantity: 1,
        club: 'Worthing FC',
        matchedOrderId: '1001',
        matchedQuantity: 1
      },
      {
        id: 'd-item-2001-2',
        name: 'Full delivery',
        size: '',
        quantity: 1,
        club: 'Eastbourne United AFC',
        matchedOrderId: '',
        matchedQuantity: 0
      }
    ]
  }
];
