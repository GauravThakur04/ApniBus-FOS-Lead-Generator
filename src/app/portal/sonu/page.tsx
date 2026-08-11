'use client';

import React, { useEffect, useState } from 'react';
import { LeadsTable } from '@/components/leads/LeadsTable';
import { LeadDetailDrawer } from '@/components/leads/LeadDetailDrawer';
import { UserCheck, Shield } from 'lucide-react';

export default function SonuPortalPage() {
  const userEmail = 'sonu.mishra@apnibus.com';
  const userName = 'Sonu Mishra (AB024)';
  const userRole = 'RH';

  const [leads, setLeads] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<any>(null);

  const fetchLeads = () => {
    setLoading(true);
    fetch(`/api/leads?email=${encodeURIComponent(userEmail)}&role=${encodeURIComponent(userRole)}&limit=500`)
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
    // Set localStorage active view to Sonu
    localStorage.setItem('userEmail', userEmail);
    localStorage.setItem('userRole', userRole);
    localStorage.setItem('userName', userName);
    window.dispatchEvent(new Event('storage'));
    fetchLeads();
  }, []);

  return (
    <div className="space-y-6">
      {/* Title & Profile Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-orange-50 border border-orange-200 p-6 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-black text-slate-900 tracking-tight">
              Sonu Mishra's Private Lead Portal
            </h1>
            <span className="text-xs font-black bg-orange-600 text-white px-3 py-1 rounded-full shadow-2xs">
              EMP ID: AB024 • RH
            </span>
          </div>

          <p className="text-xs text-orange-950 mt-1 font-semibold">
            Strictly isolated workspace: Showing {total} leads assigned exclusively to Sonu Mishra ({userEmail})
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs font-bold text-orange-800 block">Total Assigned Leads</span>
          <span className="text-2xl font-black text-orange-900 font-heading">{total} Leads</span>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64 text-slate-500 font-bold text-xs">
          Loading Sonu Mishra's assigned leads...
        </div>
      ) : (
        <LeadsTable
          leads={leads}
          totalLeads={total}
          onSelectLead={(lead) => setSelectedLead(lead)}
          onQuickStatusChange={() => fetchLeads()}
        />
      )}

      {/* Slide-out Drawer */}
      {selectedLead && (
        <LeadDetailDrawer
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdate={() => fetchLeads()}
        />
      )}
    </div>
  );
}
