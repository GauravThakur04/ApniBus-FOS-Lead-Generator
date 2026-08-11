'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Map, PieChart as PieIcon, Award, BarChart3 } from 'lucide-react';

interface AnalyticsChartsProps {
  stats: {
    leadsByState?: { state: string; count: number }[];
    leadsByTemperature?: { temperature: string; count: number }[];
    leadsByStatus?: { status: string; count: number }[];
    leadsBySource?: { source: string; count: number }[];
    leadsByFos?: { name: string; count: number }[];
  };
}

const TEMP_COLORS: Record<string, string> = {
  HOT: '#f43f5e',
  WARM: '#f59e0b',
  COLD: '#38bdf8',
};

export function AnalyticsCharts({ stats }: AnalyticsChartsProps) {
  const stateData = stats?.leadsByState || [];
  const tempData = stats?.leadsByTemperature || [];
  const statusData = stats?.leadsByStatus || [];
  const fosData = stats?.leadsByFos || [];

  return (
    <div className="space-y-6">
      {/* Row 1: State Distribution & Lead Temperature */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* State Distribution */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-base font-heading flex items-center gap-2">
              <Map className="w-4 h-4 text-blue-600" />
              <span>Target State Lead Distribution</span>
            </h3>
            <span className="text-[11px] text-slate-500 font-semibold">9 Active Territories</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stateData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="state" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Temperature Breakdown */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-base font-heading flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-orange-500" />
              <span>Lead Temperature (Scoring Priority)</span>
            </h3>
            <span className="text-[11px] text-slate-500 font-semibold">HOT / WARM / COLD</span>
          </div>

          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tempData}
                  dataKey="count"
                  nameKey="temperature"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {tempData.map((entry) => (
                    <Cell key={entry.temperature} fill={TEMP_COLORS[entry.temperature] || '#2563eb'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Status Pipeline & FOS Lead Load */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Pipeline */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-base font-heading flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-600" />
              <span>Leads by Status Pipeline</span>
            </h3>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis dataKey="status" type="category" stroke="#64748b" tick={{ fontSize: 10 }} width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#7c3aed" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* FOS Executive Lead Load */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-base font-heading flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>Executive &amp; RH Assigned Volume</span>
            </h3>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fosData.slice(0, 7)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#059669" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
