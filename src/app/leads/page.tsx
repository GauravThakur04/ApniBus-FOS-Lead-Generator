'use client';

import React, { useEffect, useState } from 'react';
import { LeadsTable } from '@/components/leads/LeadsTable';
import { LeadDetailDrawer } from '@/components/leads/LeadDetailDrawer';
import { Plus, Download, Shield, User } from 'lucide-react';
import Link from 'next/link';

export default function LeadsPage() {
  const [userEmail, setUserEmail] = useState('admin@apnibus.in');
  const [userRole, setUserRole] = useState('ADMIN');
  const [userName, setUserName] = useState('Admin User');

  const [leads, setLeads] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<any>(null);

  const fetchLeads = (email: string, role: string) => {
    setLoading(true);
    fetch(`/api/leads?email=${encodeURIComponent(email)}&role=${encodeURIComponent(role)}&limit=500`)
      .then((res) => res.json())
      .then((data) => {
        setLeads(data.leads || []);
        setTotal(data.pagination?.total || 0);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    const savedEmail = localStorage.getItem('userEmail') || 'admin@apnibus.in';
    const savedRole = localStorage.getItem('userRole') || 'ADMIN';
    const savedName = localStorage.getItem('userName') || 'Admin User';

    setUserEmail(savedEmail);
    setUserRole(savedRole);
    setUserName(savedName);

    fetchLeads(savedEmail, savedRole);

    const handleStorage = () => {
      const e = localStorage.getItem('userEmail') || 'admin@apnibus.in';
      const r = localStorage.getItem('userRole') || 'ADMIN';
      const n = localStorage.getItem('userName') || 'Admin User';

      setUserEmail(e);
      setUserRole(r);
      setUserName(n);
      fetchLeads(e, r);
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const isAdmin = userRole === 'ADMIN' || userEmail === 'admin@apnibus.in';

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-black text-slate-900 tracking-tight">
              {isAdmin ? 'Master Intercity Lead Portal' : `${userName}'s Private Lead Portal`}
            </h1>
            <span
              className={`text-xs font-black px-3 py-1 rounded-full border ${
                isAdmin
                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                  : 'bg-orange-50 text-orange-800 border-orange-200'
              }`}
            >
              {isAdmin ? '👑 ADMIN MASTER VIEW' : `👤 ${userRole} WORKSPACE`}
            </span>
          </div>

          <p className="text-xs text-slate-500 mt-1 font-medium">
            {isAdmin
              ? `Master database view: ${total} Bus Operators across all territories (Generate & Assign Leads)`
              : `Strictly isolated workspace: Showing ${total} leads assigned to ${userName} (${userEmail})`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <>
              <Link
                href="/import-export"
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Export / Import CSV</span>
              </Link>
              <Link
                href="/lead-generator"
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white text-xs font-black rounded-xl transition shadow-xs flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Find New Leads</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64 text-slate-500 font-bold text-xs">
          Loading portal workspace leads...
        </div>
      ) : (
        <LeadsTable
          leads={leads}
          totalLeads={total}
          onSelectLead={(lead) => setSelectedLead(lead)}
          onQuickStatusChange={() => fetchLeads(userEmail, userRole)}
        />
      )}

      {/* Slide-out Drawer */}
      {selectedLead && (
        <LeadDetailDrawer
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdate={() => fetchLeads(userEmail, userRole)}
        />
      )}
    </div>
  );
}
