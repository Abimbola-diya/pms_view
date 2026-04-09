/**
 * Next.js Root Layout
 * Global styles, metadata, and provider setup
 */

import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PMS Spatial Intelligence Platform',
  description: 'Palantir-level spatial intelligence visualization for Nigerian petrochemical supply chain',
  icons: { icon: '/favicon.ico' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#0A0E27" />
      </head>
      <body className="bg-void-black text-text-primary antialiased">
        {children}
      </body>
    </html>
  );
}
