'use client';

import React, { useState, useEffect } from 'react';
import { CalendarClock, CheckCircle2, Phone, Clock } from 'lucide-react';
import { LeadDetailDrawer } from '@/components/leads/LeadDetailDrawer';

export default function FollowupsPage() {
  const [followups, setFollowups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<any>(null);

  const fetchFollowups = () => {
    fetch('/api/followups')
      .then((res) => res.json())
      .then((data) => {
        setFollowups(data.followups || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchFollowups();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 font-bold text-xs">
        Loading POS Demo Follow-ups Schedule...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="font-heading text-2xl font-black text-slate-900 tracking-tight">Scheduled POS Demo &amp; Call Follow-ups</h1>
          <p className="text-xs text-slate-600 mt-0.5 font-medium">
            Manage upcoming POS ticketing machine demos, follow-up calls &amp; operator appointments
          </p>
        </div>
        <span className="text-xs font-bold bg-purple-50 text-purple-700 px-3 py-1 rounded-full border border-purple-200">
          {followups.length} Scheduled Appointments
        </span>
      </div>

      {followups.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3 shadow-xs">
          <CalendarClock className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="font-extrabold text-slate-900 text-base">No Upcoming Follow-ups Scheduled</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Schedule machine demos and follow-up calls from any operator&apos;s lead detail drawer.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {followups.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedLead(item.lead)}
              className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-blue-400 cursor-pointer shadow-xs transition space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm font-heading">{item.lead?.businessName}</h3>
                  <p className="text-xs text-slate-600 font-semibold mt-0.5">
                    {item.lead?.city}, {item.lead?.state}
                  </p>
                </div>
                <span className="text-[10px] font-black bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200">
                  {item.lead?.status || 'Followup'}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <p className="text-slate-500 font-bold flex items-center gap-1.5 text-[11px]">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    {new Date(item.followUpDate).toLocaleDateString()} at {item.time || '10:00 AM'}
                  </span>
                </p>
                <p className="text-slate-800 font-medium">Reason: {item.reason || 'POS Machine Demo'}</p>
              </div>

              <div className="text-xs text-slate-600 flex justify-between items-center pt-1">
                <span>FOS: <strong className="text-orange-600">{item.user?.name || 'Unassigned'}</strong></span>
                <span className="text-blue-600 font-bold hover:underline text-[11px]">View Profile →</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedLead && (
        <LeadDetailDrawer
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdate={() => fetchFollowups()}
        />
      )}
    </div>
  );
}
