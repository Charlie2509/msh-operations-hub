'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { createDelivery, saveOrders, updateDelivery } from '../lib/storage';
import { useHubData } from '../lib/use-hub-data';

const initialDelivery = { reference: '', deliveryDate: '', notes: '', customsHold: 'No', partialDelivery: 'No' };
const initialItem = { name: '', size: '', quantity: 1, club: '' };

export default function DeliveriesPage() {
  const { orders, deliveries, reload } = useHubData();
  const [formData, setFormData] = useState(initialDelivery);
  const [itemForms, setItemForms] = useState({});

  const ordersWithMissing = useMemo(() => orders.filter(order => order.missingItems.some(item => !item.fulfilled)), [orders]);

  const addDelivery = e => {
    e.preventDefault();
    createDelivery(formData);
    setFormData(initialDelivery);
    reload();
  };

  const addItem = delivery => {
    const form = itemForms[delivery.id] || initialItem;
    if (!form.name.trim()) return;
    updateDelivery(delivery.id, { items: [...delivery.items, { id: `d-item-${Date.now()}`, ...form, quantity: Number(form.quantity || 1), matchedQuantity: 0 }] });
    setItemForms(prev => ({ ...prev, [delivery.id]: initialItem }));
    reload();
  };

  const matchItem = (delivery, item, orderId) => {
    const selectedOrder = orders.find(order => order.id === orderId);
    if (!selectedOrder) return;
    const missingIndex = selectedOrder.missingItems.findIndex(m => !m.fulfilled && m.name.toLowerCase() === item.name.toLowerCase() && (m.size || '').toLowerCase() === (item.size || '').toLowerCase());
    if (missingIndex < 0) return;

    const nextOrders = orders.map(order => {
      if (order.id !== orderId) return order;
      const nextMissing = [...order.missingItems];
      const target = nextMissing[missingIndex];
      const receivedQuantity = Math.min(target.quantity, (target.receivedQuantity || 0) + item.quantity);
      nextMissing[missingIndex] = { ...target, receivedQuantity, fulfilled: receivedQuantity >= target.quantity };
      const stillMissing = nextMissing.some(m => !m.fulfilled);
      return {
        ...order,
        missingItems: nextMissing,
        deliveryStatus: delivery.customsHold === 'Yes' ? 'Delayed / Customs Hold' : (stillMissing || delivery.partialDelivery === 'Yes' ? 'Partially Delivered' : 'Fully Delivered'),
        status: delivery.customsHold === 'Yes' ? 'Delayed / Customs Hold' : (stillMissing || delivery.partialDelivery === 'Yes' ? 'Partially Delivered' : 'Fully Delivered')
      };
    });

    const nextItems = delivery.items.map(entry => entry.id === item.id ? { ...entry, matchedOrderId: orderId, matchedQuantity: item.quantity } : entry);
    const allMatched = nextItems.every(entry => Number(entry.matchedQuantity || 0) >= Number(entry.quantity || 0));
    updateDelivery(delivery.id, { items: nextItems, status: allMatched ? 'Fully Delivered' : 'Partially Delivered' });
    saveOrders(nextOrders);
    reload();
  };

  return (
    <main className="page-wrap">
      <header className="page-head"><h1>Deliveries</h1><p>Log inbound deliveries, add received items, and match them to active orders.</p></header>

      <section className="card">
        <h2>Add Delivery</h2>
        <form onSubmit={addDelivery} className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>
          <Field label="Delivery Ref" name="reference" value={formData.reference} onChange={setFormData} required />
          <Field label="Date" name="deliveryDate" value={formData.deliveryDate} onChange={setFormData} type="date" required />
          <Select label="Customs Hold" name="customsHold" value={formData.customsHold} onChange={setFormData} options={['No', 'Yes']} />
          <Select label="Partial Delivery" name="partialDelivery" value={formData.partialDelivery} onChange={setFormData} options={['No', 'Yes']} />
          <label className="label" style={{ gridColumn: '1 / -1' }}>Notes<textarea value={formData.notes} onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))} rows={3} /></label>
          <button className="btn primary" type="submit">Save Delivery</button>
        </form>
      </section>

      <section className="card">
        <h2>Orders Awaiting Items</h2>
        <ul className="status-list">{ordersWithMissing.map(order => <li key={order.id}><Link href={`/orders/${order.id}`} style={{ fontWeight: 700 }}>{order.orderNumber}</Link> · {order.club || 'No club'} · {order.status}</li>)}</ul>
      </section>

      <section className="grid">
        {deliveries.map(delivery => {
          const form = itemForms[delivery.id] || initialItem;
          return (
            <article key={delivery.id} className="card">
              <h2 style={{ marginBottom: 6 }}>{delivery.reference}</h2>
              <p style={{ marginTop: 0, color: 'var(--muted)' }}>{delivery.deliveryDate} · Status: {delivery.status || 'Unmatched'} · Customs Hold: {delivery.customsHold}</p>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
                <input className="field" placeholder="Product" value={form.name} onChange={e => setItemForms(prev => ({ ...prev, [delivery.id]: { ...form, name: e.target.value } }))} />
                <input className="field" placeholder="Size" value={form.size} onChange={e => setItemForms(prev => ({ ...prev, [delivery.id]: { ...form, size: e.target.value } }))} />
                <input className="field" type="number" min="1" placeholder="Qty" value={form.quantity} onChange={e => setItemForms(prev => ({ ...prev, [delivery.id]: { ...form, quantity: Number(e.target.value || 1) } }))} />
                <input className="field" placeholder="Club (optional)" value={form.club} onChange={e => setItemForms(prev => ({ ...prev, [delivery.id]: { ...form, club: e.target.value } }))} />
              </div>
              <button type="button" className="btn" style={{ marginTop: 8 }} onClick={() => addItem(delivery)}>Add Delivery Item</button>

              <div className="grid" style={{ marginTop: 10 }}>
                {delivery.items.map(item => (
                  <div key={item.id} className="card">
                    <strong>{item.quantity}x {item.name} {item.size ? `(${item.size})` : ''}</strong>
                    <select style={{ marginTop: 8 }} defaultValue="" onChange={e => { if (e.target.value) { matchItem(delivery, item, e.target.value); e.target.value = ''; } }}>
                      <option value="">Match to order…</option>
                      {ordersWithMissing.map(order => <option key={order.id} value={order.id}>{order.orderNumber} · {order.club || 'No club'}</option>)}
                    </select>
                  </div>
                ))}
                {delivery.items.length === 0 ? <p style={{ margin: 0, color: 'var(--muted)' }}>No delivery items added yet.</p> : null}
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}

function Field({ label, name, value, onChange, type = 'text', required = false }) { return <label className="label">{label}<input className="field" type={type} required={required} value={value} onChange={e => onChange(prev => ({ ...prev, [name]: e.target.value }))} /></label>; }
function Select({ label, name, value, options, onChange }) { return <label className="label">{label}<select value={value} onChange={e => onChange(prev => ({ ...prev, [name]: e.target.value }))}>{options.map(o => <option key={o} value={o}>{o}</option>)}</select></label>; }
