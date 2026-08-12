'use client';

import React, { useState } from 'react';
import { Shield, Lock, AlertCircle, CheckCircle2, User, ArrowRight, Crown } from 'lucide-react';
import { useRouter } from 'next/navigation';

// STRICT PERMISSION MATRIX (ONLY THESE 5 EMAILS ALLOWED)
const AUTHORIZED_USER_MAP: Record<string, { name: string; role: string; empId: string; defaultPortal: string }> = {
  'gaurav.thakur@apnibus.com': {
    name: 'Gaurav Thakur',
    role: 'SUPER_ADMIN',
    empId: 'SUPER',
    defaultPortal: '/leads',
  },
  'arvind.ranjan@apnibus.com': {
    name: 'Arvind Ranjan',
    role: 'ADMIN',
    empId: 'ADMIN_ARVIND',
    defaultPortal: '/leads',
  },
  'admin@apnibus.in': {
    name: 'Admin Master',
    role: 'ADMIN',
    empId: 'ADMIN',
    defaultPortal: '/leads',
  },
  'sonu.mishra@apnibus.com': {
    name: 'Sonu Mishra',
    role: 'RH',
    empId: 'AB024',
    defaultPortal: '/portal/sonu',
  },
  'tarun.kumar@apnibus.com': {
    name: 'Tarun Kumar',
    role: 'RH',
    empId: 'AB407',
    defaultPortal: '/portal/tarun',
  },
  'rajnish.kumar@apnibus.com': {
    name: 'Rajnish',
    role: 'RH',
    empId: 'AB012',
    defaultPortal: '/portal/rajnish',
  },
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const authenticateEmail = (inputEmail: string) => {
    setError('');
    setSuccessMsg('');
    const cleanEmail = inputEmail.trim().toLowerCase();

    if (!cleanEmail) {
      setError('Please enter your official ApniBus email address.');
      return;
    }

    // STRICT CHECK: MUST BE EXACT MATCH IN AUTHORIZED_USER_MAP
    const userInfo = AUTHORIZED_USER_MAP[cleanEmail];

    if (!userInfo) {
      setError(
        `⛔ ACCESS DENIED: "${cleanEmail}" is NOT authorized. Access is strictly locked to approved ApniBus leadership team.`
      );
      setLoading(false);
      return;
    }

    setLoading(true);

    // Save session in localStorage
    localStorage.setItem('userEmail', cleanEmail);
    localStorage.setItem('userName', userInfo.name);
    localStorage.setItem('userRole', userInfo.role);
    window.dispatchEvent(new Event('storage'));

    setSuccessMsg(`Access Granted! Welcome ${userInfo.name}. Redirecting to portal...`);

    setTimeout(() => {
      router.push(userInfo.defaultPortal);
    }, 600);
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
            Strict Multi-Tier Sales Access &amp; POS Lead Portal
          </p>
        </div>

        {/* Security Warning Badge */}
        <div className="p-3 bg-slate-100 border border-slate-200 rounded-2xl text-xs text-slate-700 font-bold flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Strict Security: Access is locked exclusively to 5 designated ApniBus leaders.</span>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-black flex items-start gap-2.5 shadow-sm">
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

        {/* Form Login */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            authenticateEmail(email);
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Enter ApniBus Work Email
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
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Verifying Permissions...</span>
            ) : (
              <>
                <span>Sign In to ApniBus Portal</span>
                <ArrowRight className="w-4 h-4 text-orange-400" />
              </>
            )}
          </button>
        </form>

        {/* 1-Tap Authorized User Selectors */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-wide">
            Select Your Account to Sign In:
          </p>

          <div className="space-y-1.5">
            {/* Gaurav Thakur - Super Admin */}
            <button
              type="button"
              onClick={() => authenticateEmail('gaurav.thakur@apnibus.com')}
              className="w-full p-2.5 rounded-xl border border-amber-300 bg-amber-50/60 hover:bg-amber-100/70 text-left flex items-center justify-between text-xs transition"
            >
              <div>
                <span className="font-extrabold text-amber-900 block flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5 text-amber-600" />
                  <span>Gaurav Thakur (Super Admin)</span>
                </span>
                <span className="text-[10px] text-amber-700">gaurav.thakur@apnibus.com • Full Access All Portals</span>
              </div>
              <span className="text-[10px] bg-amber-200 text-amber-900 font-black px-2 py-0.5 rounded">SUPER</span>
            </button>

            {/* Arvind Ranjan - Admin */}
            <button
              type="button"
              onClick={() => authenticateEmail('arvind.ranjan@apnibus.com')}
              className="w-full p-2.5 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/60 text-left flex items-center justify-between text-xs transition"
            >
              <div>
                <span className="font-bold text-slate-900 block">👑 Arvind Ranjan (Admin)</span>
                <span className="text-[10px] text-slate-500">arvind.ranjan@apnibus.com • Admin Portal</span>
              </div>
              <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">ADMIN</span>
            </button>

            {/* Sonu Mishra */}
            <button
              type="button"
              onClick={() => authenticateEmail('sonu.mishra@apnibus.com')}
              className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-orange-500 hover:bg-orange-50/50 text-left flex items-center justify-between text-xs transition"
            >
              <div>
                <span className="font-bold text-slate-900 block">👤 Sonu Mishra (AB024)</span>
                <span className="text-[10px] text-slate-500">sonu.mishra@apnibus.com • Sonu's Portal Only</span>
              </div>
              <span className="text-[10px] bg-orange-100 text-orange-800 font-bold px-2 py-0.5 rounded">AB024</span>
            </button>

            {/* Tarun Kumar */}
            <button
              type="button"
              onClick={() => authenticateEmail('tarun.kumar@apnibus.com')}
              className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left flex items-center justify-between text-xs transition"
            >
              <div>
                <span className="font-bold text-slate-900 block">👤 Tarun Kumar (AB407)</span>
                <span className="text-[10px] text-slate-500">tarun.kumar@apnibus.com • Tarun's Portal Only</span>
              </div>
              <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">AB407</span>
            </button>

            {/* Rajnish */}
            <button
              type="button"
              onClick={() => authenticateEmail('rajnish.kumar@apnibus.com')}
              className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-purple-500 hover:bg-purple-50/50 text-left flex items-center justify-between text-xs transition"
            >
              <div>
                <span className="font-bold text-slate-900 block">👤 Rajnish (AB012)</span>
                <span className="text-[10px] text-slate-500">rajnish.kumar@apnibus.com • Rajnish's Portal Only</span>
              </div>
              <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded">AB012</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
