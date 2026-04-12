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
    if (name === 'boxType') return setFormData(prev => getInitialOrderForm({ ...prev, boxType: value }));
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = event => {
    event.preventDefault();
    const newOrder = createOrder(formData);
    setCreatedOrderNumber(newOrder.orderNumber);
    setTimeout(() => router.push(`/orders/${newOrder.id}`), 500);
  };

  return (
    <main className="page-wrap">
      <header className="page-head"><h1>Add Order</h1><p>Create a new order with delivery and production details in one flow.</p></header>
      {createdOrderNumber ? <p className="card" style={{ margin: 0 }}>Saved {createdOrderNumber}. Opening order workspace…</p> : null}
      <OrderForm formData={formData} onChange={handleChange} onMissingItemsChange={next => setFormData(prev => ({ ...prev, missingItems: typeof next === 'function' ? next(prev.missingItems) : next }))} onSubmit={handleSubmit} submitLabel="Create Order" />
      <Link href="/orders" className="btn" style={{ width: 'fit-content' }}>Back to Orders</Link>
    </main>
  );
}
