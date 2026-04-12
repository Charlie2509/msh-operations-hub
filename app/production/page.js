'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { getOrders, saveOrders } from '../lib/storage';

const activeStatuses = ['Awaiting Artwork', 'In Production'];

export default function ProductionPage() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    setOrders(getOrders());
  }, []);

  const productionOrders = useMemo(() => orders.filter(order => activeStatuses.includes(order.status)), [orders]);

  const applyStatus = (orderId, status) => {
    const next = orders.map(order => (order.id === orderId ? { ...order, status } : order));
    setOrders(next);
    saveOrders(next);
  };

  return (
    <main style={{ maxWidth: 980, margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        <h1 style={{ margin: 0 }}>Production Queue</h1>
        <Link href="/orders" style={{ textDecoration: 'none', border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 12px', fontWeight: 700, color: '#111827', background: '#fff' }}>
          All Orders
        </Link>
      </header>

      {productionOrders.length === 0 ? (
        <p>No orders currently awaiting artwork or in production.</p>
      ) : (
        <section style={{ display: 'grid', gap: 10 }}>
          {productionOrders.map(order => (
            <article key={order.id} style={{ border: '1px solid #e5e7eb', borderRadius: 10, background: '#fff', padding: 12 }}>
              <p style={{ margin: 0, fontWeight: 700 }}>{order.orderNumber}</p>
              <p style={{ margin: '6px 0 0', color: '#4b5563' }}>{order.club || 'No club'} · {order.personalisationDetails || 'No personalisation'}</p>
              <p style={{ margin: '6px 0 0' }}>Box: {order.boxType} {order.boxNumber}</p>
              <p style={{ margin: '6px 0 0' }}>Readiness: {order.status}</p>

              <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', marginTop: 10 }}>
                <ActionButton label="Mark Artwork Done" onClick={() => applyStatus(order.id, 'In Production')} />
                <ActionButton label="Move to In Production" onClick={() => applyStatus(order.id, 'In Production')} />
                <ActionButton label="Ready to Dispatch" onClick={() => applyStatus(order.id, 'Ready to Dispatch')} />
                <ActionButton label="Ready for Collection" onClick={() => applyStatus(order.id, 'Ready for Collection')} />
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

function ActionButton({ label, onClick }) {
  return (
    <button onClick={onClick} type="button" style={{ border: '1px solid #d1d5db', borderRadius: 10, background: '#fff', padding: '12px 10px', fontWeight: 700, cursor: 'pointer' }}>
      {label}
    </button>
  );
}
