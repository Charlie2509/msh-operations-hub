'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { getActionNeededOrders } from './lib/hub-utils';
import { useHubData } from './lib/use-hub-data';

const quickLinks = [
  { href: '/orders', label: 'Orders' },
  { href: '/orders/new', label: 'Add Order' },
  { href: '/deliveries', label: 'Deliveries' },
  { href: '/production', label: 'Production' },
  { href: '/sync/shopify', label: 'Shopify Sync' }
];

const cardTarget = {
  'Needs Ordering': '/orders?needsOrderingFromMacron=Yes',
  'Awaiting Delivery': '/orders?status=Awaiting%20Delivery',
  'Partially Delivered': '/orders?status=Partially%20Delivered',
  'Awaiting Artwork': '/production?status=Awaiting%20Artwork',
  'In Production': '/production?status=In%20Production',
  'Ready to Dispatch': '/shipping',
  'Ready for Collection': '/shipping',
  Completed: '/orders?status=Completed',
  'Total Orders': '/orders'
};

export default function Dashboard() {
  const { orders, summary } = useHubData();

  const recentOrders = useMemo(() => [...orders].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 6), [orders]);
  const actionNeeded = useMemo(() => getActionNeededOrders(orders).slice(0, 8), [orders]);

  return (
    <main className="page-wrap">
      <header className="page-head">
        <h1>Dashboard</h1>
        <p>Connected control centre for orders, deliveries, production, boxes, and shipping.</p>
      </header>

      <section className="btn-row">
        {quickLinks.map(link => (
          <Link key={link.href} href={link.href} className="btn">{link.label}</Link>
        ))}
      </section>

      <section className="kpi-grid">
        {summary.map(item => (
          <Link key={item.label} href={cardTarget[item.label] || '/orders'} className="card kpi">
            <span className="label">{item.label}</span>
            <div className="value">{item.value}</div>
          </Link>
        ))}
      </section>

      <section className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))' }}>
        <article className="card">
          <h2>Recent Orders</h2>
          <ul className="status-list">
            {recentOrders.map(order => (
              <li key={order.id}>
                <Link href={`/orders/${order.id}`} style={{ fontWeight: 700 }}>{order.orderNumber}</Link>
                <div style={{ color: 'var(--muted)', fontSize: '.85rem' }}>{order.customerName} · {order.status}</div>
              </li>
            ))}
          </ul>
        </article>

        <article className="card">
          <h2>Action Needed</h2>
          {actionNeeded.length === 0 ? <p style={{ margin: 0 }}>No urgent workflow blockers.</p> : (
            <ul className="status-list">
              {actionNeeded.map(order => (
                <li key={order.id}>
                  <Link href={`/orders/${order.id}`} style={{ fontWeight: 700 }}>{order.orderNumber}</Link>
                  <div style={{ color: 'var(--muted)', fontSize: '.85rem' }}>{order.club || 'No club'} · {order.status}</div>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </main>
  );
}
