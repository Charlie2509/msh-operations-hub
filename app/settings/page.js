'use client';

import { useEffect, useState } from 'react';

function StatusPill({ state }) {
  const map = { connected: ['Connected', '#dcfce7', '#166534'], missing: ['Missing', '#fee2e2', '#991b1b'], pending: ['Coming Later', '#e2e8f0', '#334155'] };
  const [label, bg, color] = map[state] || map.pending;
  return <span className="badge" style={{ background: bg, color, borderColor: bg }}>{label}</span>;
}

export default function SettingsPage() {
  const [shopify, setShopify] = useState(null);

  useEffect(() => {
    fetch('/api/shopify/status', { cache: 'no-store' }).then(res => res.json()).then(payload => setShopify(payload)).catch(() => setShopify({ canConnect: false }));
  }, []);

  const cards = [
    { title: 'Shopify', state: shopify === null ? 'pending' : (shopify.canConnect ? 'connected' : 'missing'), detail: 'Read-only order import status and key availability.' },
    { title: 'Shipping', state: 'pending', detail: 'Courier and label integrations are planned.' },
    { title: 'Notifications', state: 'pending', detail: 'Operational alerts and reminders are not enabled yet.' },
    { title: 'Sage', state: 'pending', detail: 'Accounting integration intentionally deferred.' }
  ];

  return (
    <main className="page-wrap">
      <header className="page-head"><h1>Settings</h1><p>Internal service health and configuration readiness (no secrets exposed).</p></header>
      <section className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
        {cards.map(card => (
          <article key={card.title} className="card">
            <h2 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>{card.title} <StatusPill state={card.state} /></h2>
            <p style={{ margin: 0, color: 'var(--muted)' }}>{card.detail}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
