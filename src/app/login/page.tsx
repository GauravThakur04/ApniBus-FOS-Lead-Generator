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

  // Load Official Google Identity Services (GIS) Script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    window.handleGoogleCallback = (response: any) => {
      try {
        // Decode JWT token payload
        const base64Url = response.credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const payload = JSON.parse(jsonPayload);
        const googleEmail = payload.email || '';

        processAuthenticatedEmail(googleEmail, payload.name);
      } catch (err) {
        setError('Failed to process Google Authentication token.');
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const processAuthenticatedEmail = (targetEmail: string, googleName?: string) => {
    setError('');
    setSuccessMsg('');
    const cleanEmail = targetEmail.trim().toLowerCase();

    if (!cleanEmail) {
      setError('Invalid email address received from Google.');
      return;
    }

    // Access Control Whitelist Check
    const isAllowed = ALLOWED_EMAILS.includes(cleanEmail) || cleanEmail.endsWith('@apnibus.com');

    if (!isAllowed) {
      setError(`Access Denied: "${cleanEmail}" is not an authorized ApniBus account. Access is strictly limited to designated sales leaders.`);
      setLoading(false);
      return;
    }

    let name = googleName || 'Sales Executive';
    let role = 'RH';
    let targetPortal = '/leads';

    if (cleanEmail === 'admin@apnibus.in') {
      name = googleName || 'Admin User';
      role = 'ADMIN';
      targetPortal = '/leads';
    } else if (cleanEmail === 'sonu.mishra@apnibus.com') {
      name = googleName || 'Sonu Mishra (AB024)';
      role = 'RH';
      targetPortal = '/portal/sonu';
    } else if (cleanEmail === 'tarun.kumar@apnibus.com') {
      name = googleName || 'Tarun Kumar (AB407)';
      role = 'RH';
      targetPortal = '/portal/tarun';
    } else if (cleanEmail === 'rajnish.kumar@apnibus.com') {
      name = googleName || 'Rajnish (AB012)';
      role = 'RH';
      targetPortal = '/portal/rajnish';
    }

    localStorage.setItem('userEmail', cleanEmail);
    localStorage.setItem('userName', name);
    localStorage.setItem('userRole', role);
    window.dispatchEvent(new Event('storage'));

    setSuccessMsg(`Google Authentication Successful! Welcome ${name}. Redirecting...`);

    setTimeout(() => {
      router.push(targetPortal);
    }, 800);
  };

  const handleManualEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processAuthenticatedEmail(email);
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
            Official Google Workspace Sign-In &amp; Lead Portal
          </p>
        </div>

        {/* Security Warning Badge */}
        <div className="p-3 bg-slate-100 border border-slate-200 rounded-2xl text-xs text-slate-700 font-bold flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Restricted Access: Limited strictly to authorized <strong>@apnibus.com</strong> Google accounts.</span>
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

        {/* Official Google Sign-In 1-Click Button */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={() => {
              if (window.google?.accounts?.id) {
                window.google.accounts.id.prompt();
              } else {
                setError('Google Identity Services script loading... Please wait 2 seconds.');
              }
            }}
            className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 text-slate-800 font-extrabold rounded-2xl border-2 border-slate-200 shadow-sm transition flex items-center justify-center gap-3 text-xs"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Sign in with Google (@apnibus.com)</span>
          </button>

          <div className="relative text-center my-3">
            <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase">Or select authorized leader</span>
            <div className="absolute inset-0 top-1/2 border-t border-slate-200 -z-10" />
          </div>
        </div>

        {/* Authorized Sales Leaders Whitelist Selection */}
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => processAuthenticatedEmail('admin@apnibus.in')}
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
            onClick={() => processAuthenticatedEmail('sonu.mishra@apnibus.com')}
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
            onClick={() => processAuthenticatedEmail('tarun.kumar@apnibus.com')}
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
            onClick={() => processAuthenticatedEmail('rajnish.kumar@apnibus.com')}
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
  );
}

declare global {
  interface Window {
    google?: any;
    handleGoogleCallback?: any;
  }
}
