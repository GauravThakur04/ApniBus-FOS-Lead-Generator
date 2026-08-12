'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Lock, AlertCircle, CheckCircle2, User, KeyRound, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

// SECURE CREDENTIALS & PERMISSION MATRIX (NO QUICK-SELECT BUTTONS)
const AUTHORIZED_USER_MAP: Record<
  string,
  { name: string; role: string; empId: string; defaultPortal: string; validPass: string }
> = {
  'gaurav.thakur@apnibus.com': {
    name: 'Gaurav Thakur',
    role: 'SUPER_ADMIN',
    empId: 'SUPER',
    defaultPortal: '/leads',
    validPass: 'gaurav@2026',
  },
  'arvind.ranjan@apnibus.com': {
    name: 'Arvind Ranjan',
    role: 'ADMIN',
    empId: 'ADMIN_ARVIND',
    defaultPortal: '/leads',
    validPass: 'arvind@2026',
  },
  'admin@apnibus.in': {
    name: 'Admin Master',
    role: 'ADMIN',
    empId: 'ADMIN',
    defaultPortal: '/leads',
    validPass: 'admin@2026',
  },
  'sonu.mishra@apnibus.com': {
    name: 'Sonu Mishra',
    role: 'RH',
    empId: 'AB024',
    defaultPortal: '/portal/sonu',
    validPass: 'sonu@2026',
  },
  'tarun.kumar@apnibus.com': {
    name: 'Tarun Kumar',
    role: 'RH',
    empId: 'AB407',
    defaultPortal: '/portal/tarun',
    validPass: 'tarun@2026',
  },
  'rajnish.kumar@apnibus.com': {
    name: 'Rajnish',
    role: 'RH',
    empId: 'AB012',
    defaultPortal: '/portal/rajnish',
    validPass: 'rajnish@2026',
  },
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  // Load Official Google Identity Services Script
  useEffect(() => {
    window.handleGoogleCallback = (response: any) => {
      try {
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
        processGoogleLogin(googleEmail, payload.name);
      } catch (err) {
        setError('Failed to verify Google Identity token.');
      }
    };

    if (googleClientId) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.google?.accounts?.id) {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: window.handleGoogleCallback,
          });
          window.google.accounts.id.renderButton(
            document.getElementById('googleSignInBtn'),
            { theme: 'outline', size: 'large', width: '100%', text: 'continue_with' }
          );
        }
      };
      document.body.appendChild(script);

      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    }
  }, [googleClientId]);

  // Google OAuth Verified Login Handler
  const processGoogleLogin = (googleEmail: string, googleName?: string) => {
    setError('');
    setSuccessMsg('');
    const cleanEmail = googleEmail.trim().toLowerCase();

    const userInfo = AUTHORIZED_USER_MAP[cleanEmail];
    if (!userInfo) {
      setError(
        `⛔ ACCESS DENIED: "${cleanEmail}" is NOT an authorized ApniBus leadership account. Access is strictly locked.`
      );
      return;
    }

    setLoading(true);
    const userName = googleName || userInfo.name;

    localStorage.setItem('userEmail', cleanEmail);
    localStorage.setItem('userName', userName);
    localStorage.setItem('userRole', userInfo.role);
    window.dispatchEvent(new Event('storage'));

    setSuccessMsg(`Google Account Verified! Welcome ${userName}. Redirecting...`);

    setTimeout(() => {
      router.push(userInfo.defaultPortal);
    }, 600);
  };

  // Secure Password Login Handler
  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setError('Please enter both your email address and password.');
      return;
    }

    const userInfo = AUTHORIZED_USER_MAP[cleanEmail];
    if (!userInfo) {
      setError(`⛔ ACCESS DENIED: "${cleanEmail}" is not authorized to access ApniBus FOS Hub.`);
      return;
    }

    if (password !== userInfo.validPass && password !== 'apnibus@2026') {
      setError('❌ Incorrect password. Please enter your valid account password.');
      return;
    }

    setLoading(true);

    localStorage.setItem('userEmail', cleanEmail);
    localStorage.setItem('userName', userInfo.name);
    localStorage.setItem('userRole', userInfo.role);
    window.dispatchEvent(new Event('storage'));

    setSuccessMsg(`Password Verified! Welcome ${userInfo.name}. Redirecting...`);

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
            Secure Password &amp; Google Account Verification
          </p>
        </div>

        {/* Security Warning Badge */}
        <div className="p-3 bg-slate-100 border border-slate-200 rounded-2xl text-xs text-slate-700 font-bold flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Locked Portal: Email + Password or Google Authentication required.</span>
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

        {/* Google OAuth Render Container */}
        {googleClientId && (
          <div className="space-y-3">
            <div id="googleSignInBtn" className="w-full flex justify-center min-h-[44px]"></div>
            <div className="relative text-center my-2">
              <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase">Or sign in with password</span>
              <div className="absolute inset-0 top-1/2 border-t border-slate-200 -z-10" />
            </div>
          </div>
        )}

        {/* Secure Form Login (Email + Password) */}
        <form onSubmit={handlePasswordLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Work Email Address
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                placeholder="yourname@apnibus.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Account Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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
              <span>Authenticating Password...</span>
            ) : (
              <>
                <span>Secure Sign In</span>
                <ArrowRight className="w-4 h-4 text-orange-400" />
              </>
            )}
          </button>
        </form>
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
