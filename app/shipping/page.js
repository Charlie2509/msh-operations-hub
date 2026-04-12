'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useHubData } from '../lib/use-hub-data';

export default function ShippingPage() {
  const { orders } = useHubData();
  const readyToDispatch = useMemo(() => orders.filter(order => order.status === 'Ready to Dispatch'), [orders]);
  const readyForCollection = useMemo(() => orders.filter(order => order.status === 'Ready for Collection'), [orders]);

  return (
    <main className="page-wrap">
      <header className="page-head"><h1>Shipping</h1><p>Staging area for dispatch and customer collection workflows.</p></header>
      <section className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))' }}>
        <article className="card"><h2>Ready to Dispatch ({readyToDispatch.length})</h2><OrderList items={readyToDispatch} /></article>
        <article className="card"><h2>Ready for Collection ({readyForCollection.length})</h2><OrderList items={readyForCollection} /></article>
      </section>
      <section className="card">
        <h2>Future Shipping Integrations</h2>
        <ul>
          <li>Courier booking and labels (placeholder).</li>
          <li>DHL inbound/outbound tracking bridge (placeholder).</li>
          <li>Automated customer dispatch notifications (placeholder).</li>
        </ul>
      </section>
    </main>
  );
}

function OrderList({ items }) {
  if (items.length === 0) return <p style={{ margin: 0 }}>No orders in this section.</p>;
  return <ul className="status-list">{items.map(order => <li key={order.id}><Link href={`/orders/${order.id}`} style={{ fontWeight: 700 }}>{order.orderNumber}</Link> · {order.customerName} · {order.club || 'No club'}</li>)}</ul>;
}
