'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { BOX_TYPES } from '../data/orders';
import { useHubData } from '../lib/use-hub-data';

const groups = [
  { label: 'Reserve Boxes 1–8', type: 'Reserve', numbers: BOX_TYPES.Reserve },
  { label: 'Small Order Boxes 1–5', type: 'Small Order', numbers: BOX_TYPES['Small Order'] },
  { label: 'Web Order Boxes 1–4', type: 'Web Order', numbers: BOX_TYPES['Web Order'] }
];

export default function BoxesPage() {
  const { orders } = useHubData();
  const [selected, setSelected] = useState({ type: 'Reserve', number: 1 });

  const selectedOrders = useMemo(
    () => orders.filter(order => order.boxType === selected.type && Number(order.boxNumber) === selected.number),
    [orders, selected]
  );

  return (
    <main className="page-wrap">
      <header className="page-head"><h1>Boxes</h1><p>Digital view of physical reserve, small, and web box workflow.</p></header>

      {groups.map(group => (
        <section className="card" key={group.type}>
          <h2>{group.label}</h2>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))' }}>
            {group.numbers.map(number => {
              const count = orders.filter(order => order.boxType === group.type && Number(order.boxNumber) === number).length;
              return (
                <button key={number} className={`btn ${selected.type === group.type && selected.number === number ? 'primary' : ''}`} onClick={() => setSelected({ type: group.type, number })}>
                  {group.type} {number} ({count})
                </button>
              );
            })}
          </div>
        </section>
      ))}

      <section className="card">
        <h2>{selected.type} {selected.number}</h2>
        {selectedOrders.length === 0 ? <p style={{ margin: 0 }}>No orders currently in this box.</p> : (
          <ul className="status-list">
            {selectedOrders.map(order => <li key={order.id}><Link href={`/orders/${order.id}`} style={{ fontWeight: 700 }}>{order.orderNumber}</Link> · {order.customerName} · {order.status}</li>)}
          </ul>
        )}
      </section>
    </main>
  );
}
