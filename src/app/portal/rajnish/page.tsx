'use client';

import React, { useEffect, useState } from 'react';
import { LeadsTable } from '@/components/leads/LeadsTable';
import { LeadDetailDrawer } from '@/components/leads/LeadDetailDrawer';
import { UserCheck, Shield } from 'lucide-react';

export default function RajnishPortalPage() {
  const userEmail = 'rajnish.kumar@apnibus.com';
  const userName = 'Rajnish (AB012)';
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
    // Set localStorage active view to Rajnish
    localStorage.setItem('userEmail', userEmail);
    localStorage.setItem('userRole', userRole);
    localStorage.setItem('userName', userName);
    window.dispatchEvent(new Event('storage'));
    fetchLeads();
  }, []);

  return (
    <div className="space-y-6">
      {/* Title & Profile Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-purple-50 border border-purple-200 p-6 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-black text-slate-900 tracking-tight">
              Rajnish's Private Lead Portal
            </h1>
            <span className="text-xs font-black bg-purple-600 text-white px-3 py-1 rounded-full shadow-2xs">
              EMP ID: AB012 • RH
            </span>
          </div>

          <p className="text-xs text-purple-950 mt-1 font-semibold">
            Strictly isolated workspace: Showing {total} leads assigned exclusively to Rajnish ({userEmail})
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs font-bold text-purple-800 block">Total Assigned Leads</span>
          <span className="text-2xl font-black text-purple-900 font-heading">{total} Leads</span>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64 text-slate-500 font-bold text-xs">
          Loading Rajnish's assigned leads...
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
