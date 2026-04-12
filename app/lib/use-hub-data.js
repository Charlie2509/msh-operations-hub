'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getDeliveries, getOrders, subscribeHubUpdates } from './storage';
import { buildDashboardSummary } from './hub-utils';

export function useHubData() {
  const [orders, setOrders] = useState([]);
  const [deliveries, setDeliveries] = useState([]);

  const reload = useCallback(() => {
    setOrders(getOrders());
    setDeliveries(getDeliveries());
  }, []);

  useEffect(() => {
    reload();
    return subscribeHubUpdates(reload);
  }, [reload]);

  const summary = useMemo(() => buildDashboardSummary(orders), [orders]);

  return { orders, deliveries, summary, reload };
}
