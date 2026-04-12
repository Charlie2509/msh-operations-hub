import Link from 'next/link';

export const metadata = {
  title: 'MSH Operations Hub',
  description: 'Internal system'
};

const navLinks = [
  { href: '/', label: 'Dashboard' },
  { href: '/orders', label: 'Orders' },
  { href: '/orders/new', label: 'Add Order' },
  { href: '/sync/shopify', label: 'Shopify Sync' },
  { href: '/deliveries', label: 'Deliveries' },
  { href: '/production', label: 'Production' },
  { href: '/shipping', label: 'Shipping' },
  { href: '/boxes', label: 'Boxes' },
  { href: '/settings', label: 'Settings' }
];

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'Arial, sans-serif', margin: 0, background: '#f8fafc', color: '#0f172a' }}>
        <header style={{ borderBottom: '1px solid #e2e8f0', background: '#ffffff' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '14px 16px' }}>
            <p style={{ margin: '0 0 10px', fontWeight: 700 }}>MSH Operations Hub</p>
            <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    textDecoration: 'none',
                    fontSize: 14,
                    color: '#0f172a',
                    border: '1px solid #d1d5db',
                    borderRadius: 8,
                    padding: '10px 12px',
                    background: '#fff',
                    fontWeight: 700
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <div style={{ padding: '16px' }}>{children}</div>
      </body>
    </html>
  );
}
