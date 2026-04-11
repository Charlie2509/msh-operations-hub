import { orders } from '../../data/orders';

export default function OrderDetail({ params }) {
  const order = orders.find(o => o.id === params.id);

  if (!order) {
    return (
      <main style={{ padding: 20 }}>
        <h1>Order not found</h1>
      </main>
    );
  }

  return (
    <main style={{ padding: 20 }}>
      <h1>{order.orderNumber}</h1>

      <div style={{ display: 'grid', gap: 16 }}>
        <section>
          <h2>Customer</h2>
          <p><strong>Name:</strong> {order.customerName}</p>
          <p><strong>Email:</strong> {order.customerEmail || '—'}</p>
          <p><strong>Phone:</strong> {order.customerPhone || '—'}</p>
        </section>

        <section>
          <h2>Order Info</h2>
          <p><strong>Club:</strong> {order.club || '—'}</p>
          <p><strong>Team:</strong> {order.team || '—'}</p>
          <p><strong>Order Type:</strong> {order.orderType || '—'}</p>
          <p><strong>Status:</strong> {order.status || '—'}</p>
          <p><strong>Needs Ordering From Macron:</strong> {order.needsOrderingFromMacron || '—'}</p>
          <p><strong>Delivery Status:</strong> {order.deliveryStatus || '—'}</p>
          <p><strong>Payment Status:</strong> {order.paymentStatus || '—'}</p>
        </section>

        <section>
          <h2>Box</h2>
          <p><strong>Box Type:</strong> {order.boxType || '—'}</p>
          <p><strong>Box Number:</strong> {order.boxNumber || '—'}</p>
        </section>

        <section>
          <h2>Production</h2>
          <p><strong>Personalisation:</strong> {order.personalisationDetails || '—'}</p>
          <p><strong>Missing Items:</strong> {order.missingItems || '—'}</p>
          <p><strong>Internal Notes:</strong> {order.internalNotes || '—'}</p>
        </section>
      </div>
    </main>
  );
}