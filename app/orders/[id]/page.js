'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useHubData } from '../../lib/use-hub-data';
import { updateOrder } from '../../lib/storage';
import OrderForm, { getInitialOrderForm } from '../components/order-form';

const quickStatuses = ['Ordered from Macron', 'Awaiting Delivery', 'Partially Delivered', 'Fully Delivered', 'Awaiting Artwork', 'In Production', 'Ready to Dispatch', 'Ready for Collection', 'Completed'];

export default function OrderDetailPage() {
  const { id } = useParams();
  const { orders } = useHubData();
  const [editing, setEditing] = useState(false);
  const order = useMemo(() => orders.find(item => item.id === id), [orders, id]);
  const [formData, setFormData] = useState(getInitialOrderForm());
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (order) setFormData(getInitialOrderForm(order));
  }, [order]);

  if (!order) return <main className="page-wrap"><h1>Order not found</h1><Link className="btn" href="/orders">Back</Link></main>;

  const save = e => {
    e.preventDefault();
    updateOrder(order.id, formData);
    setEditing(false);
    setMessage('Order updated.');
  };

  const setStatus = status => {
    updateOrder(order.id, { status, deliveryStatus: status.includes('Delivered') ? status : order.deliveryStatus });
    setMessage(`Status moved to ${status}.`);
  };

  return (
    <main className="page-wrap">
      <div className="btn-row"><Link href="/orders" className="btn">← Orders</Link><Link href="/production" className="btn">Production</Link><Link href="/shipping" className="btn">Shipping</Link></div>
      <header className="page-head" style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div><h1>{order.orderNumber}</h1><p>{order.customerName} · {order.club || 'No club'} · {order.status}</p></div>
        <button type="button" className="btn" onClick={() => setEditing(v => !v)}>{editing ? 'Cancel' : 'Edit Order'}</button>
      </header>

      {message ? <p className="card" style={{ margin: 0 }}>{message}</p> : null}

      <section className="card">
        <h2>Quick Status Actions</h2>
        <div className="btn-row">{quickStatuses.map(status => <button key={status} className={`btn ${order.status === status ? 'primary' : ''}`} type="button" onClick={() => setStatus(status)}>{status}</button>)}</div>
      </section>

      {editing ? (
        <section className="card"><OrderForm formData={formData} onChange={e => { const { name, value } = e.target; if (name === 'boxType') { setFormData(prev => getInitialOrderForm({ ...prev, boxType: value })); return; } setFormData(prev => ({ ...prev, [name]: value })); }} onMissingItemsChange={next => setFormData(prev => ({ ...prev, missingItems: typeof next === 'function' ? next(prev.missingItems) : next }))} onSubmit={save} submitLabel="Save Changes" /></section>
      ) : (
        <section className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))' }}>
          <Info title="Customer" rows={[['Name', order.customerName], ['Email', order.customerEmail || '—'], ['Phone', order.customerPhone || '—']]} />
          <Info title="Order Info" rows={[['Type', order.orderType], ['Status', order.status], ['Source', order.sourceLabel], ['External ID', order.externalId || '—']]} />
          <Info title="Supplier / Delivery" rows={[['Needs Macron', order.needsOrderingFromMacron], ['Delivery Status', order.deliveryStatus], ['Payment', order.paymentStatus]]} />
          <Info title="Production" rows={[['Personalisation', order.personalisationDetails || '—'], ['Line Item Summary', order.lineItemsSummary || '—']]} />
          <Info title="Box / Location" rows={[['Box Type', order.boxType], ['Box Number', order.boxNumber]]} />
          <Info title="Notes" rows={[['Internal', order.internalNotes || '—']]} />
        </section>
      )}
    </main>
  );
}

function Info({ title, rows }) {
  return <article className="card"><h2>{title}</h2>{rows.map(([k, v]) => <p key={k} style={{ margin: '6px 0' }}><strong>{k}:</strong> {v}</p>)}</article>;
}
