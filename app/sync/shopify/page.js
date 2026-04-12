'use client';

import { useMemo, useState } from 'react';
import { importShopifyOrders } from '../../lib/storage';

const cardStyle = {
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  background: '#fff',
  padding: 14
};

const buttonStyle = {
  width: 'fit-content',
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid #d1d5db',
  background: '#fff',
  fontWeight: 700,
  cursor: 'pointer'
};

export default function ShopifySyncPage() {
  const [shopifyOrders, setShopifyOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const canImport = useMemo(() => shopifyOrders.length > 0, [shopifyOrders.length]);

  const handleFetch = async () => {
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const response = await fetch('/api/shopify/orders?limit=30', { cache: 'no-store' });
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        setShopifyOrders([]);
        setStatus({ type: 'error', message: payload.error || 'Unable to fetch Shopify orders.' });
        return;
      }

      setShopifyOrders(payload.orders || []);
      setStatus({ type: 'success', message: `Fetched ${payload.orders.length} recent Shopify orders.` });
    } catch {
      setShopifyOrders([]);
      setStatus({ type: 'error', message: 'Unexpected error while fetching Shopify orders.' });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = () => {
    const result = importShopifyOrders(shopifyOrders);

    setStatus({
      type: 'success',
      message: `Imported ${result.importedCount} orders. Skipped ${result.skippedCount} duplicate(s).`
    });
  };

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gap: 12 }}>
      <header>
        <h1 style={{ marginBottom: 8 }}>Shopify Sync</h1>
        <p style={{ margin: 0, color: '#4b5563' }}>Pull Shopify orders into MSH Operations Hub (read-only Shopify integration).</p>
      </header>

      <section style={{ ...cardStyle, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button type="button" onClick={handleFetch} disabled={loading} style={buttonStyle}>
          {loading ? 'Fetching…' : 'Fetch Recent Shopify Orders'}
        </button>
        <button type="button" onClick={handleImport} disabled={!canImport} style={buttonStyle}>
          Import into Hub
        </button>
      </section>

      {status.message ? (
        <p
          style={{
            margin: 0,
            padding: 12,
            borderRadius: 8,
            border: status.type === 'error' ? '1px solid #fca5a5' : '1px solid #86efac',
            background: status.type === 'error' ? '#fef2f2' : '#f0fdf4'
          }}
        >
          {status.message}
        </p>
      ) : null}

      <section style={{ ...cardStyle, display: 'grid', gap: 10 }}>
        <h2 style={{ margin: 0 }}>Preview</h2>
        {shopifyOrders.length === 0 ? (
          <p style={{ margin: 0, color: '#6b7280' }}>No Shopify orders loaded yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
            {shopifyOrders.map(order => (
              <li key={order.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 10 }}>
                <p style={{ margin: 0, fontWeight: 700 }}>{order.orderNumber}</p>
                <p style={{ margin: '4px 0', fontSize: 14 }}>{order.customerName}</p>
                <p style={{ margin: '4px 0', fontSize: 13, color: '#4b5563' }}>Source: {order.sourceLabel}</p>
                <p style={{ margin: '4px 0', fontSize: 13, color: '#4b5563' }}>Items: {order.lineItemsSummary || 'No line items available'}</p>
                <p style={{ margin: '4px 0', fontSize: 13, color: '#4b5563' }}>Contact: {order.customerEmail || 'No email'} · {order.customerPhone || 'No phone'}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
