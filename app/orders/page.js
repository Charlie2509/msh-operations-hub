const orders = [
  { id: '1001', club: 'Hastings Utd', status: 'In Progress' },
  { id: '1002', club: 'Eastbourne Utd', status: 'Pending' }
];

export default function OrdersPage() {
  return (
    <main style={{ padding: 20 }}>
      <h1>Orders</h1>
      <ul>
        {orders.map(o => (
          <li key={o.id}>
            <a href={`/orders/${o.id}`}>
              #{o.id} - {o.club} ({o.status})
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
