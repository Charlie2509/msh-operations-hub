'use client';

import { useEffect, useState } from 'react';

const cardStyle = {
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  background: '#fff',
  padding: 14
};

function StatusPill({ ok }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        border: ok ? '1px solid #4ade80' : '1px solid #f87171',
        background: ok ? '#f0fdf4' : '#fef2f2'
      }}
    >
      {ok ? 'Connected' : 'Missing'}
    </span>
  );
}

export default function SettingsPage() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    fetch('/api/shopify/status', { cache: 'no-store' })
      .then(res => res.json())
      .then(payload => setStatus(payload))
      .catch(() => setStatus({ envStatus: {}, canConnect: false, missing: ['Unknown error'] }));
  }, []);

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gap: 12 }}>
      <header>
        <h1 style={{ marginBottom: 8 }}>Settings</h1>
        <p style={{ margin: 0, color: '#4b5563' }}>Integration readiness and internal system configuration overview.</p>
      </header>

      <section style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>Shopify Integration</h2>
        {!status ? (
          <p style={{ margin: 0 }}>Checking configuration…</p>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            <p style={{ margin: 0 }}>
              Connection readiness: <StatusPill ok={status.canConnect} />
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
              {Object.entries(status.envStatus || {}).map(([key, present]) => (
                <li key={key} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <span>{key}</span>
                  <StatusPill ok={present} />
                </li>
              ))}
            </ul>
            {status.missing?.length > 0 ? <p style={{ margin: 0, color: '#7f1d1d' }}>Missing: {status.missing.join(', ')}</p> : null}
          </div>
        )}
      </section>

      <section style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>Coming Next</h2>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>Shipping integration</li>
          <li>Sage integration</li>
          <li>Notifications and automations</li>
        </ul>
      </section>
    </main>
  );
}
