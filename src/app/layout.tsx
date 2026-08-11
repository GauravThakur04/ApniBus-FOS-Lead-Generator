import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

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
      <body className="flex min-h-screen bg-slate-50 antialiased text-slate-900 font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 p-6 overflow-y-auto bg-slate-50">{children}</main>
        </div>
      </body>
    </html>
  );
}
