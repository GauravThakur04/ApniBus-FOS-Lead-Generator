'use client';

import React, { useState, useEffect } from 'react';
import { Shield, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

// STRICT AUTHORIZED GOOGLE EMAIL MATRIX (GAURAV & ARVIND BOTH SUPER ADMIN)
const AUTHORIZED_USER_MAP: Record<
  string,
  { name: string; role: string; empId: string; defaultPortal: string }
> = {
  'gaurav.thakur@apnibus.com': {
    name: 'Gaurav Thakur',
    role: 'SUPER_ADMIN',
    empId: 'SUPER',
    defaultPortal: '/leads',
  },
  'arvind.ranjan@apnibus.com': {
    name: 'Arvind Ranjan',
    role: 'SUPER_ADMIN',
    empId: 'SUPER_ARVIND',
    defaultPortal: '/leads',
  },
  'admin@apnibus.in': {
    name: 'Admin Master',
    role: 'SUPER_ADMIN',
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
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

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

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts?.id) {
        const targetClientId = googleClientId || '912392915264-apnibus.apps.googleusercontent.com';
        window.google.accounts.id.initialize({
          client_id: targetClientId,
          callback: window.handleGoogleCallback,
        });
        window.google.accounts.id.renderButton(
          document.getElementById('googleSignInBtn'),
          { theme: 'outline', size: 'large', width: 320, text: 'continue_with' }
        );
      }
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [googleClientId]);

  const processGoogleLogin = (googleEmail: string, googleName?: string) => {
    setError('');
    setSuccessMsg('');
    const cleanEmail = googleEmail.trim().toLowerCase();

    const userInfo = AUTHORIZED_USER_MAP[cleanEmail];
    if (!userInfo) {
      setError(
        `⛔ ACCESS DENIED: "${cleanEmail}" is NOT authorized. Access is strictly locked to approved ApniBus sales leaders.`
      );
      return;
    }

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

  const triggerGooglePrompt = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      setError('Google Sign-In is initializing... Please click again in 2 seconds.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl p-8 border border-slate-200 shadow-2xl space-y-6 text-center">
        <div className="space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 p-2 mx-auto flex items-center justify-center shadow-md">
            <img src="/apnibus.png" alt="ApniBus Logo" className="w-full h-full object-contain" />
          </div>

          <h1 className="font-heading font-black text-2xl text-slate-900 tracking-tight flex items-center justify-center gap-1">
            <span>Apni</span>
            <span className="text-orange-500">Bus</span>
            <span className="text-slate-400 font-normal text-lg ml-1">FOS Hub</span>
          </h1>

          <p className="text-xs text-slate-500 font-medium">
            Sign in with your official ApniBus Google Account
          </p>
        </div>

        <div className="p-3 bg-slate-100 border border-slate-200 rounded-2xl text-xs text-slate-700 font-bold flex items-center justify-center gap-2">
          <Shield className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Restricted to Authorized ApniBus Accounts</span>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-black flex items-start gap-2.5 shadow-sm text-left">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="py-2 flex flex-col items-center justify-center space-y-4">
          <div id="googleSignInBtn" className="flex justify-center min-h-[44px]"></div>

          <button
            type="button"
            onClick={triggerGooglePrompt}
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
