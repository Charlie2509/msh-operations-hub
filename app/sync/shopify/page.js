'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { importShopifyOrders } from '../../lib/storage';

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
        setStatus({ type: 'error', message: payload.error || 'Unable to fetch Shopify orders. Check Shopify env settings in Settings.' });
        return;
      }
      setShopifyOrders(payload.orders || []);
      setStatus({ type: 'success', message: `Fetched ${payload.orders.length} Shopify orders.` });
    } catch {
      setShopifyOrders([]);
      setStatus({ type: 'error', message: 'Unexpected error while fetching Shopify orders.' });
    } finally { setLoading(false); }
  };

  const handleImport = () => {
    const result = importShopifyOrders(shopifyOrders);
    setStatus({ type: 'success', message: `Imported ${result.importedCount} orders. Skipped ${result.skippedCount} duplicates.` });
  };

  return (
    <main className="page-wrap">
      <header className="page-head"><h1>Shopify Sync</h1><p>Read-only Shopify import. Fetch, review, and bring orders into the hub with duplicate protection.</p></header>
      <section className="card btn-row">
        <button type="button" className="btn" onClick={handleFetch} disabled={loading}>{loading ? 'Fetching…' : 'Fetch Recent Shopify Orders'}</button>
        <button type="button" className="btn primary" onClick={handleImport} disabled={!canImport}>Import into Hub</button>
        <Link href="/orders?sourceSystem=shopify" className="btn">View Shopify Orders</Link>
      </section>
      {status.message ? <p className="card" style={{ margin: 0, borderColor: status.type === 'error' ? '#fca5a5' : 'var(--border)' }}>{status.message}</p> : null}

      <section className="card">
        <h2>Fetched Order Preview</h2>
        {shopifyOrders.length === 0 ? <p style={{ margin: 0 }}>No Shopify orders loaded.</p> : (
          <ul className="status-list">
            {shopifyOrders.map(order => (
              <li key={order.id} className="card">
                <strong>{order.orderNumber}</strong> <span className="badge">Source: Shopify/Web</span>
                <div style={{ color: 'var(--muted)', marginTop: 4 }}>{order.customerName} · {order.customerEmail || 'No email'} · {order.customerPhone || 'No phone'}</div>
                <div style={{ color: 'var(--muted)', marginTop: 4 }}>Items: {order.lineItemsSummary || 'No line items available'}</div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <p style={{ color: 'var(--muted)', margin: 0 }}>TODO: add scheduled Shopify auto-import and notification hooks after manual workflow sign-off.</p>
    </main>
  );
}
