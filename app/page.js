'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { getOrders } from './lib/storage';

const cardStyle = {
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  padding: 14,
  background: '#fff'
};

const quickLinkStyle = {
  display: 'inline-block',
  padding: '12px 14px',
  border: '1px solid #d1d5db',
  borderRadius: 10,
  textDecoration: 'none',
  color: '#111827',
  fontWeight: 700,
  fontSize: 14,
  background: '#fff'
};

export default function Dashboard() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    setOrders(getOrders());
  }, []);

  const panels = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      'Needs Ordering': orders.filter(order => order.needsOrderingFromMacron === 'Yes' && order.status !== 'Ordered from Macron'),
      'Arrived Today': orders.filter(order => order.deliveryTracking?.some(entry => (entry.matchedAt || '').slice(0, 10) === today)),
      'In Production': orders.filter(order => order.status === 'In Production' || order.status === 'Awaiting Artwork'),
      'Ready Now': orders.filter(order => order.status === 'Ready to Dispatch' || order.status === 'Ready for Collection')
    };
  }, [orders]);

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto' }}>
      <header style={{ marginBottom: 20 }}>
        <h1 style={{ marginBottom: 8 }}>MSH Operations Hub</h1>
        <p style={{ margin: 0, color: '#4b5563' }}>Live control panel for deliveries, production, and ready orders.</p>
      </header>

      <section style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <Link href="/orders" style={quickLinkStyle}>View Orders</Link>
        <Link href="/orders/new" style={quickLinkStyle}>Add Order</Link>
        <Link href="/deliveries" style={quickLinkStyle}>Deliveries</Link>
        <Link href="/production" style={quickLinkStyle}>Production</Link>
        <Link href="/boxes" style={quickLinkStyle}>Boxes</Link>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 12 }}>
        {Object.entries(panels).map(([title, list]) => (
          <article key={title} style={cardStyle}>
            <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{title}</p>
            <p style={{ margin: '8px 0 10px', fontSize: 30, fontWeight: 700 }}>{list.length}</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 6 }}>
              {list.slice(0, 4).map(order => (
                <li key={order.id}>
                  <Link href={`/orders/${order.id}`} style={{ fontWeight: 700, textDecoration: 'none' }}>{order.orderNumber}</Link>
                  <div style={{ fontSize: 12, color: '#4b5563' }}>{order.club || 'No club'} · {order.status}</div>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </main>
  );
}
