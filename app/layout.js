import './globals.css';
import AppShell from './components/app-shell';

export const metadata = {
  title: 'MSH Operations Hub',
  description: 'Connected internal operations system'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
