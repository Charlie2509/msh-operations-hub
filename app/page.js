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

  const widgets = useMemo(() => {
    const readyNow = orders.filter(order => order.status === 'Ready to Dispatch' || order.status === 'Ready for Collection');

    return {
      'Total Orders': orders.length,
      'Shopify Imported': orders.filter(order => order.sourceSystem === 'shopify').length,
      'Manual Orders': orders.filter(order => order.sourceSystem !== 'shopify').length,
      'Needs Macron Ordering': orders.filter(order => order.needsOrderingFromMacron === 'Yes' && order.status !== 'Ordered from Macron').length,
      'Awaiting Delivery': orders.filter(order => order.deliveryStatus === 'Awaiting Delivery').length,
      'In Production': orders.filter(order => order.status === 'In Production' || order.status === 'Awaiting Artwork').length,
      'Ready Now (Dispatch + Collection)': readyNow.length
    };
  }, [orders]);

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto' }}>
      <header style={{ marginBottom: 20 }}>
        <h1 style={{ marginBottom: 8 }}>MSH Operations Hub</h1>
        <p style={{ margin: 0, color: '#4b5563' }}>Live control panel for deliveries, production, Shopify sync, and ready orders.</p>
      </header>

      <section style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <Link href="/orders" style={quickLinkStyle}>View Orders</Link>
        <Link href="/orders/new" style={quickLinkStyle}>Add Order</Link>
        <Link href="/sync/shopify" style={quickLinkStyle}>Shopify Sync</Link>
        <Link href="/shipping" style={quickLinkStyle}>Shipping</Link>
        <Link href="/deliveries" style={quickLinkStyle}>Deliveries</Link>
        <Link href="/settings" style={quickLinkStyle}>Settings</Link>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 12 }}>
        {Object.entries(widgets).map(([title, value]) => (
          <article key={title} style={cardStyle}>
            <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{title}</p>
            <p style={{ margin: '8px 0 10px', fontSize: 30, fontWeight: 700 }}>{value}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
