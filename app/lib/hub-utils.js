'use client';


// TODO: add scheduled Shopify auto-sync orchestration in app automation layer.
// TODO: add Macron supplier queue generation from Needs Ordering states.
// TODO: add DHL inbound tracking event mapping into delivery updates.

export const DASHBOARD_STATUS_GROUPS = [
  { label: 'Total Orders', type: 'total' },
  { label: 'Needs Ordering', type: 'needs-ordering' },
  { label: 'Awaiting Delivery', status: 'Awaiting Delivery' },
  { label: 'Partially Delivered', status: 'Partially Delivered' },
  { label: 'Awaiting Artwork', status: 'Awaiting Artwork' },
  { label: 'In Production', status: 'In Production' },
  { label: 'Ready to Dispatch', status: 'Ready to Dispatch' },
  { label: 'Ready for Collection', status: 'Ready for Collection' },
  { label: 'Completed', status: 'Completed' }
];

export function buildDashboardSummary(orders) {
  return DASHBOARD_STATUS_GROUPS.map(group => {
    if (group.type === 'total') return { ...group, value: orders.length };
    if (group.type === 'needs-ordering') {
      return {
        ...group,
        value: orders.filter(order => order.needsOrderingFromMacron === 'Yes' && order.status !== 'Ordered from Macron').length
      };
    }
    return { ...group, value: orders.filter(order => order.status === group.status).length };
  });
}

export function applyOrderStatus(orders, orderId, status) {
  return orders.map(order =>
    order.id === orderId
      ? {
          ...order,
          status,
          updatedAt: new Date().toISOString()
        }
      : order
  );
}

export function getActionNeededOrders(orders) {
  const statuses = ['To Order from Macron', 'Delayed / Customs Hold', 'Awaiting Artwork'];
  return orders.filter(order => statuses.includes(order.status));
}
