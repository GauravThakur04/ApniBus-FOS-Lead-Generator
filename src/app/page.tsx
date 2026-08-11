'use client';

import React, { useEffect, useState } from 'react';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { SalesFunnel } from '@/components/dashboard/SalesFunnel';
import { AnalyticsCharts } from '@/components/dashboard/AnalyticsCharts';
import { Users, PhoneCall, CalendarCheck, Award, Flame, Search } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Admin User');
  const [userRole, setUserRole] = useState('ADMIN');

  const fetchStats = (email: string, role: string) => {
    setLoading(true);
    fetch(`/api/dashboard/stats?email=${encodeURIComponent(email)}&role=${encodeURIComponent(role)}`)
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
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

    setUserName(savedName);
    setUserRole(savedRole);
    fetchStats(savedEmail, savedRole);

    const handleStorage = () => {
      const e = localStorage.getItem('userEmail') || 'admin@apnibus.in';
      const r = localStorage.getItem('userRole') || 'ADMIN';
      const n = localStorage.getItem('userName') || 'Admin User';

      setUserName(n);
      setUserRole(r);
      fetchStats(e, r);
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 font-bold text-xs">
        Loading Intercity Sales Dashboard...
      </div>
    );
  }

  const kpis = stats?.kpis || {
    totalLeads: 0,
    newLeads: 0,
    hotLeads: 0,
    contactedLeads: 0,
    interestedLeads: 0,
    demoScheduled: 0,
    demoCompleted: 0,
    converted: 0,
  };

  const funnelData = {
    newLeads: kpis.newLeads || 0,
    contacted: kpis.contactedLeads || 0,
    interested: kpis.interestedLeads || 0,
    demoScheduled: kpis.demoScheduled || 0,
    demoCompleted: kpis.demoCompleted || 0,
    converted: kpis.converted || 0,
  };

  const isAdmin = userRole === 'ADMIN';

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-black text-slate-900 tracking-tight">
              {isAdmin ? 'Master Sales Dashboard' : `${userName}'s Workspace Dashboard`}
            </h1>
            <span
              className={`text-xs font-black px-3 py-0.5 rounded-full border ${
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
              ? 'Real-time sales performance tracking for Tier-3 & Tier-4 intercity bus POS machine sales'
              : `Strictly isolated metrics for leads assigned to ${userName}`}
          </p>
        </div>

        {isAdmin && (
          <Link
            href="/lead-generator"
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white font-black rounded-xl text-xs uppercase tracking-wider transition shadow-xs flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>Generate New Leads</span>
          </Link>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Assigned Leads"
          value={kpis.totalLeads}
          subtitle={isAdmin ? 'Total operators in system' : `Assigned to ${userName}`}
          icon={Users}
          color="blue"
        />
        <KpiCard
          title="🔥 HOT Leads"
          value={kpis.hotLeads || 0}
          subtitle="Immediate call target"
          icon={Flame}
          color="rose"
        />
        <KpiCard
          title="POS Demos Scheduled"
          value={kpis.demoScheduled}
          subtitle="On-ground conductor demos"
          icon={CalendarCheck}
          color="amber"
        />
        <KpiCard
          title="Converted (POS Sold)"
          value={kpis.converted}
          subtitle="Successful onboardings"
          icon={Award}
          color="emerald"
        />
      </div>

      {/* Intercity Sales Funnel */}
      <SalesFunnel funnelData={funnelData} />

      {/* Analytics Charts */}
      {stats?.charts && <AnalyticsCharts stats={stats.charts} />}
    </div>
  );
}
