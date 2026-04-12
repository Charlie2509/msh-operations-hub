'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { getOrders } from './lib/storage';

const DASHBOARD_STATUSES = [
  'New',
  'To Order from Macron',
  'Awaiting Delivery',
  'Partially Delivered',
  'Awaiting Artwork',
  'In Production',
  'Ready to Dispatch',
  'Ready for Collection',
  'Completed'
];

const cardStyle = {
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  padding: 16,
  background: '#fff'
};

const quickLinkStyle = {
  display: 'inline-block',
  padding: '10px 14px',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  textDecoration: 'none',
  color: '#111827',
  fontWeight: 600,
  fontSize: 14,
  background: '#fff'
};

export default function Dashboard() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    setOrders(getOrders());
  }, []);

  const statusCounts = useMemo(
    () =>
      DASHBOARD_STATUSES.reduce((acc, status) => {
        acc[status] = orders.filter(order => order.status === status).length;
        return acc;
      }, {}),
    [orders]
  );

  const recentOrders = useMemo(() => {
    const sorted = [...orders].sort((a, b) => {
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : Number(a.id);
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : Number(b.id);
      return bDate - aDate;
    });
    return sorted.slice(0, 5);
  }, [orders]);

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto' }}>
      <header style={{ marginBottom: 20 }}>
        <h1 style={{ marginBottom: 8 }}>MSH Operations Hub</h1>
        <p style={{ margin: 0, color: '#4b5563' }}>Live status overview for current orders.</p>
      </header>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
          marginBottom: 24
        }}
      >
        {DASHBOARD_STATUSES.map(status => (
          <article key={status} style={cardStyle}>
            <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{status}</p>
            <p style={{ margin: '10px 0 0', fontSize: 28, fontWeight: 700 }}>{statusCounts[status] || 0}</p>
          </article>
        ))}
      </section>

      <section style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <Link href="/orders" style={quickLinkStyle}>
          View Orders
        </Link>
        <Link href="/orders/new" style={quickLinkStyle}>
          Add Order
        </Link>
        <Link href="/deliveries" style={quickLinkStyle}>
          Deliveries
        </Link>
      </section>

      <section style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>Recent Orders</h2>
        {recentOrders.length === 0 ? (
          <p style={{ marginBottom: 0 }}>No orders available.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
            {recentOrders.map(order => (
              <li key={order.id} style={{ borderTop: '1px solid #e5e7eb', paddingTop: 10 }}>
                <Link href={`/orders/${order.id}`} style={{ fontWeight: 700 }}>
                  {order.orderNumber}
                </Link>
                <p style={{ margin: '4px 0 0', color: '#4b5563', fontSize: 14 }}>
                  {order.customerName} · {order.club || 'No club'} · {order.status}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
