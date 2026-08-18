'use client';

import React, { useEffect, useState } from 'react';
import { LeadsTable } from '@/components/leads/LeadsTable';
import { LeadDetailDrawer } from '@/components/leads/LeadDetailDrawer';
import { UserCheck, Shield, Users, MapPin, PhoneCall, Mail, Award } from 'lucide-react';

export default function RajnishPortalPage() {
  const userEmail = 'rajnish.kumar@apnibus.com';
  const userName = 'Rajnish (AB012)';
  const userRole = 'RH';

  const [leads, setLeads] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<any>(null);

  // Rajnish's Team Members (ISAs)
  const teamMembers = [
    {
      id: 'utpal-mandal',
      name: 'Utpal Mandal',
      phone: '9563080570',
      email: 'utpalmandalfkk1234@gmail.com',
      role: 'ISA',
      designation: 'Inside Sales Associate (ISA)',
      location: 'Sahibganj, Jharkhand',
      empId: 'ISA01',
    },
    {
      id: 'deepak-saini',
      name: 'Deepak Saini',
      phone: '7427056756',
      email: 'dks322001@gmail.com',
      role: 'ISA',
      designation: 'Inside Sales Associate (ISA)',
      location: 'Sawai Madhopur, Rajasthan',
      empId: 'ISA02',
    },
  ];

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

      {/* RAJNISH TEAM MEMBERS CARDS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            <h2 className="font-heading font-black text-slate-900 text-base">
              Rajnish's Active Sales Team Members ({teamMembers.length} ISAs)
            </h2>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            Reporting to: Rajnish (AB012)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teamMembers.map((member) => (
            <div
              key={member.id}
              className="bg-purple-50/50 border border-purple-200 hover:border-purple-300 rounded-2xl p-5 shadow-xs transition space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-black text-slate-900 text-base">{member.name}</h3>
                    <span className="font-mono text-[10px] font-black bg-purple-600 text-white px-2 py-0.5 rounded-full shadow-2xs">
                      {member.empId}
                    </span>
                    <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full">
                      {member.role}
                    </span>
                  </div>
                  <p className="text-xs text-purple-950 font-medium">{member.designation}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold pt-1 border-t border-purple-100 text-slate-700">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span className="truncate">📍 {member.location}</span>
                </div>

                <div className="flex items-center gap-1.5 font-mono text-emerald-700">
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <a href={`tel:${member.phone}`} className="hover:underline">
                    {member.phone}
                  </a>
                </div>

                <div className="flex items-center gap-1.5 text-slate-600 col-span-1 sm:col-span-2 truncate">
                  <Mail className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <a href={`mailto:${member.email}`} className="hover:underline truncate">
                    {member.email}
                  </a>
                </div>
              </div>
            </div>
          ))}
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
