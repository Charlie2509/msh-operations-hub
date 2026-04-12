'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createOrder } from '../../lib/storage';
import OrderForm, { getInitialOrderForm } from '../components/order-form';

export default function AddOrderPage() {
  const router = useRouter();
  const [formData, setFormData] = useState(getInitialOrderForm());
  const [createdOrderNumber, setCreatedOrderNumber] = useState('');

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
    const newOrder = createOrder(formData);
    setCreatedOrderNumber(newOrder.orderNumber);
    router.push(`/orders/${newOrder.id}`);
  };

  return (
    <main style={{ maxWidth: 900, margin: '0 auto' }}>
      <header style={{ marginBottom: 16 }}>
        <h1 style={{ marginBottom: 8 }}>Add Order</h1>
        <p style={{ margin: 0, color: '#4b5563' }}>Create a new operational record and store it locally for V1 workflows.</p>
      </header>

      {createdOrderNumber && (
        <p style={{ padding: 12, border: '1px solid #86efac', borderRadius: 8, background: '#f0fdf4' }}>
          Saved {createdOrderNumber}.
        </p>
      )}

      <OrderForm formData={formData} onChange={handleChange} onMissingItemsChange={next => setFormData(prev => ({ ...prev, missingItems: typeof next === 'function' ? next(prev.missingItems) : next }))} onSubmit={handleSubmit} submitLabel="Create Order" />

      <div style={{ marginTop: 12 }}>
        <Link
          href="/orders"
          style={{
            display: 'inline-block',
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid #d1d5db',
            textDecoration: 'none',
            color: '#111827',
            fontWeight: 600
          }}
        >
          Back to Orders
        </Link>
      </div>
    </main>
  );
}
