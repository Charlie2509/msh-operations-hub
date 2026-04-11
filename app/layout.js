export const metadata = {
  title: 'MSH Operations Hub',
  description: 'Internal system'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'Arial, sans-serif', margin: 0 }}>
        {children}
      </body>
    </html>
  );
}
