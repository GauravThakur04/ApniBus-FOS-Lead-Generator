import type { Metadata } from 'next';
import './globals.css';
import { AppWrapper } from '@/components/layout/AppWrapper';

export const metadata: Metadata = {
  title: 'ApniBus FOS Lead Generator | Intercity POS Sales Hub',
  description: 'Production sales lead generation and FOS executive CRM dashboard for intercity bus operators',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 antialiased text-slate-900 font-sans">
        <AppWrapper>{children}</AppWrapper>
      </body>
    </html>
  );
}
