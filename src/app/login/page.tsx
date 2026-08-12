'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Lock, AlertCircle, CheckCircle2, User, ArrowRight, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

const ALLOWED_EMAILS = [
  'admin@apnibus.in',
  'sonu.mishra@apnibus.com',
  'tarun.kumar@apnibus.com',
  'rajnish.kumar@apnibus.com',
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your ApniBus email address.');
      return;
    }

    setLoading(true);

    // Validate email against authorized whitelist
    const isAllowed = ALLOWED_EMAILS.includes(cleanEmail) || cleanEmail.endsWith('@apnibus.com');

    if (!isAllowed) {
      setError(`Access Denied: "${cleanEmail}" is not authorized. Access is strictly limited to designated ApniBus sales leaders.`);
      setLoading(false);
      return;
    }

    // Auto-map user credentials & portal
    let name = 'Sales Executive';
    let role = 'RH';
    let targetPortal = '/leads';

    if (cleanEmail === 'admin@apnibus.in') {
      name = 'Admin User';
      role = 'ADMIN';
      targetPortal = '/leads';
    } else if (cleanEmail === 'sonu.mishra@apnibus.com') {
      name = 'Sonu Mishra (AB024)';
      role = 'RH';
      targetPortal = '/portal/sonu';
    } else if (cleanEmail === 'tarun.kumar@apnibus.com') {
      name = 'Tarun Kumar (AB407)';
      role = 'RH';
      targetPortal = '/portal/tarun';
    } else if (cleanEmail === 'rajnish.kumar@apnibus.com') {
      name = 'Rajnish (AB012)';
      role = 'RH';
      targetPortal = '/portal/rajnish';
    }

    // Persist active session in localStorage
    localStorage.setItem('userEmail', cleanEmail);
    localStorage.setItem('userName', name);
    localStorage.setItem('userRole', role);
    window.dispatchEvent(new Event('storage'));

    setSuccessMsg(`Welcome, ${name}! Redirecting to your private portal...`);

    setTimeout(() => {
      router.push(targetPortal);
    }, 1000);
  };

  const handleQuickSelect = (selEmail: string) => {
    setEmail(selEmail);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-slate-200 shadow-2xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 p-2 mx-auto flex items-center justify-center shadow-md">
            <img src="/apnibus.png" alt="ApniBus Logo" className="w-full h-full object-contain" />
          </div>

          <h1 className="font-heading font-black text-2xl text-slate-900 tracking-tight flex items-center justify-center gap-1">
            <span>Apni</span>
            <span className="text-orange-500">Bus</span>
            <span className="text-slate-400 font-normal text-lg ml-1">FOS Hub</span>
          </h1>

          <p className="text-xs text-slate-500 font-medium">
            Authorized Sales Leader Access &amp; POS Lead Portal
          </p>
        </div>

        {/* Security Warning Badge */}
        <div className="p-3 bg-slate-100 border border-slate-200 rounded-2xl text-xs text-slate-700 font-bold flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Restricted Access: Limited strictly to authorized <strong>@apnibus.com</strong> accounts.</span>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Sign In with Google / ApniBus Email
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                placeholder="yourname@apnibus.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white font-black rounded-xl text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to ApniBus Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Authorized Sales Leaders Whitelist Selection */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-wide">
            Whitelisted Sales Leaders (Click to Select):
          </p>

          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => handleQuickSelect('admin@apnibus.in')}
              className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left flex items-center justify-between text-xs transition"
            >
              <div>
                <span className="font-bold text-slate-900 block">👑 Admin Master</span>
                <span className="text-[10px] text-slate-500">admin@apnibus.in</span>
              </div>
              <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">ADMIN</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickSelect('sonu.mishra@apnibus.com')}
              className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-orange-500 hover:bg-orange-50/50 text-left flex items-center justify-between text-xs transition"
            >
              <div>
                <span className="font-bold text-slate-900 block">👤 Sonu Mishra</span>
                <span className="text-[10px] text-slate-500">sonu.mishra@apnibus.com</span>
              </div>
              <span className="text-[10px] bg-orange-100 text-orange-800 font-bold px-2 py-0.5 rounded">AB024</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickSelect('tarun.kumar@apnibus.com')}
              className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left flex items-center justify-between text-xs transition"
            >
              <div>
                <span className="font-bold text-slate-900 block">👤 Tarun Kumar</span>
                <span className="text-[10px] text-slate-500">tarun.kumar@apnibus.com</span>
              </div>
              <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">AB407</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickSelect('rajnish.kumar@apnibus.com')}
              className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-purple-500 hover:bg-purple-50/50 text-left flex items-center justify-between text-xs transition"
            >
              <div>
                <span className="font-bold text-slate-900 block">👤 Rajnish</span>
                <span className="text-[10px] text-slate-500">rajnish.kumar@apnibus.com</span>
              </div>
              <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded">AB012</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
