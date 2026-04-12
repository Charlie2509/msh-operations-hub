'use client';

import { useEffect, useMemo, useState } from 'react';
import { createDelivery, getDeliveries, getOrders, saveOrders, updateDelivery } from '../lib/storage';

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

const initialItem = { name: '', size: '', quantity: 1, club: '' };

export default function DeliveriesPage() {
  const [orders, setOrders] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [formData, setFormData] = useState(initialDelivery);
  const [itemForm, setItemForm] = useState(initialItem);

  useEffect(() => {
    setDeliveries(getDeliveries());
    setOrders(getOrders());
  }, []);

  const orderOptionsWithMissing = useMemo(
    () => orders.filter(order => order.missingItems.some(item => !item.fulfilled)),
    [orders]
  );

  const handleSubmit = event => {
    event.preventDefault();
    const created = createDelivery(formData);
    setDeliveries(prev => [created, ...prev]);
    setFormData(initialDelivery);
  };

  const addItemToDelivery = deliveryId => {
    if (!itemForm.name.trim()) {
      return;
    }

    const target = deliveries.find(delivery => delivery.id === deliveryId);
    const nextItems = [
      ...target.items,
      {
        id: `d-item-${Date.now()}`,
        name: itemForm.name,
        size: itemForm.size,
        quantity: Number(itemForm.quantity || 1),
        club: itemForm.club,
        matchedQuantity: 0
      }
    ];

    const updated = updateDelivery(deliveryId, { items: nextItems });
    setDeliveries(prev => prev.map(delivery => (delivery.id === deliveryId ? updated : delivery)));
    setItemForm(initialItem);
  };

  const matchToOrder = (delivery, deliveryItemId, orderId) => {
    const deliveryItem = delivery.items.find(item => item.id === deliveryItemId);
    const selectedOrder = orders.find(order => order.id === orderId);

    if (!deliveryItem || !selectedOrder) {
      return;
    }

    const missingIndex = selectedOrder.missingItems.findIndex(
      item =>
        !item.fulfilled &&
        item.name.toLowerCase() === deliveryItem.name.toLowerCase() &&
        (item.size || '').toLowerCase() === (deliveryItem.size || '').toLowerCase()
    );

    if (missingIndex < 0) {
      return;
    }

    const nextOrders = orders.map(order => {
      if (order.id !== orderId) {
        return order;
      }

      const nextMissing = [...order.missingItems];
      const targetMissing = nextMissing[missingIndex];
      const receivedQuantity = Math.min(targetMissing.quantity, (targetMissing.receivedQuantity || 0) + deliveryItem.quantity);
      const fulfilled = receivedQuantity >= targetMissing.quantity;
      nextMissing[missingIndex] = {
        ...targetMissing,
        receivedQuantity,
        fulfilled
      };

      const stillMissing = nextMissing.some(item => !item.fulfilled);

      return {
        ...order,
        missingItems: nextMissing,
        deliveryStatus: stillMissing ? 'Partially Delivered' : 'Fully Delivered',
        status: stillMissing ? 'Partially Delivered' : 'Fully Delivered',
        deliveryTracking: [
          ...order.deliveryTracking,
          {
            deliveryId: delivery.id,
            reference: delivery.reference,
            itemName: deliveryItem.name,
            size: deliveryItem.size,
            quantity: deliveryItem.quantity,
            matchedAt: new Date().toISOString()
          }
        ]
      };
    });

    const nextDeliveries = deliveries.map(entry => {
      if (entry.id !== delivery.id) {
        return entry;
      }
      const nextItems = entry.items.map(item =>
        item.id === deliveryItemId
          ? {
              ...item,
              matchedQuantity: Number(item.matchedQuantity || 0) + deliveryItem.quantity,
              matchedOrderId: orderId
            }
          : item
      );
      const allMatched = nextItems.every(item => Number(item.matchedQuantity || 0) >= Number(item.quantity || 0));
      return {
        ...entry,
        items: nextItems,
        status: allMatched ? 'Fully Delivered' : 'Partially Delivered'
      };
    });

    setOrders(nextOrders);
    setDeliveries(nextDeliveries);
    saveOrders(nextOrders);
    updateDelivery(delivery.id, nextDeliveries.find(item => item.id === delivery.id));
  };

  return (
    <main style={{ maxWidth: 980, margin: '0 auto' }}>
      <h1 style={{ marginTop: 0 }}>Deliveries</h1>
      <p style={{ color: '#4b5563' }}>Log deliveries, add line items, and match products to missing order items.</p>

      <section style={{ border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', padding: 14, marginBottom: 16 }}>
        <h2 style={{ marginTop: 0, fontSize: 20 }}>Add Delivery</h2>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <Input label="Delivery Reference" name="reference" value={formData.reference} onChange={setFormData} required />
            <Input label="Delivery Date" name="deliveryDate" value={formData.deliveryDate} type="date" onChange={setFormData} required />
            <Select label="Customs Hold" name="customsHold" value={formData.customsHold} options={['No', 'Yes']} onChange={setFormData} />
            <Select label="Partial Delivery" name="partialDelivery" value={formData.partialDelivery} options={['No', 'Yes']} onChange={setFormData} />
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
          <button type="submit" style={primaryButtonStyle}>Save Delivery</button>
        </form>
      </section>

      <section style={{ border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', padding: 14, marginBottom: 16 }}>
        <h2 style={{ marginTop: 0 }}>Orders with Missing Items</h2>
        {orderOptionsWithMissing.length === 0 ? (
          <p style={{ margin: 0 }}>No orders currently missing items.</p>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {orderOptionsWithMissing.map(order => (
              <article key={order.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 10 }}>
                <p style={{ margin: 0, fontWeight: 700 }}>{order.orderNumber} · {order.club || 'No club'}</p>
                <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
                  {order.missingItems.filter(item => !item.fulfilled).map(item => (
                    <li key={item.id}>{item.quantity}x {item.name} {item.size ? `(${item.size})` : ''}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        )}
      </section>

      <section style={{ display: 'grid', gap: 12 }}>
        {deliveries.length === 0 ? (
          <p style={{ margin: 0 }}>No deliveries logged yet.</p>
        ) : (
          deliveries.map(delivery => (
            <article key={delivery.id} style={{ border: '1px solid #e5e7eb', borderRadius: 10, background: '#fff', padding: 12, display: 'grid', gap: 10 }}>
              <div>
                <p style={{ margin: 0, fontWeight: 700 }}>{delivery.reference}</p>
                <p style={{ margin: '6px 0 0' }}>Date: {delivery.deliveryDate} · Status: {delivery.status || 'Unmatched'}</p>
              </div>

              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 10 }}>
                <h3 style={{ marginTop: 0, fontSize: 16 }}>Add Delivery Items</h3>
                <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
                  <input placeholder="Product" value={itemForm.name} onChange={e => setItemForm(prev => ({ ...prev, name: e.target.value }))} style={fieldStyle} />
                  <input placeholder="Size" value={itemForm.size} onChange={e => setItemForm(prev => ({ ...prev, size: e.target.value }))} style={fieldStyle} />
                  <input type="number" min="1" placeholder="Qty" value={itemForm.quantity} onChange={e => setItemForm(prev => ({ ...prev, quantity: Number(e.target.value || 1) }))} style={fieldStyle} />
                  <input placeholder="Club (optional)" value={itemForm.club} onChange={e => setItemForm(prev => ({ ...prev, club: e.target.value }))} style={fieldStyle} />
                </div>
                <button type="button" onClick={() => addItemToDelivery(delivery.id)} style={{ ...primaryButtonStyle, marginTop: 8 }}>
                  Add Item to Delivery
                </button>
              </div>

              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 10 }}>
                <h3 style={{ marginTop: 0, fontSize: 16 }}>MATCH TO ORDERS</h3>
                {delivery.items.length === 0 ? (
                  <p style={{ margin: 0, color: '#6b7280' }}>No delivery items added yet.</p>
                ) : (
                  delivery.items.map(item => (
                    <div key={item.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 10, marginBottom: 8 }}>
                      <p style={{ margin: 0, fontWeight: 600 }}>
                        {item.quantity}x {item.name} {item.size ? `(${item.size})` : ''} {item.club ? `· ${item.club}` : ''}
                      </p>
                      <select
                        style={{ ...fieldStyle, marginTop: 8 }}
                        defaultValue=""
                        onChange={event => {
                          if (event.target.value) {
                            matchToOrder(delivery, item.id, event.target.value);
                            event.target.value = '';
                          }
                        }}
                      >
                        <option value="">Assign to order…</option>
                        {orderOptionsWithMissing.map(order => (
                          <option key={order.id} value={order.id}>
                            {order.orderNumber} · {order.club || 'No club'}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))
                )}
              </div>
            </article>
          ))
        )}
      </section>
    </main>
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
      <select name={name} value={value} onChange={event => onChange(prev => ({ ...prev, [name]: event.target.value }))} style={fieldStyle}>
        {options.map(option => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}
