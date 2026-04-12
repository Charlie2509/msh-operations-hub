'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/', label: 'Dashboard' },
  { href: '/orders', label: 'Orders' },
  { href: '/orders/new', label: 'Add Order' },
  { href: '/deliveries', label: 'Deliveries' },
  { href: '/production', label: 'Production' },
  { href: '/boxes', label: 'Boxes' },
  { href: '/sync/shopify', label: 'Shopify Sync' },
  { href: '/shipping', label: 'Shipping' },
  { href: '/settings', label: 'Settings' }
];

export default function AppShell({ children }) {
  const pathname = usePathname();

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <p className="brand">MSH Operations Hub</p>
        <nav className="nav-grid">
          {navLinks.map(link => {
            const active = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link key={link.href} href={link.href} className={`nav-link${active ? ' active' : ''}`}>
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="app-content">{children}</div>
    </div>
  );
}
