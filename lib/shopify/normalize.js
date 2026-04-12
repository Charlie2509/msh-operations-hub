function extractNumericShopifyId(globalId = '') {
  return globalId.split('/').pop() || globalId;
}

function formatLineItems(lineItems) {
  const edges = Array.isArray(lineItems?.edges) ? lineItems.edges : [];
  if (edges.length === 0) {
    return 'No line items provided';
  }

  return edges
    .map(edge => {
      const name = edge?.node?.name || 'Item';
      const quantity = Number(edge?.node?.quantity || 1);
      return `${quantity}x ${name}`;
    })
    .join(', ');
}

function mapDeliveryStatus(fulfillmentStatus) {
  const status = (fulfillmentStatus || '').toUpperCase();

  if (status.includes('FULFILLED')) return 'Fully Delivered';
  if (status.includes('PARTIAL')) return 'Partially Delivered';
  if (status.includes('UNFULFILLED') || status.includes('REQUEST_DECLINED')) return 'Awaiting Delivery';
  return 'Awaiting Delivery';
}

export function normalizeShopifyOrder(shopifyOrder) {
  const numericExternalId = extractNumericShopifyId(shopifyOrder?.id || '');
  const customerName =
    [shopifyOrder?.customer?.firstName, shopifyOrder?.customer?.lastName].filter(Boolean).join(' ') ||
    shopifyOrder?.shippingAddress?.name ||
    'Unknown Customer';

  const lineItemsSummary = formatLineItems(shopifyOrder?.lineItems);

  return {
    id: `shopify-${numericExternalId || Date.now()}`,
    externalId: shopifyOrder?.id || '',
    sourceSystem: 'shopify',
    orderNumber: shopifyOrder?.name || `SHOPIFY-${numericExternalId}`,
    customerName,
    customerEmail: shopifyOrder?.email || shopifyOrder?.customer?.email || '',
    customerPhone: shopifyOrder?.phone || shopifyOrder?.shippingAddress?.phone || shopifyOrder?.customer?.phone || '',
    club: '',
    team: '',
    orderType: 'Web',
    status: 'New',
    boxType: 'Web Order',
    boxNumber: 1,
    personalisationDetails: '',
    missingItems: [],
    internalNotes: shopifyOrder?.note || '',
    needsOrderingFromMacron: 'No',
    deliveryStatus: mapDeliveryStatus(shopifyOrder?.displayFulfillmentStatus),
    paymentStatus: shopifyOrder?.displayFinancialStatus === 'PAID' ? 'Paid' : 'Awaiting Payment',
    lineItemsSummary,
    fulfillmentStyleInfo: shopifyOrder?.shippingLine?.title || shopifyOrder?.displayFulfillmentStatus || '',
    sourceLabel: 'Shopify/Web',
    createdAt: shopifyOrder?.createdAt || new Date().toISOString(),
    updatedAt: shopifyOrder?.updatedAt || new Date().toISOString(),
    deliveryTracking: []
  };
}
