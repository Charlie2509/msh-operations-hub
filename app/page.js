import Link from 'next/link';
import { orders } from './data/orders';

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
  const statusCounts = DASHBOARD_STATUSES.reduce((acc, status) => {
    acc[status] = orders.filter(order => order.status === status).length;
    return acc;
  }, {});

  return (
    <main style={{ padding: 20, maxWidth: 1100, margin: '0 auto' }}>
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
            <p style={{ margin: '10px 0 0', fontSize: 28, fontWeight: 700 }}>{statusCounts[status]}</p>
          </article>
        ))}
      </section>

      <section style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link href="/orders" style={quickLinkStyle}>
          View Orders
        </Link>
        <Link href="/orders/new" style={quickLinkStyle}>
          Add Order
        </Link>
      </section>
    </main>
  );
}
