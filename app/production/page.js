'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { saveOrders } from '../lib/storage';
import { useHubData } from '../lib/use-hub-data';
import { applyOrderStatus } from '../lib/hub-utils';

const queueStatuses = ['Awaiting Artwork', 'In Production', 'Ready to Dispatch', 'Ready for Collection'];

export default function ProductionPage() {
  const { orders, reload } = useHubData();
  const queue = useMemo(() => orders.filter(order => queueStatuses.includes(order.status)), [orders]);

  const move = (orderId, status) => {
    saveOrders(applyOrderStatus(orders, orderId, status));
    reload();
  };

  return (
    <main className="page-wrap">
      <header className="page-head" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div><h1>Production Queue</h1><p>Fast updates for artwork, production, and handoff readiness.</p></div>
        <Link href="/orders" className="btn">All Orders</Link>
      </header>

      <section className="grid">
        {queue.map(order => (
          <article key={order.id} className="card">
            <Link href={`/orders/${order.id}`} style={{ fontWeight: 700 }}>{order.orderNumber}</Link>
            <p style={{ color: 'var(--muted)' }}>{order.club || 'No club'} · {order.customerName}</p>
            <p style={{ margin: '4px 0' }}>Personalisation: {order.personalisationDetails || 'None'}</p>
            <p style={{ margin: '4px 0' }}>Box: {order.boxType} {order.boxNumber} · Status: {order.status}</p>
            <div className="btn-row">
              <button className="btn" type="button" onClick={() => move(order.id, 'In Production')}>Mark Artwork Done</button>
              <button className="btn" type="button" onClick={() => move(order.id, 'In Production')}>Move to In Production</button>
              <button className="btn" type="button" onClick={() => move(order.id, 'Ready to Dispatch')}>Move to Ready to Dispatch</button>
              <button className="btn" type="button" onClick={() => move(order.id, 'Ready for Collection')}>Move to Ready for Collection</button>
              <button className="btn primary" type="button" onClick={() => move(order.id, 'Completed')}>Mark Completed</button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
