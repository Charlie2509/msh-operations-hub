'use client';

export function parseLegacyMissingItems(value) {
  if (!value || typeof value !== 'string' || !value.trim()) {
    return [];
  }

  const text = value.trim();
  const qtyMatch = text.match(/(\d+)/);
  const quantity = qtyMatch ? Number(qtyMatch[1]) : 1;
  let remainder = text.replace(/^[^a-zA-Z0-9]*\d+\s*x?\s*/i, '').trim();

  let size = '';
  const sizeMatch = remainder.match(/\b(xx?s|s|m|l|xl|xxl|xxxl|\d{1,2})\b/i);
  if (sizeMatch) {
    size = sizeMatch[1].toUpperCase();
    remainder = remainder.replace(sizeMatch[0], '').trim();
  }

  return [
    {
      id: `missing-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: remainder || text,
      size,
      quantity,
      fulfilled: false,
      receivedQuantity: 0
    }
  ];
}

export function normalizeMissingItem(item, index = 0) {
  return {
    id: item?.id || `missing-${index}-${Math.random().toString(36).slice(2, 7)}`,
    name: item?.name || '',
    size: item?.size || '',
    quantity: Number(item?.quantity || 1),
    fulfilled: Boolean(item?.fulfilled),
    receivedQuantity: Number(item?.receivedQuantity || 0),
    club: item?.club || ''
  };
}

export function normalizeOrder(order, index = 0) {
  const structuredItems = Array.isArray(order.missingItems)
    ? order.missingItems.map((item, itemIndex) => normalizeMissingItem(item, itemIndex))
    : parseLegacyMissingItems(order.missingItems);

  const hasOpenMissing = structuredItems.some(item => !item.fulfilled);
  const nowIso = new Date().toISOString();

  return {
    ...order,
    id: order?.id || `local-${Date.now()}-${index}`,
    orderNumber: order?.orderNumber || `LOCAL-${String(index + 1).padStart(4, '0')}`,
    customerName: order?.customerName || 'Unknown Customer',
    sourceSystem: order?.sourceSystem || 'manual',
    externalId: order?.externalId || '',
    lineItemsSummary: order?.lineItemsSummary || '',
    sourceLabel: order?.sourceLabel || (order?.sourceSystem === 'shopify' ? 'Shopify/Web' : 'Manual'),
    createdAt: order?.createdAt || nowIso,
    updatedAt: order?.updatedAt || order?.createdAt || nowIso,
    missingItems: structuredItems,
    legacyMissingItemsText: typeof order.missingItems === 'string' ? order.missingItems : order.legacyMissingItemsText || '',
    deliveryTracking: Array.isArray(order.deliveryTracking) ? order.deliveryTracking : [],
    deliveryStatus: order.deliveryStatus || (hasOpenMissing ? 'Awaiting Delivery' : 'Fully Delivered')
  };
}

export function getMissingSummary(order) {
  const items = Array.isArray(order?.missingItems) ? order.missingItems : [];
  const open = items.filter(item => !item.fulfilled);
  if (open.length === 0) {
    return 'No missing items';
  }
  return open.map(item => `${item.quantity}x ${item.name}${item.size ? ` (${item.size})` : ''}`).join(', ');
}
