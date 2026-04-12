'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  BOX_TYPES,
  DELIVERY_STATUSES,
  ORDER_STATUSES,
  ORDER_TYPES,
  PAYMENT_STATUSES
} from '../../data/orders';

const boxTypeOptions = Object.keys(BOX_TYPES);

const initialFormState = {
  orderNumber: '',
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  club: '',
  team: '',
  orderType: ORDER_TYPES[0],
  status: ORDER_STATUSES[0],
  boxType: boxTypeOptions[0],
  boxNumber: String(BOX_TYPES[boxTypeOptions[0]][0]),
  personalisationDetails: '',
  missingItems: '',
  internalNotes: '',
  needsOrderingFromMacron: 'No',
  deliveryStatus: DELIVERY_STATUSES[0],
  paymentStatus: PAYMENT_STATUSES[0]
};

const fieldStyle = {
  width: '100%',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  padding: '10px 12px',
  fontSize: 14,
  background: '#fff'
};

export default function AddOrderPage() {
  const [formData, setFormData] = useState(initialFormState);
  const [createdOrder, setCreatedOrder] = useState(null);

  const availableBoxNumbers = useMemo(() => BOX_TYPES[formData.boxType] || [], [formData.boxType]);

  const handleChange = event => {
    const { name, value } = event.target;

    if (name === 'boxType') {
      setFormData(prev => ({
        ...prev,
        boxType: value,
        boxNumber: String(BOX_TYPES[value][0])
      }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = event => {
    event.preventDefault();

    const payload = {
      id: `temp-${Date.now()}`,
      ...formData,
      boxNumber: Number(formData.boxNumber)
    };

    console.log('Created order payload (temporary, in-memory only):', payload);
    setCreatedOrder(payload);
  };

  return (
    <main style={{ padding: 20, maxWidth: 900, margin: '0 auto' }}>
      <header style={{ marginBottom: 16 }}>
        <h1 style={{ marginBottom: 8 }}>Add Order</h1>
        <p style={{ margin: 0, color: '#4b5563' }}>
          Temporary local form. Submission logs payload to console until persistence is added.
        </p>
      </header>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <FormField label="Order Number" name="orderNumber" value={formData.orderNumber} onChange={handleChange} required />
          <FormField label="Customer Name" name="customerName" value={formData.customerName} onChange={handleChange} required />
          <FormField label="Customer Email" name="customerEmail" type="email" value={formData.customerEmail} onChange={handleChange} />
          <FormField label="Customer Phone" name="customerPhone" value={formData.customerPhone} onChange={handleChange} />
          <FormField label="Club" name="club" value={formData.club} onChange={handleChange} />
          <FormField label="Team" name="team" value={formData.team} onChange={handleChange} />

          <SelectField label="Order Type" name="orderType" value={formData.orderType} onChange={handleChange} options={ORDER_TYPES} />
          <SelectField label="Status" name="status" value={formData.status} onChange={handleChange} options={ORDER_STATUSES} />
          <SelectField label="Box Type" name="boxType" value={formData.boxType} onChange={handleChange} options={boxTypeOptions} />
          <SelectField
            label="Box Number"
            name="boxNumber"
            value={formData.boxNumber}
            onChange={handleChange}
            options={availableBoxNumbers.map(number => String(number))}
          />

          <SelectField
            label="Needs Ordering From Macron"
            name="needsOrderingFromMacron"
            value={formData.needsOrderingFromMacron}
            onChange={handleChange}
            options={['No', 'Yes']}
          />
          <SelectField
            label="Delivery Status"
            name="deliveryStatus"
            value={formData.deliveryStatus}
            onChange={handleChange}
            options={DELIVERY_STATUSES}
          />
          <SelectField
            label="Payment Status"
            name="paymentStatus"
            value={formData.paymentStatus}
            onChange={handleChange}
            options={PAYMENT_STATUSES}
          />
        </div>

        <FormField
          as="textarea"
          label="Personalisation Details"
          name="personalisationDetails"
          value={formData.personalisationDetails}
          onChange={handleChange}
        />
        <FormField as="textarea" label="Missing Items" name="missingItems" value={formData.missingItems} onChange={handleChange} />
        <FormField as="textarea" label="Internal Notes" name="internalNotes" value={formData.internalNotes} onChange={handleChange} />

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="submit"
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid #111827',
              background: '#111827',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Create Order
          </button>
          <Link
            href="/orders"
            style={{
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
      </form>

      {createdOrder && (
        <section style={{ marginTop: 20, border: '1px solid #86efac', borderRadius: 8, padding: 14, background: '#f0fdf4' }}>
          <h2 style={{ marginTop: 0, marginBottom: 8, fontSize: 18 }}>Order saved (temporary)</h2>
          <p style={{ marginTop: 0 }}>Created payload logged to console for handoff to future persistence layer.</p>
          <pre style={{ margin: 0, overflowX: 'auto', fontSize: 12 }}>{JSON.stringify(createdOrder, null, 2)}</pre>
        </section>
      )}
    </main>
  );
}

function FormField({ label, name, as, ...props }) {
  const Component = as === 'textarea' ? 'textarea' : 'input';

  return (
    <label style={{ display: 'grid', gap: 6, fontSize: 14, color: '#111827' }}>
      <span>{label}</span>
      <Component name={name} style={fieldStyle} rows={as === 'textarea' ? 4 : undefined} {...props} />
    </label>
  );
}

function SelectField({ label, name, value, onChange, options }) {
  return (
    <label style={{ display: 'grid', gap: 6, fontSize: 14, color: '#111827' }}>
      <span>{label}</span>
      <select name={name} value={value} onChange={onChange} style={fieldStyle}>
        {options.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
