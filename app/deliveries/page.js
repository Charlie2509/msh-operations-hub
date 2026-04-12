'use client';

import { useEffect, useState } from 'react';
import { createDelivery, getDeliveries } from '../lib/storage';

const fieldStyle = {
  border: '1px solid #d1d5db',
  borderRadius: 8,
  padding: '10px 12px',
  fontSize: 14,
  background: '#fff',
  width: '100%'
};

const initialDelivery = {
  reference: '',
  deliveryDate: '',
  notes: '',
  customsHold: 'No',
  partialDelivery: 'No'
};

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState([]);
  const [formData, setFormData] = useState(initialDelivery);

  useEffect(() => {
    setDeliveries(getDeliveries());
  }, []);

  const handleSubmit = event => {
    event.preventDefault();
    const created = createDelivery(formData);
    setDeliveries(prev => [created, ...prev]);
    setFormData(initialDelivery);
  };

  return (
    <main style={{ maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ marginTop: 0 }}>Deliveries</h1>
      <p style={{ color: '#4b5563' }}>Simple delivery records for operations tracking (V1).</p>

      <section style={{ border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', padding: 14, marginBottom: 16 }}>
        <h2 style={{ marginTop: 0, fontSize: 20 }}>Add Delivery</h2>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <Input label="Delivery Reference" name="reference" value={formData.reference} onChange={setFormData} required />
            <Input label="Delivery Date" name="deliveryDate" value={formData.deliveryDate} type="date" onChange={setFormData} required />
            <Select label="Customs Hold" name="customsHold" value={formData.customsHold} options={['No', 'Yes']} onChange={setFormData} />
            <Select
              label="Partial Delivery"
              name="partialDelivery"
              value={formData.partialDelivery}
              options={['No', 'Yes']}
              onChange={setFormData}
            />
          </div>

          <label style={{ display: 'grid', gap: 6 }}>
            <span>Notes</span>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={event => setFormData(prev => ({ ...prev, notes: event.target.value }))}
              rows={4}
              style={fieldStyle}
            />
          </label>

          <button
            type="submit"
            style={{
              width: 'fit-content',
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid #111827',
              background: '#111827',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Save Delivery
          </button>
        </form>
      </section>

      <section style={{ display: 'grid', gap: 10 }}>
        {deliveries.length === 0 ? (
          <p style={{ margin: 0 }}>No deliveries logged yet.</p>
        ) : (
          deliveries.map(delivery => (
            <article key={delivery.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', padding: 12 }}>
              <p style={{ margin: 0, fontWeight: 700 }}>{delivery.reference}</p>
              <p style={{ margin: '6px 0 0' }}>Date: {delivery.deliveryDate}</p>
              <p style={{ margin: '6px 0 0' }}>Customs Hold: {delivery.customsHold}</p>
              <p style={{ margin: '6px 0 0' }}>Partial Delivery: {delivery.partialDelivery}</p>
              <p style={{ margin: '6px 0 0', color: '#4b5563' }}>{delivery.notes || 'No notes.'}</p>
            </article>
          ))
        )}
      </section>
    </main>
  );
}

function Input({ label, name, value, onChange, type = 'text', required = false }) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span>{label}</span>
      <input
        type={type}
        name={name}
        required={required}
        value={value}
        onChange={event => onChange(prev => ({ ...prev, [name]: event.target.value }))}
        style={fieldStyle}
      />
    </label>
  );
}

function Select({ label, name, value, options, onChange }) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span>{label}</span>
      <select
        name={name}
        value={value}
        onChange={event => onChange(prev => ({ ...prev, [name]: event.target.value }))}
        style={fieldStyle}
      >
        {options.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
