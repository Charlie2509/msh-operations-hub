'use client';

import { orders as seededOrders } from '../data/orders';

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

export function getOrders() {
  if (!isBrowser) {
    return seededOrders;
  }

  const stored = window.localStorage.getItem(ORDERS_KEY);

  if (!stored) {
    window.localStorage.setItem(ORDERS_KEY, JSON.stringify(seededOrders));
    return seededOrders;
  }

  return safeParse(stored, seededOrders);
}

export function saveOrders(nextOrders) {
  if (!isBrowser) {
    return;
  }

  window.localStorage.setItem(ORDERS_KEY, JSON.stringify(nextOrders));
}

export function createOrder(orderInput) {
  const allOrders = getOrders();
  const nextOrder = {
    id: `local-${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...orderInput,
    boxNumber: Number(orderInput.boxNumber)
  };

  const updated = [nextOrder, ...allOrders];
  saveOrders(updated);
  return nextOrder;
}

export function updateOrder(orderId, updates) {
  const allOrders = getOrders();
  const updated = allOrders.map(order =>
    order.id === orderId
      ? {
          ...order,
          ...updates,
          boxNumber: Number(updates.boxNumber)
        }
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

  return safeParse(stored, []);
}

export function createDelivery(deliveryInput) {
  const allDeliveries = getDeliveries();
  const nextDelivery = {
    id: `delivery-${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...deliveryInput
  };

  const updated = [nextDelivery, ...allDeliveries];
  window.localStorage.setItem(DELIVERIES_KEY, JSON.stringify(updated));
  return nextDelivery;
}
