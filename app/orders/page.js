'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ORDER_STATUSES, ORDER_TYPES } from '../data/orders';
import { useHubData } from '../lib/use-hub-data';

function SourceBadge({ sourceSystem }) {
  return <span className="badge">{sourceSystem === 'shopify' ? 'Shopify' : 'Manual'}</span>;
}

export default function OrdersPage() {
  const { orders } = useHubData();
  const [filters, setFilters] = useState({ search: '', status: 'All', orderType: 'All', club: 'All', needsOrderingFromMacron: 'All', sourceSystem: 'All' });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setFilters(prev => ({
      ...prev,
      status: params.get('status') || prev.status,
      needsOrderingFromMacron: params.get('needsOrderingFromMacron') || prev.needsOrderingFromMacron,
      sourceSystem: params.get('sourceSystem') || prev.sourceSystem
    }));
  }, []);

  const clubOptions = useMemo(() => ['All', ...Array.from(new Set(orders.map(o => o.club).filter(Boolean))).sort()], [orders]);
  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return orders.filter(order => {
      const matchesSearch = !q || [order.orderNumber, order.customerName, order.club].some(v => (v || '').toLowerCase().includes(q));
      return (filters.status === 'All' || order.status === filters.status)
      && (filters.orderType === 'All' || order.orderType === filters.orderType)
      && (filters.club === 'All' || order.club === filters.club)
      && (filters.sourceSystem === 'All' || order.sourceSystem === filters.sourceSystem)
      && (filters.needsOrderingFromMacron === 'All' || order.needsOrderingFromMacron === filters.needsOrderingFromMacron)
      && matchesSearch;
    });
  }, [orders, filters]);

  return (
    <main className="page-wrap">
      <header className="page-head" style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'end', flexWrap: 'wrap' }}>
        <div><h1>Orders</h1><p>Search and filter all order records across manual and Shopify sources.</p></div>
        <div className="btn-row">
          <Link href="/production" className="btn">Production Queue</Link>
          <Link href="/orders/new" className="btn primary">Add Order</Link>
        </div>
      </header>

      <section className="card grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))' }}>
        <label className="label" style={{ gridColumn: '1 / -1' }}>Search<input className="field" placeholder="Order number, customer, club" value={filters.search} onChange={e => setFilters(p => ({ ...p, search: e.target.value }))} /></label>
        <Filter label="Status" value={filters.status} options={['All', ...ORDER_STATUSES]} onChange={status => setFilters(p => ({ ...p, status }))} />
        <Filter label="Order Type" value={filters.orderType} options={['All', ...ORDER_TYPES]} onChange={orderType => setFilters(p => ({ ...p, orderType }))} />
        <Filter label="Club" value={filters.club} options={clubOptions} onChange={club => setFilters(p => ({ ...p, club }))} />
        <Filter label="Source" value={filters.sourceSystem} options={['All', 'manual', 'shopify']} onChange={sourceSystem => setFilters(p => ({ ...p, sourceSystem }))} />
        <Filter label="Needs Macron" value={filters.needsOrderingFromMacron} options={['All', 'Yes', 'No']} onChange={needsOrderingFromMacron => setFilters(p => ({ ...p, needsOrderingFromMacron }))} />
      </section>

      <section className="card table-wrap">
        <table className="table">
          <thead><tr><th>Order</th><th>Customer</th><th>Club/Team</th><th>Type</th><th>Status</th><th>Box</th><th>Delivery</th><th>Source</th></tr></thead>
          <tbody>
            {filtered.map(order => (
              <tr key={order.id}>
                <td><Link href={`/orders/${order.id}`} style={{ fontWeight: 700 }}>{order.orderNumber}</Link></td>
                <td>{order.customerName}</td>
                <td>{order.club || '—'} / {order.team || '—'}</td>
                <td>{order.orderType}</td>
                <td>{order.status}</td>
                <td>{order.boxType} {order.boxNumber}</td>
                <td>{order.deliveryStatus}</td>
                <td><SourceBadge sourceSystem={order.sourceSystem} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}

function Filter({ label, value, onChange, options }) {
  return <label className="label">{label}<select value={value} onChange={e => onChange(e.target.value)}>{options.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></label>;
}
