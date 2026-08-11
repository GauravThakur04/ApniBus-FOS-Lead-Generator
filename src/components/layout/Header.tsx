'use client';

import React, { useState, useEffect } from 'react';
import { User, LogOut, Shield, ChevronDown, CheckCircle2, AlertCircle, Crown, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export function Header() {
  const [currentUser, setCurrentUser] = useState({
    name: 'Admin User',
    email: 'admin@apnibus.in',
    role: 'ADMIN',
  });
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const savedRole = localStorage.getItem('userRole');
    const savedName = localStorage.getItem('userName');
    const savedEmail = localStorage.getItem('userEmail');
    if (savedRole && savedName && savedEmail) {
      setCurrentUser({ role: savedRole, name: savedName, email: savedEmail });
    }

    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        setApiConnected(data.apiConnected);
      })
      .catch(() => setApiConnected(false));
  }, []);

  const switchRole = (role: string, name: string, email: string) => {
    setCurrentUser({ role, name, email });
    localStorage.setItem('userRole', role);
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userName', name);
    setShowRoleMenu(false);
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Brand Logo Thumbnail */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shadow-xs">
            <img src="/apnibus.png" alt="ApniBus Logo" className="w-full h-full object-contain" />
          </div>
          <h2 className="font-heading text-lg font-extrabold text-slate-900 tracking-tight">
            Intercity POS Lead Hub
          </h2>
        </div>

        {/* Google Places API Connectivity Status Badge */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
            apiConnected === true
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : apiConnected === false
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'bg-slate-100 text-slate-600'
          }`}
          title="Server-side Google Places API Status"
        >
          {apiConnected === true ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Google API Connected</span>
            </>
          ) : apiConnected === false ? (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>API Key Missing (CSV / Manual Mode)</span>
            </>
          ) : (
            <span>Checking API...</span>
          )}
        </div>
      </div>

      {/* Right Side: Role Selector & Direct Portal Links */}
      <div className="flex items-center gap-4">
        {/* Role Quick Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
          >
            <Shield className="w-3.5 h-3.5 text-blue-600" />
            <span>Active Portal: {currentUser.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 text-xs max-h-96 overflow-y-auto">
              <div className="px-3 py-1.5 font-bold text-slate-400 border-b border-slate-100 uppercase text-[10px]">
                Direct Portal Links (Click to Open)
              </div>

              {/* Admin Master Portal Link */}
              <Link
                href="/leads"
                onClick={() => switchRole('ADMIN', 'Admin User', 'admin@apnibus.in')}
                className={`w-full text-left px-3.5 py-2.5 hover:bg-blue-50 flex items-center justify-between transition ${
                  currentUser.email === 'admin@apnibus.in' ? 'font-black text-blue-700 bg-blue-50/70' : 'text-slate-700'
                }`}
              >
                <div>
                  <span className="block font-bold">👑 Admin Master Portal</span>
                  <span className="text-[10px] text-slate-400">Generate &amp; Assign All Leads</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
              </Link>

              <div className="px-3 py-1 font-bold text-orange-600 bg-orange-50/70 text-[10px] uppercase border-y border-slate-100 flex items-center gap-1">
                <Crown className="w-3 h-3 text-orange-500" />
                <span>Dedicated Leader Portals</span>
              </div>

              {/* Sonu Mishra Direct Link */}
              <Link
                href="/portal/sonu"
                onClick={() => switchRole('RH', 'Sonu Mishra (AB024)', 'sonu.mishra@apnibus.com')}
                className={`w-full text-left px-3.5 py-2.5 hover:bg-orange-50 flex items-center justify-between transition ${
                  currentUser.email === 'sonu.mishra@apnibus.com' ? 'font-black text-orange-700 bg-orange-50' : 'text-slate-700'
                }`}
              >
                <div>
                  <span className="block font-bold">👤 Sonu Mishra Portal</span>
                  <span className="text-[10px] text-slate-400">/portal/sonu (EMP: AB024)</span>
                </div>
                <span className="text-[10px] bg-orange-100 text-orange-800 px-2 py-0.5 rounded font-black">AB024</span>
              </Link>

              {/* Tarun Kumar Direct Link */}
              <Link
                href="/portal/tarun"
                onClick={() => switchRole('RH', 'Tarun Kumar (AB407)', 'tarun.kumar@apnibus.com')}
                className={`w-full text-left px-3.5 py-2.5 hover:bg-blue-50 flex items-center justify-between transition ${
                  currentUser.email === 'tarun.kumar@apnibus.com' ? 'font-black text-blue-700 bg-blue-50' : 'text-slate-700'
                }`}
              >
                <div>
                  <span className="block font-bold">👤 Tarun Kumar Portal</span>
                  <span className="text-[10px] text-slate-400">/portal/tarun (EMP: AB407)</span>
                </div>
                <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-black">AB407</span>
              </Link>

              {/* Rajnish Direct Link */}
              <Link
                href="/portal/rajnish"
                onClick={() => switchRole('RH', 'Rajnish (AB012)', 'rajnish.kumar@apnibus.com')}
                className={`w-full text-left px-3.5 py-2.5 hover:bg-purple-50 flex items-center justify-between transition ${
                  currentUser.email === 'rajnish.kumar@apnibus.com' ? 'font-black text-purple-700 bg-purple-50' : 'text-slate-700'
                }`}
              >
                <div>
                  <span className="block font-bold">👤 Rajnish Portal</span>
                  <span className="text-[10px] text-slate-400">/portal/rajnish (EMP: AB012)</span>
                </div>
                <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-black">AB012</span>
              </Link>
            </div>
          )}
        </div>

        {/* User Avatar */}
        <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
          <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow">
            {currentUser.name.charAt(0)}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-bold text-slate-800 leading-tight">{currentUser.name}</p>
            <p className="text-[11px] text-slate-500">{currentUser.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
