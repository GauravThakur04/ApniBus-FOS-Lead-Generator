'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Search,
  Users,
  UserCheck,
  CalendarClock,
  TrendingUp,
  FileSpreadsheet,
  MapPin,
  History,
  Settings,
  Sparkles,
  Menu,
  X,
  PhoneCall,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Lead Generator', href: '/lead-generator', icon: Search, badge: 'API v1' },
  { name: 'All Leads', href: '/leads', icon: Users },
  { name: 'My Leads', href: '/my-leads', icon: UserCheck },
  { name: 'Follow-ups', href: '/followups', icon: CalendarClock },
  { name: 'FOS Performance', href: '/fos-performance', icon: TrendingUp },
  { name: 'Import / Export', href: '/import-export', icon: FileSpreadsheet },
  { name: 'Map View', href: '/map', icon: MapPin },
  { name: 'Search History', href: '/search-history', icon: History },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <>
      {/* DESKTOP SIDEBAR (Visible on md+ screens) */}
      <aside className="hidden md:flex w-64 bg-slate-950 text-white flex-col min-h-screen border-r border-slate-800/80 shrink-0 sticky top-0 h-screen z-40">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center gap-3.5 bg-slate-900/50">
          <div className="w-11 h-11 rounded-2xl bg-white p-1.5 flex items-center justify-center shadow-lg shadow-orange-500/20 border border-slate-200 shrink-0 transition hover:scale-105">
            <img src="/apnibus.png" alt="ApniBus Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="font-heading font-black text-xl leading-none tracking-tight text-white flex items-center gap-0.5">
              <span className="text-white">Apni</span>
              <span className="text-orange-500">Bus</span>
            </h1>
            <p className="text-[11px] text-slate-400 font-semibold tracking-wide mt-1">FOS Lead Hub</p>
          </div>
        </div>

        {/* Target Audience Highlight Badge */}
        <div className="mx-3 my-3 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-orange-400 shrink-0 animate-pulse" />
          <span>Intercity Route Bus POS Sales</span>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-orange-500 text-white shadow-lg shadow-orange-500/20 scale-[1.02]'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full border bg-orange-500/20 text-orange-400 border-orange-500/30">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Info */}
        <div className="p-4 border-t border-slate-800/80 text-xs text-slate-400 text-center bg-slate-900/40">
          <p className="font-heading font-bold text-slate-200">ApniBus Field Sales v1.0</p>
          <p className="mt-0.5 text-[10px] text-slate-500">Tier-3 &amp; Tier-4 Intercity POS</p>
        </div>
      </aside>

      {/* MOBILE SLIDE-OVER DRAWER (For phone screens) */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs" onClick={() => setMobileDrawerOpen(false)} />

          <div className="relative flex-1 w-full max-w-xs bg-slate-950 text-white flex flex-col h-full shadow-2xl z-50">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img src="/apnibus.png" alt="ApniBus Logo" className="w-8 h-8 object-contain bg-white rounded-lg p-1" />
                <span className="font-heading font-black text-lg text-white">ApniBus FOS</span>
              </div>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {navigation.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileDrawerOpen(false)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-orange-500 text-white'
                        : 'text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* 📱 MOBILE BOTTOM NAVIGATION BAR (Fixed at bottom of smartphone screens) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-950 border-t border-slate-800 px-2 flex items-center justify-around z-40 shadow-2xl">
        <Link
          href="/"
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-bold ${
            pathname === '/' ? 'text-orange-400' : 'text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Home</span>
        </Link>

        <Link
          href="/lead-generator"
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-bold ${
            pathname === '/lead-generator' ? 'text-orange-400' : 'text-slate-400'
          }`}
        >
          <Search className="w-5 h-5" />
          <span>Generator</span>
        </Link>

        <Link
          href="/leads"
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-bold ${
            pathname === '/leads' || pathname.startsWith('/portal') ? 'text-orange-400' : 'text-slate-400'
          }`}
        >
          <Users className="w-5 h-5" />
          <span>Leads</span>
        </Link>

        <Link
          href="/followups"
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-bold ${
            pathname === '/followups' ? 'text-orange-400' : 'text-slate-400'
          }`}
        >
          <CalendarClock className="w-5 h-5" />
          <span>Follow-ups</span>
        </Link>

        <button
          onClick={() => setMobileDrawerOpen(true)}
          className="flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-bold text-slate-400"
        >
          <Menu className="w-5 h-5" />
          <span>More</span>
        </button>
      </nav>
    </>
  );
}
