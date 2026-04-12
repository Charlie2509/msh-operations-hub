'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { updateOrder, getOrders } from '../../lib/storage';
import OrderForm, { getInitialOrderForm } from '../components/order-form';

const cardStyle = {
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  padding: 14,
  background: '#fff'
};

export default function OrderDetail() {
  const params = useParams();
  const [order, setOrder] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(getInitialOrderForm());

  useEffect(() => {
    const allOrders = getOrders();
    const matched = allOrders.find(entry => entry.id === params.id);
    setOrder(matched || null);
    if (matched) {
      setFormData(getInitialOrderForm(matched));
    }
  }, [params.id]);

  const handleChange = event => {
    const { name, value } = event.target;

    if (name === 'boxType') {
      setFormData(prev => getInitialOrderForm({ ...prev, boxType: value }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = event => {
    event.preventDefault();
    const saved = updateOrder(params.id, formData);
    setOrder(saved);
    setFormData(getInitialOrderForm(saved));
    setIsEditing(false);
  };

  if (!order) {
    return (
      <main style={{ maxWidth: 900, margin: '0 auto' }}>
        <h1>Order not found</h1>
        <Link href="/orders">Back to Orders</Link>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gap: 14 }}>
      <Link href="/orders" style={{ width: 'fit-content' }}>
        ← Back to Orders
      </Link>

      <header style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>{order.orderNumber}</h1>
        <button
          type="button"
          onClick={() => setIsEditing(prev => !prev)}
          style={{
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: 8,
            background: '#fff',
            cursor: 'pointer'
          }}
        >
          {isEditing ? 'Cancel Edit' : 'Edit Order'}
        </button>
      </header>

      {isEditing ? (
        <section style={cardStyle}>
          <OrderForm formData={formData} onChange={handleChange} onSubmit={handleSubmit} submitLabel="Save Changes" />
        </section>
      ) : (
        <>
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Customer</h2>
            <p><strong>Name:</strong> {order.customerName}</p>
            <p><strong>Email:</strong> {order.customerEmail || '—'}</p>
            <p><strong>Phone:</strong> {order.customerPhone || '—'}</p>
          </section>

          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Order Info</h2>
            <p><strong>Club:</strong> {order.club || '—'}</p>
            <p><strong>Team:</strong> {order.team || '—'}</p>
            <p><strong>Order Type:</strong> {order.orderType || '—'}</p>
            <p><strong>Status:</strong> {order.status || '—'}</p>
          </section>

          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Box</h2>
            <p><strong>Box Type:</strong> {order.boxType || '—'}</p>
            <p><strong>Box Number:</strong> {order.boxNumber || '—'}</p>
          </section>

          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Production</h2>
            <p><strong>Personalisation:</strong> {order.personalisationDetails || '—'}</p>
            <p><strong>Missing Items:</strong> {order.missingItems || '—'}</p>
            <p><strong>Internal Notes:</strong> {order.internalNotes || '—'}</p>
          </section>

          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Supplier / Delivery / Payment</h2>
            <p><strong>Needs Ordering From Macron:</strong> {order.needsOrderingFromMacron || '—'}</p>
            <p><strong>Delivery Status:</strong> {order.deliveryStatus || '—'}</p>
            <p><strong>Payment Status:</strong> {order.paymentStatus || '—'}</p>
          </section>
        </>
      )}
    </main>
  );
}
