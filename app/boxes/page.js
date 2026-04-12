'use client';

import { useEffect, useState } from 'react';
import { BOX_TYPES } from '../data/orders';
import { getOrders } from '../lib/storage';

export default function BoxesPage() {
  const [orders, setOrders] = useState([]);
  const [selectedBox, setSelectedBox] = useState(null);

  useEffect(() => {
    setOrders(getOrders());
  }, []);

  const boxGroups = [
    { label: 'Reserve Boxes', type: 'Reserve', numbers: BOX_TYPES.Reserve },
    { label: 'Small Orders', type: 'Small Order', numbers: BOX_TYPES['Small Order'] },
    { label: 'Web Orders', type: 'Web Order', numbers: BOX_TYPES['Web Order'] }
  ];

  const selectedOrders = selectedBox
    ? orders.filter(order => order.boxType === selectedBox.type && Number(order.boxNumber) === selectedBox.number)
    : [];

  return (
    <main style={{ maxWidth: 980, margin: '0 auto', display: 'grid', gap: 14 }}>
      <h1 style={{ margin: 0 }}>Box View</h1>
      <p style={{ margin: 0, color: '#4b5563' }}>Tap a box to see which orders are physically inside.</p>

      {boxGroups.map(group => (
        <section key={group.type} style={{ border: '1px solid #e5e7eb', borderRadius: 10, background: '#fff', padding: 12 }}>
          <h2 style={{ marginTop: 0 }}>{group.label}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8 }}>
            {group.numbers.map(number => {
              const contained = orders.filter(order => order.boxType === group.type && Number(order.boxNumber) === number);
              return (
                <button
                  key={number}
                  type="button"
                  onClick={() => setSelectedBox({ type: group.type, number })}
                  style={{ border: '1px solid #d1d5db', borderRadius: 10, padding: '14px 8px', background: '#fff', textAlign: 'left', cursor: 'pointer' }}
                >
                  <p style={{ margin: 0, fontWeight: 700 }}>{group.type} {number}</p>
                  <p style={{ margin: '6px 0 0', fontSize: 13, color: '#6b7280' }}>{contained.length} order(s)</p>
                </button>
              );
            })}
          </div>
        </section>
      ))}

      {selectedBox && (
        <section style={{ border: '1px solid #111827', borderRadius: 10, background: '#fff', padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>{selectedBox.type} {selectedBox.number}</h3>
          {selectedOrders.length === 0 ? (
            <p style={{ margin: 0 }}>No orders in this box.</p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {selectedOrders.map(order => (
                <li key={order.id}>{order.orderNumber} · {order.customerName} · {order.status}</li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}
