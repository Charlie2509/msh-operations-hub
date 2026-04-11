import { orders } from '../data/orders';

export default function OrdersPage() {
  return (
    <main style={{ padding: 20 }}>
      <h1>Orders</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Club</th>
            <th>Status</th>
            <th>Box</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(o => (
            <tr key={o.id} style={{ borderTop: '1px solid #ddd' }}>
              <td>
                <a href={`/orders/${o.id}`}>{o.orderNumber}</a>
              </td>
              <td>{o.customerName}</td>
              <td>{o.club}</td>
              <td>{o.status}</td>
              <td>{o.boxType} {o.boxNumber}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
