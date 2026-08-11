'use client';

import React, { useEffect, useState } from 'react';
import { LeadsTable } from '@/components/leads/LeadsTable';
import { LeadDetailDrawer } from '@/components/leads/LeadDetailDrawer';
import { UserCheck, Shield, Award } from 'lucide-react';

export default function MyLeadsPage() {
  const [userEmail, setUserEmail] = useState('sonu.mishra@apnibus.com');
  const [userName, setUserName] = useState('Sonu Mishra (RH)');
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<any>(null);

  const fetchMyLeads = (email: string) => {
    setLoading(true);
    fetch(`/api/leads?limit=200`)
      .then((res) => res.json())
      .then((data) => {
        const allLeads = data.leads || [];
        // Filter leads assigned to current executive
        const myAssigned = allLeads.filter(
          (l: any) => l.assignedTo && l.assignedTo.email.toLowerCase() === email.toLowerCase()
        );
        setLeads(myAssigned);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    const savedEmail = localStorage.getItem('userEmail') || 'sonu.mishra@apnibus.com';
    const savedName = localStorage.getItem('userName') || 'Sonu Mishra (RH)';
    setUserEmail(savedEmail);
    setUserName(savedName);
    fetchMyLeads(savedEmail);

    const handleStorage = () => {
      const e = localStorage.getItem('userEmail') || 'sonu.mishra@apnibus.com';
      const n = localStorage.getItem('userName') || 'Sonu Mishra (RH)';
      setUserEmail(e);
      setUserName(n);
      fetchMyLeads(e);
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 dark-card p-6 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-black text-white tracking-tight">My Workspace Leads</h1>
            <span className="text-xs font-bold bg-blue-500/20 text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-500/30">
              {userName}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Intercity bus operator leads assigned to <strong className="text-white">{userEmail}</strong>
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs font-bold text-slate-400 block">Assigned Volume</span>
          <span className="text-2xl font-black text-emerald-400 font-heading">{leads.length} Leads</span>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64 text-slate-400 font-bold text-xs">
          Loading assigned workspace leads...
        </div>
      ) : (
        <LeadsTable
          leads={leads}
          totalLeads={leads.length}
          onSelectLead={(lead) => setSelectedLead(lead)}
          onQuickStatusChange={() => fetchMyLeads(userEmail)}
        />
      )}

      {/* Slide-out Drawer */}
      {selectedLead && (
        <LeadDetailDrawer
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdate={() => fetchMyLeads(userEmail)}
        />
      )}
    </div>
  );
}
