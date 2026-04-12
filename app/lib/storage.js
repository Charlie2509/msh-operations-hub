'use client';

import { orders as seededOrders } from '../data/orders';
import { normalizeOrder } from './order-utils';

const ORDERS_KEY = 'msh_orders_v1';
const DELIVERIES_KEY = 'msh_deliveries_v1';
const HUB_EVENT = 'msh-hub-updated';

const isBrowser = typeof window !== 'undefined';

function safeParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeOrdersCollection(rawOrders) {
  return rawOrders.map((order, index) => normalizeOrder(order, index));
}

function emitHubUpdated() {
  if (isBrowser) {
    window.dispatchEvent(new Event(HUB_EVENT));
  }
}

function persistOrders(orders) {
  window.localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  emitHubUpdated();
}

export function getOrders() {
  if (!isBrowser) {
    return normalizeOrdersCollection(seededOrders);
  }

  const stored = window.localStorage.getItem(ORDERS_KEY);

  if (!stored) {
    const normalizedSeed = normalizeOrdersCollection(seededOrders);
    persistOrders(normalizedSeed);
    return normalizedSeed;
  }

  const parsed = safeParse(stored, seededOrders);
  const normalized = normalizeOrdersCollection(parsed);
  persistOrders(normalized);
  return normalized;
}

export function saveOrders(nextOrders) {
  if (!isBrowser) return;
  persistOrders(normalizeOrdersCollection(nextOrders));
}

export function createOrder(orderInput) {
  const allOrders = getOrders();
  const now = new Date().toISOString();
  const nextOrder = normalizeOrder(
    {
      id: `local-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
      sourceSystem: 'manual',
      externalId: '',
      lineItemsSummary: '',
      sourceLabel: 'Manual',
      ...orderInput,
      boxNumber: Number(orderInput.boxNumber)
    },
    0
  );

  const updated = [nextOrder, ...allOrders];
  saveOrders(updated);
  return nextOrder;
}

export function importShopifyOrders(shopifyOrders) {
  const allOrders = getOrders();

  const dedupeSet = new Set(
    allOrders.flatMap(order => [order.externalId ? `external:${order.externalId}` : '', order.orderNumber ? `number:${order.orderNumber}` : ''])
  );

  const uniqueImports = [];
  for (const order of shopifyOrders || []) {
    const externalKey = order.externalId ? `external:${order.externalId}` : '';
    const orderNumberKey = order.orderNumber ? `number:${order.orderNumber}` : '';

    if ((externalKey && dedupeSet.has(externalKey)) || (orderNumberKey && dedupeSet.has(orderNumberKey))) continue;

    uniqueImports.push(normalizeOrder({ ...order, sourceSystem: 'shopify', sourceLabel: 'Shopify/Web' }));
    if (externalKey) dedupeSet.add(externalKey);
    if (orderNumberKey) dedupeSet.add(orderNumberKey);
  }

  if (uniqueImports.length === 0) {
    return { importedCount: 0, skippedCount: (shopifyOrders || []).length, orders: allOrders };
  }

  const updated = [...uniqueImports, ...allOrders];
  saveOrders(updated);

  return {
    importedCount: uniqueImports.length,
    skippedCount: (shopifyOrders || []).length - uniqueImports.length,
    orders: updated
  };
}

export function updateOrder(orderId, updates) {
  const allOrders = getOrders();
  const updated = allOrders.map(order =>
    order.id === orderId
      ? normalizeOrder(
          {
            ...order,
            ...updates,
            updatedAt: new Date().toISOString(),
            boxNumber: Number(updates.boxNumber ?? order.boxNumber)
          },
          0
        )
      : order
  );

  saveOrders(updated);
  return updated.find(order => order.id === orderId) || null;
}

export function getDeliveries() {
  if (!isBrowser) return [];

  const stored = window.localStorage.getItem(DELIVERIES_KEY);

  if (!stored) {
    window.localStorage.setItem(DELIVERIES_KEY, JSON.stringify([]));
    return [];
  }

  const parsed = safeParse(stored, []);
  return parsed.map(delivery => ({ ...delivery, items: Array.isArray(delivery.items) ? delivery.items : [] }));
}

export function saveDeliveries(deliveries) {
  if (!isBrowser) return;
  window.localStorage.setItem(DELIVERIES_KEY, JSON.stringify(deliveries));
  emitHubUpdated();
}

export function createDelivery(deliveryInput) {
  const allDeliveries = getDeliveries();
  const nextDelivery = {
    id: `delivery-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: 'Unmatched',
    items: [],
    ...deliveryInput
  };

  const updated = [nextDelivery, ...allDeliveries];
  saveDeliveries(updated);
  return nextDelivery;
}

export function updateDelivery(deliveryId, updates) {
  const allDeliveries = getDeliveries();
  const updated = allDeliveries.map(delivery => (delivery.id === deliveryId ? { ...delivery, ...updates } : delivery));
  saveDeliveries(updated);
  return updated.find(delivery => delivery.id === deliveryId) || null;
}

export function subscribeHubUpdates(callback) {
  if (!isBrowser) return () => {};
  const handler = () => callback();
  window.addEventListener(HUB_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(HUB_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}
