'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ORDER_STATUSES, ORDER_TYPES } from '../data/orders';
import { getOrders } from '../lib/storage';

const actionLinkStyle = {
  display: 'inline-block',
  padding: '10px 14px',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  textDecoration: 'none',
  color: '#111827',
  fontWeight: 600,
  fontSize: 14,
  background: '#fff'
};

const fieldStyle = {
  border: '1px solid #d1d5db',
  borderRadius: 8,
  padding: '10px 12px',
  fontSize: 14,
  background: '#fff'
};

function formatDate(isoString) {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString();
}

function SourceBadge({ sourceSystem }) {
  const isShopify = sourceSystem === 'shopify';
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        border: isShopify ? '1px solid #c4b5fd' : '1px solid #bfdbfe',
        background: isShopify ? '#f5f3ff' : '#eff6ff'
      }}
    >
      {isShopify ? 'Shopify' : 'Manual'}
    </span>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: 'All',
    orderType: 'All',
    club: 'All',
    needsOrderingFromMacron: 'All',
    sourceSystem: 'All'
  });

  useEffect(() => {
    setOrders(getOrders());

    const media = window.matchMedia('(max-width: 767px)');
    const syncViewport = () => setIsMobile(media.matches);
    syncViewport();
    media.addEventListener('change', syncViewport);
    return () => media.removeEventListener('change', syncViewport);
  }, []);

  const clubOptions = useMemo(
    () => ['All', ...Array.from(new Set(orders.map(order => order.club).filter(Boolean))).sort()],
    [orders]
  );

  const filteredOrders = useMemo(() => {
    const q = filters.search.trim().toLowerCase();

    return orders.filter(order => {
      const matchesSearch =
        !q ||
        (order.orderNumber || '').toLowerCase().includes(q) ||
        (order.customerName || '').toLowerCase().includes(q) ||
        (order.club || '').toLowerCase().includes(q);

      const matchesStatus = filters.status === 'All' || order.status === filters.status;
      const matchesType = filters.orderType === 'All' || order.orderType === filters.orderType;
      const matchesClub = filters.club === 'All' || order.club === filters.club;
      const matchesMacron =
        filters.needsOrderingFromMacron === 'All' || order.needsOrderingFromMacron === filters.needsOrderingFromMacron;
      const matchesSource = filters.sourceSystem === 'All' || order.sourceSystem === filters.sourceSystem;

      return matchesSearch && matchesStatus && matchesType && matchesClub && matchesMacron && matchesSource;
    });
  }, [orders, filters]);

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 16
        }}
      >
        <h1 style={{ margin: 0 }}>Orders</h1>
        <Link href="/orders/new" style={actionLinkStyle}>
          Add Order
        </Link>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 16 }}>
        <input
          placeholder="Search order/customer/club"
          value={filters.search}
          onChange={event => setFilters(prev => ({ ...prev, search: event.target.value }))}
          style={{ ...fieldStyle, gridColumn: '1 / -1' }}
        />
        <FilterSelect
          label="Status"
          value={filters.status}
          onChange={value => setFilters(prev => ({ ...prev, status: value }))}
          options={['All', ...ORDER_STATUSES]}
        />
        <FilterSelect
          label="Order Type"
          value={filters.orderType}
          onChange={value => setFilters(prev => ({ ...prev, orderType: value }))}
          options={['All', ...ORDER_TYPES]}
        />
        <FilterSelect
          label="Club"
          value={filters.club}
          onChange={value => setFilters(prev => ({ ...prev, club: value }))}
          options={clubOptions}
        />
        <FilterSelect
          label="Needs Macron"
          value={filters.needsOrderingFromMacron}
          onChange={value => setFilters(prev => ({ ...prev, needsOrderingFromMacron: value }))}
          options={['All', 'Yes', 'No']}
        />
        <FilterSelect
          label="Source"
          value={filters.sourceSystem}
          onChange={value => setFilters(prev => ({ ...prev, sourceSystem: value }))}
          options={['All', 'manual', 'shopify']}
        />
      </section>

      {isMobile ? (
        <section style={{ display: 'grid', gap: 10 }}>
          {filteredOrders.map(order => (
            <article key={order.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                <Link href={`/orders/${order.id}`} style={{ fontWeight: 700 }}>
                  {order.orderNumber}
                </Link>
                <SourceBadge sourceSystem={order.sourceSystem} />
              </div>
              <p style={{ margin: '8px 0 0', fontSize: 14 }}>{order.customerName}</p>
              <p style={{ margin: '4px 0', color: '#4b5563', fontSize: 13 }}>
                {order.club || 'No club'} · {order.team || 'No team'} · {order.orderType}
              </p>
              <p style={{ margin: '4px 0', fontSize: 13 }}>Status: {order.status}</p>
              <p style={{ margin: '4px 0', fontSize: 13 }}>Created: {formatDate(order.createdAt)}</p>
              <p style={{ margin: '4px 0', fontSize: 13 }}>
                Box: {order.boxType} {order.boxNumber}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 13 }}>Delivery: {order.deliveryStatus}</p>
            </article>
          ))}
        </section>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1100, background: '#fff' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #d1d5db', textAlign: 'left' }}>
                <th style={{ padding: '8px 6px' }}>Order</th>
                <th style={{ padding: '8px 6px' }}>Source</th>
                <th style={{ padding: '8px 6px' }}>Created</th>
                <th style={{ padding: '8px 6px' }}>Customer</th>
                <th style={{ padding: '8px 6px' }}>Club</th>
                <th style={{ padding: '8px 6px' }}>Team</th>
                <th style={{ padding: '8px 6px' }}>Order Type</th>
                <th style={{ padding: '8px 6px' }}>Status</th>
                <th style={{ padding: '8px 6px' }}>Box</th>
                <th style={{ padding: '8px 6px' }}>Delivery</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '10px 6px' }}>
                    <Link href={`/orders/${order.id}`}>{order.orderNumber}</Link>
                  </td>
                  <td style={{ padding: '10px 6px' }}>
                    <SourceBadge sourceSystem={order.sourceSystem} />
                  </td>
                  <td style={{ padding: '10px 6px' }}>{formatDate(order.createdAt)}</td>
                  <td style={{ padding: '10px 6px' }}>{order.customerName}</td>
                  <td style={{ padding: '10px 6px' }}>{order.club || '—'}</td>
                  <td style={{ padding: '10px 6px' }}>{order.team || '—'}</td>
                  <td style={{ padding: '10px 6px' }}>{order.orderType}</td>
                  <td style={{ padding: '10px 6px' }}>{order.status}</td>
                  <td style={{ padding: '10px 6px' }}>
                    {order.boxType} {order.boxNumber}
                  </td>
                  <td style={{ padding: '10px 6px' }}>{order.deliveryStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <label style={{ display: 'grid', gap: 6, fontSize: 13 }}>
      <span>{label}</span>
      <select value={value} onChange={event => onChange(event.target.value)} style={fieldStyle}>
        {options.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
