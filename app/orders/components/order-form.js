'use client';

import {
  BOX_TYPES,
  DELIVERY_STATUSES,
  ORDER_STATUSES,
  ORDER_TYPES,
  PAYMENT_STATUSES
} from '../../data/orders';
import { normalizeMissingItem, parseLegacyMissingItems } from '../../lib/order-utils';

const boxTypeOptions = Object.keys(BOX_TYPES);

const fieldStyle = {
  width: '100%',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  padding: '10px 12px',
  fontSize: 14,
  background: '#fff'
};

function getMissingItemsFromOverrides(overrides) {
  if (Array.isArray(overrides.missingItems)) {
    return overrides.missingItems.map((item, index) => normalizeMissingItem(item, index));
  }

  if (typeof overrides.missingItems === 'string') {
    return parseLegacyMissingItems(overrides.missingItems);
  }

  return [];
}

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
    missingItems: [],
    internalNotes: '',
    needsOrderingFromMacron: 'No',
    deliveryStatus: DELIVERY_STATUSES[0],
    paymentStatus: PAYMENT_STATUSES[0],
    ...overrides,
    missingItems: getMissingItemsFromOverrides(overrides),
    boxNumber: String(overrides.boxNumber || BOX_TYPES[overrides.boxType || defaultBoxType][0])
  };
}

export default function OrderForm({ formData, onChange, onSubmit, submitLabel, onMissingItemsChange }) {
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

      <section style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, display: 'grid', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Missing Items</h3>
          <button
            type="button"
            onClick={() => onMissingItemsChange(prev => [...prev, normalizeMissingItem({}, prev.length)])}
            style={smallButtonStyle}
          >
            + Add Missing Item
          </button>
        </div>

        {formData.missingItems.length === 0 ? (
          <p style={{ margin: 0, color: '#6b7280' }}>No missing items logged.</p>
        ) : (
          formData.missingItems.map((item, index) => (
            <div key={item.id || index} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 10, display: 'grid', gap: 8 }}>
              <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
                <FormField
                  label="Product"
                  name={`missing-name-${index}`}
                  value={item.name}
                  onChange={event => {
                    const next = [...formData.missingItems];
                    next[index] = { ...next[index], name: event.target.value };
                    onMissingItemsChange(next);
                  }}
                />
                <FormField
                  label="Size"
                  name={`missing-size-${index}`}
                  value={item.size}
                  onChange={event => {
                    const next = [...formData.missingItems];
                    next[index] = { ...next[index], size: event.target.value };
                    onMissingItemsChange(next);
                  }}
                />
                <FormField
                  label="Qty"
                  type="number"
                  min="1"
                  name={`missing-qty-${index}`}
                  value={item.quantity}
                  onChange={event => {
                    const next = [...formData.missingItems];
                    next[index] = { ...next[index], quantity: Number(event.target.value || 1) };
                    onMissingItemsChange(next);
                  }}
                />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={item.fulfilled}
                  onChange={event => {
                    const next = [...formData.missingItems];
                    next[index] = { ...next[index], fulfilled: event.target.checked };
                    onMissingItemsChange(next);
                  }}
                />
                Fulfilled
              </label>
              <button
                type="button"
                onClick={() => onMissingItemsChange(formData.missingItems.filter((_, itemIndex) => itemIndex !== index))}
                style={smallButtonStyle}
              >
                Remove Item
              </button>
            </div>
          ))
        )}
      </section>

      <FormField as="textarea" label="Internal Notes" name="internalNotes" value={formData.internalNotes} onChange={onChange} />

      <button type="submit" style={primaryButtonStyle}>
        {submitLabel}
      </button>
    </form>
  );
}

const primaryButtonStyle = {
  width: 'fit-content',
  padding: '12px 16px',
  borderRadius: 10,
  border: '1px solid #111827',
  background: '#111827',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer'
};

const smallButtonStyle = {
  width: 'fit-content',
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid #d1d5db',
  background: '#fff',
  cursor: 'pointer',
  fontWeight: 600
};

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
