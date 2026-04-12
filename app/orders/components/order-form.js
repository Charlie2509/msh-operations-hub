'use client';

import {
  BOX_TYPES,
  DELIVERY_STATUSES,
  ORDER_STATUSES,
  ORDER_TYPES,
  PAYMENT_STATUSES
} from '../../data/orders';

const boxTypeOptions = Object.keys(BOX_TYPES);

const fieldStyle = {
  width: '100%',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  padding: '10px 12px',
  fontSize: 14,
  background: '#fff'
};

export function getInitialOrderForm(overrides = {}) {
  const defaultBoxType = boxTypeOptions[0];

  return {
    orderNumber: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    club: '',
    team: '',
    orderType: ORDER_TYPES[0],
    status: ORDER_STATUSES[0],
    boxType: defaultBoxType,
    boxNumber: String(BOX_TYPES[defaultBoxType][0]),
    personalisationDetails: '',
    missingItems: '',
    internalNotes: '',
    needsOrderingFromMacron: 'No',
    deliveryStatus: DELIVERY_STATUSES[0],
    paymentStatus: PAYMENT_STATUSES[0],
    ...overrides,
    boxNumber: String(overrides.boxNumber || BOX_TYPES[overrides.boxType || defaultBoxType][0])
  };
}

export default function OrderForm({ formData, onChange, onSubmit, submitLabel }) {
  const boxNumbers = BOX_TYPES[formData.boxType] || [];

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <FormField label="Order Number" name="orderNumber" value={formData.orderNumber} onChange={onChange} required />
        <FormField label="Customer Name" name="customerName" value={formData.customerName} onChange={onChange} required />
        <FormField label="Customer Email" name="customerEmail" type="email" value={formData.customerEmail} onChange={onChange} />
        <FormField label="Customer Phone" name="customerPhone" value={formData.customerPhone} onChange={onChange} />
        <FormField label="Club" name="club" value={formData.club} onChange={onChange} />
        <FormField label="Team" name="team" value={formData.team} onChange={onChange} />

        <SelectField label="Order Type" name="orderType" value={formData.orderType} onChange={onChange} options={ORDER_TYPES} />
        <SelectField label="Status" name="status" value={formData.status} onChange={onChange} options={ORDER_STATUSES} />
        <SelectField label="Box Type" name="boxType" value={formData.boxType} onChange={onChange} options={boxTypeOptions} />
        <SelectField
          label="Box Number"
          name="boxNumber"
          value={formData.boxNumber}
          onChange={onChange}
          options={boxNumbers.map(number => String(number))}
        />
        <SelectField
          label="Needs Ordering From Macron"
          name="needsOrderingFromMacron"
          value={formData.needsOrderingFromMacron}
          onChange={onChange}
          options={['No', 'Yes']}
        />
        <SelectField
          label="Delivery Status"
          name="deliveryStatus"
          value={formData.deliveryStatus}
          onChange={onChange}
          options={DELIVERY_STATUSES}
        />
        <SelectField
          label="Payment Status"
          name="paymentStatus"
          value={formData.paymentStatus}
          onChange={onChange}
          options={PAYMENT_STATUSES}
        />
      </div>

      <FormField
        as="textarea"
        label="Personalisation Details"
        name="personalisationDetails"
        value={formData.personalisationDetails}
        onChange={onChange}
      />
      <FormField as="textarea" label="Missing Items" name="missingItems" value={formData.missingItems} onChange={onChange} />
      <FormField as="textarea" label="Internal Notes" name="internalNotes" value={formData.internalNotes} onChange={onChange} />

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
        {submitLabel}
      </button>
    </form>
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
