import Link from 'next/link';
import { orders } from '../data/orders';

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

export default function OrdersPage() {
  return (
    <main style={{ padding: 20, maxWidth: 1100, margin: '0 auto' }}>
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

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #d1d5db', textAlign: 'left' }}>
              <th style={{ padding: '8px 6px' }}>Order</th>
              <th style={{ padding: '8px 6px' }}>Customer</th>
              <th style={{ padding: '8px 6px' }}>Club</th>
              <th style={{ padding: '8px 6px' }}>Status</th>
              <th style={{ padding: '8px 6px' }}>Box</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                <td style={{ padding: '10px 6px' }}>
                  <Link href={`/orders/${o.id}`}>{o.orderNumber}</Link>
                </td>
                <td style={{ padding: '10px 6px' }}>{o.customerName}</td>
                <td style={{ padding: '10px 6px' }}>{o.club}</td>
                <td style={{ padding: '10px 6px' }}>{o.status}</td>
                <td style={{ padding: '10px 6px' }}>
                  {o.boxType} {o.boxNumber}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
