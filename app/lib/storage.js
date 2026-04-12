'use client';

import { orders as seededOrders } from '../data/orders';
import { normalizeOrder } from './order-utils';

const ORDERS_KEY = 'msh_orders_v1';
const DELIVERIES_KEY = 'msh_deliveries_v1';

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

function persistOrders(orders) {
  window.localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
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
  if (!isBrowser) {
    return;
  }

  persistOrders(normalizeOrdersCollection(nextOrders));
}

export function createOrder(orderInput) {
  const allOrders = getOrders();
  const nextOrder = normalizeOrder(
    {
      id: `local-${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...orderInput,
      boxNumber: Number(orderInput.boxNumber)
    },
    0
  );

  const updated = [nextOrder, ...allOrders];
  saveOrders(updated);
  return nextOrder;
}

export function updateOrder(orderId, updates) {
  const allOrders = getOrders();
  const updated = allOrders.map(order =>
    order.id === orderId
      ? normalizeOrder(
          {
            ...order,
            ...updates,
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
  if (!isBrowser) {
    return [];
  }

  const stored = window.localStorage.getItem(DELIVERIES_KEY);

  if (!stored) {
    window.localStorage.setItem(DELIVERIES_KEY, JSON.stringify([]));
    return [];
  }

  const parsed = safeParse(stored, []);
  return parsed.map(delivery => ({
    ...delivery,
    items: Array.isArray(delivery.items) ? delivery.items : []
  }));
}

export function saveDeliveries(deliveries) {
  if (!isBrowser) {
    return;
  }
  window.localStorage.setItem(DELIVERIES_KEY, JSON.stringify(deliveries));
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
