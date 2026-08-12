'use client';

import React, { useEffect, useState } from 'react';
import { LeadsTable } from '@/components/leads/LeadsTable';
import { LeadDetailDrawer } from '@/components/leads/LeadDetailDrawer';
import { Plus, Download, Shield, User, Crown } from 'lucide-react';
import Link from 'next/link';

export default function LeadsPage() {
  const [userEmail, setUserEmail] = useState('gaurav.thakur@apnibus.com');
  const [userRole, setUserRole] = useState('SUPER_ADMIN');
  const [userName, setUserName] = useState('Gaurav Thakur');

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
    const savedEmail = localStorage.getItem('userEmail') || 'gaurav.thakur@apnibus.com';
    const savedRole = localStorage.getItem('userRole') || 'SUPER_ADMIN';
    const savedName = localStorage.getItem('userName') || 'Gaurav Thakur';

    setUserEmail(savedEmail);
    setUserRole(savedRole);
    setUserName(savedName);

    fetchLeads(savedEmail, savedRole);

    const handleStorage = () => {
      const e = localStorage.getItem('userEmail') || 'gaurav.thakur@apnibus.com';
      const r = localStorage.getItem('userRole') || 'SUPER_ADMIN';
      const n = localStorage.getItem('userName') || 'Gaurav Thakur';

      setUserEmail(e);
      setUserRole(r);
      setUserName(n);
      fetchLeads(e, r);
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const isAdmin =
    userRole === 'ADMIN' ||
    userRole === 'SUPER_ADMIN' ||
    userEmail === 'gaurav.thakur@apnibus.com' ||
    userEmail === 'arvind.ranjan@apnibus.com' ||
    userEmail === 'admin@apnibus.in';

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-black text-slate-900 tracking-tight">
              {isAdmin ? 'Master Sales Lead Directory' : 'Workspace Leads'}
            </h1>
            <span className="text-xs font-black bg-amber-50 text-amber-900 px-3 py-1 rounded-full border border-amber-200 flex items-center gap-1">
              <Crown className="w-3 h-3 text-amber-600" />
              <span>{userName} ({isAdmin ? 'SUPER ADMIN VIEW' : 'MANAGER VIEW'})</span>
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            {isAdmin
              ? 'Showing ALL generated intercity bus operator leads in database. Assign leads to Sonu, Tarun, or Rajnish below.'
              : `Intercity bus operator leads assigned to ${userName}`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/lead-generator"
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Generate New Leads</span>
          </Link>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64 text-slate-500 font-bold text-xs">
          Loading master bus operator leads...
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
