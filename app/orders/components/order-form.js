'use client';

import { BOX_TYPES, DELIVERY_STATUSES, ORDER_STATUSES, ORDER_TYPES, PAYMENT_STATUSES } from '../../data/orders';
import { normalizeMissingItem, parseLegacyMissingItems } from '../../lib/order-utils';

const boxTypeOptions = Object.keys(BOX_TYPES);

function getMissingItemsFromOverrides(overrides) {
  if (Array.isArray(overrides.missingItems)) return overrides.missingItems.map((item, i) => normalizeMissingItem(item, i));
  if (typeof overrides.missingItems === 'string') return parseLegacyMissingItems(overrides.missingItems);
  return [];
}

export function getInitialOrderForm(overrides = {}) {
  const defaultBoxType = overrides.boxType || boxTypeOptions[0];
  return {
    orderNumber: '', customerName: '', customerEmail: '', customerPhone: '',
    club: '', team: '', orderType: ORDER_TYPES[0], status: ORDER_STATUSES[0],
    boxType: defaultBoxType, boxNumber: String(BOX_TYPES[defaultBoxType][0]), personalisationDetails: '',
    missingItems: [], internalNotes: '', needsOrderingFromMacron: 'No', deliveryStatus: DELIVERY_STATUSES[0], paymentStatus: PAYMENT_STATUSES[0],
    ...overrides,
    missingItems: getMissingItemsFromOverrides(overrides),
    boxNumber: String(overrides.boxNumber || BOX_TYPES[defaultBoxType][0])
  };
}

export default function OrderForm({ formData, onChange, onSubmit, submitLabel, onMissingItemsChange }) {
  const boxNumbers = BOX_TYPES[formData.boxType] || [];

  return (
    <form onSubmit={onSubmit} className="grid">
      <Section title="Customer">
        <Fields><Field label="Customer Name" name="customerName" value={formData.customerName} onChange={onChange} required /><Field label="Customer Email" name="customerEmail" type="email" value={formData.customerEmail} onChange={onChange} /><Field label="Customer Phone" name="customerPhone" value={formData.customerPhone} onChange={onChange} /></Fields>
      </Section>
      <Section title="Order">
        <Fields><Field label="Order Number" name="orderNumber" value={formData.orderNumber} onChange={onChange} required /><Field label="Club" name="club" value={formData.club} onChange={onChange} /><Field label="Team" name="team" value={formData.team} onChange={onChange} /><Select label="Order Type" name="orderType" value={formData.orderType} onChange={onChange} options={ORDER_TYPES} /><Select label="Status" name="status" value={formData.status} onChange={onChange} options={ORDER_STATUSES} /></Fields>
      </Section>
      <Section title="Delivery / Supplier">
        <Fields><Select label="Needs Ordering From Macron" name="needsOrderingFromMacron" value={formData.needsOrderingFromMacron} onChange={onChange} options={['No', 'Yes']} /><Select label="Delivery Status" name="deliveryStatus" value={formData.deliveryStatus} onChange={onChange} options={DELIVERY_STATUSES} /><Select label="Payment Status" name="paymentStatus" value={formData.paymentStatus} onChange={onChange} options={PAYMENT_STATUSES} /></Fields>
      </Section>
      <Section title="Production">
        <Fields><Select label="Box Type" name="boxType" value={formData.boxType} onChange={onChange} options={boxTypeOptions} /><Select label="Box Number" name="boxNumber" value={formData.boxNumber} onChange={onChange} options={boxNumbers.map(String)} /><Field as="textarea" label="Personalisation Details" name="personalisationDetails" value={formData.personalisationDetails} onChange={onChange} /></Fields>
      </Section>
      <Section title="Notes">
        <Field as="textarea" label="Internal Notes" name="internalNotes" value={formData.internalNotes} onChange={onChange} />
      </Section>

      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0 }}>Missing/Received Items</h2>
          <button type="button" className="btn" onClick={() => onMissingItemsChange(prev => [...prev, normalizeMissingItem({}, prev.length)])}>+ Add Item</button>
        </div>
        <div className="grid" style={{ marginTop: 10 }}>
          {formData.missingItems.map((item, index) => (
            <div key={item.id || index} className="card">
              <Fields>
                <Field label="Product" value={item.name} onChange={e => mutate(index, { name: e.target.value }, formData, onMissingItemsChange)} />
                <Field label="Size" value={item.size} onChange={e => mutate(index, { size: e.target.value }, formData, onMissingItemsChange)} />
                <Field label="Qty" type="number" min="1" value={item.quantity} onChange={e => mutate(index, { quantity: Number(e.target.value || 1) }, formData, onMissingItemsChange)} />
              </Fields>
              <button type="button" className="btn" style={{ marginTop: 8 }} onClick={() => onMissingItemsChange(formData.missingItems.filter((_, i) => i !== index))}>Remove</button>
            </div>
          ))}
          {formData.missingItems.length === 0 ? <p style={{ margin: 0, color: 'var(--muted)' }}>No missing items logged.</p> : null}
        </div>
      </section>

      <button type="submit" className="btn primary">{submitLabel}</button>
    </form>
  );
}

function mutate(index, patch, formData, onMissingItemsChange) {
  const next = [...formData.missingItems];
  next[index] = { ...next[index], ...patch };
  onMissingItemsChange(next);
}

function Section({ title, children }) { return <section className="card"><h2>{title}</h2>{children}</section>; }
function Fields({ children }) { return <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>{children}</div>; }
function Field({ label, name, as, ...props }) { const C = as === 'textarea' ? 'textarea' : 'input'; return <label className="label">{label}<C name={name} className="field" rows={as === 'textarea' ? 4 : undefined} {...props} /></label>; }
function Select({ label, name, value, onChange, options }) { return <label className="label">{label}<select name={name} value={value} onChange={onChange}>{options.map(o => <option key={o} value={o}>{o}</option>)}</select></label>; }
