'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export function AppWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // If on /login page, don't check auth
    if (pathname === '/login') {
      setIsAuthenticated(true);
      return;
    }

    // Check if user session exists in localStorage
    const savedEmail = localStorage.getItem('userEmail');
    const savedRole = localStorage.getItem('userRole');

    if (!savedEmail || savedEmail.trim() === '') {
      setIsAuthenticated(false);
      router.push('/login');
      return;
    }

    const cleanEmail = savedEmail.toLowerCase().trim();

    // Strict Portal Access Guards for Managers (Sonu, Tarun, Rajnish)
    if (cleanEmail === 'sonu.mishra@apnibus.com') {
      if (pathname !== '/portal/sonu' && !pathname.startsWith('/portal/sonu')) {
        router.push('/portal/sonu');
        setIsAuthenticated(true);
        return;
      }
    } else if (cleanEmail === 'tarun.kumar@apnibus.com') {
      if (pathname !== '/portal/tarun' && !pathname.startsWith('/portal/tarun')) {
        router.push('/portal/tarun');
        setIsAuthenticated(true);
        return;
      }
    } else if (cleanEmail === 'rajnish.kumar@apnibus.com') {
      if (pathname !== '/portal/rajnish' && !pathname.startsWith('/portal/rajnish')) {
        router.push('/portal/rajnish');
        setIsAuthenticated(true);
        return;
      }
    }

    setIsAuthenticated(true);
  }, [pathname, router]);

  // If on login page, render full screen login with no sidebar/header
  if (pathname === '/login') {
    return <div className="min-h-screen bg-slate-950 text-slate-900 font-sans">{children}</div>;
  }

  // Loading state while checking auth
  if (isAuthenticated === null || isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white font-bold text-xs gap-3">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <span>Verifying ApniBus Authentication &amp; Access Rights...</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 antialiased text-slate-900 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-6 overflow-y-auto bg-slate-50">{children}</main>
      </div>
    </div>
  );
}
