import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Capranica Scalo - Partenze FL3',
  description: 'Tabellone partenze in tempo reale per la stazione di Capranica-Sutri',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body className="bg-slate-100">{children}</body>
    </html>
  );
}
