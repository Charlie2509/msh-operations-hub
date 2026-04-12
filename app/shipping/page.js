'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { getOrders } from '../lib/storage';

const cardStyle = {
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  background: '#fff',
  padding: 14
};

export default function ShippingPage() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    setOrders(getOrders());
  }, []);

  const readyToDispatch = useMemo(() => orders.filter(order => order.status === 'Ready to Dispatch'), [orders]);
  const readyForCollection = useMemo(() => orders.filter(order => order.status === 'Ready for Collection'), [orders]);

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gap: 12 }}>
      <header>
        <h1 style={{ marginBottom: 8 }}>Shipping</h1>
        <p style={{ margin: 0, color: '#4b5563' }}>Shipment preparation workspace (courier API integration coming in a future phase).</p>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
        <article style={cardStyle}>
          <h2 style={{ marginTop: 0, fontSize: 18 }}>Ready to Dispatch</h2>
          <p style={{ fontSize: 26, fontWeight: 700, margin: '8px 0 0' }}>{readyToDispatch.length}</p>
        </article>
        <article style={cardStyle}>
          <h2 style={{ marginTop: 0, fontSize: 18 }}>Collection Orders</h2>
          <p style={{ fontSize: 26, fontWeight: 700, margin: '8px 0 0' }}>{readyForCollection.length}</p>
        </article>
        <article style={cardStyle}>
          <h2 style={{ marginTop: 0, fontSize: 18 }}>Shipping Integration Coming Next</h2>
          <p style={{ margin: 0, color: '#4b5563' }}>Carrier booking, labels, and tracking sync will be added in a controlled phase.</p>
        </article>
      </section>

      <section style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>Orders Ready to Dispatch</h2>
        {readyToDispatch.length === 0 ? (
          <p style={{ margin: 0 }}>No orders currently marked “Ready to Dispatch”.</p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
            {readyToDispatch.map(order => (
              <li key={order.id}>
                <Link href={`/orders/${order.id}`} style={{ fontWeight: 700 }}>{order.orderNumber}</Link>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: '#4b5563' }}>{order.customerName} · {order.sourceLabel}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
