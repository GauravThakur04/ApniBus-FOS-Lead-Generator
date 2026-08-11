'use client';

import React, { useState, useEffect } from 'react';
import { Award, Crown, MapPin, Search, Filter } from 'lucide-react';

export default function FosPerformancePage() {
  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/fos/performance')
      .then((res) => res.json())
      .then((resData) => {
        const list = resData.fosPerformance || [];
        setData(list);
        setFilteredData(list);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = [...data];
    if (roleFilter !== 'ALL') {
      result = result.filter((u) => u.designation === roleFilter || u.role === roleFilter);
    }
    if (search.trim() !== '') {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          (u.empId && u.empId.toLowerCase().includes(q)) ||
          u.email.toLowerCase().includes(q) ||
          (u.phone && u.phone.includes(q)) ||
          (u.cities && u.cities.toLowerCase().includes(q))
      );
    }
    setFilteredData(result);
  }, [roleFilter, search, data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 font-semibold text-xs">
        Loading Team Performance Leaderboard...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Active Team Performance Leaderboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            44+ Active Sales Team Members across Regional Heads (RH), Team Leads (TL), BD &amp; ISA
          </p>
        </div>
        <span className="text-xs bg-blue-50 text-blue-700 font-bold px-3 py-1.5 rounded-full border border-blue-200">
          Total Active Team: {data.length} Members
        </span>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search team member by Name, Employee ID (AB024, AB407), Phone, or Location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 bg-slate-50 font-medium"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
        >
          <option value="ALL">All Roles (RH, TL, BD, ISA)</option>
          <option value="RH">RH (Regional Heads)</option>
          <option value="TL">TL (Team Leads)</option>
          <option value="BD">BD (Business Development)</option>
          <option value="ISA">ISA (Inside Sales Associate)</option>
        </select>
      </div>

      {/* Leaderboard Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredData.map((user, idx) => (
          <div key={user.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                    idx === 0
                      ? 'bg-amber-100 text-amber-700 border border-amber-300'
                      : idx === 1
                      ? 'bg-slate-200 text-slate-800'
                      : idx === 2
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-slate-800 text-white'
                  }`}
                >
                  {idx === 0 ? <Award className="w-5 h-5 text-amber-600" /> : `#${idx + 1}`}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-base">{user.name}</h3>
                    {user.empId && (
                      <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                        {user.empId}
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                        user.designation === 'RH'
                          ? 'bg-orange-100 text-orange-800 border-orange-200'
                          : user.designation === 'TL'
                          ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                          : user.designation === 'ISA'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-blue-100 text-blue-800 border-blue-200'
                      }`}
                    >
                      {user.designation}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{user.email} • {user.phone || 'No phone'}</p>
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-800 rounded-full border border-slate-200">
                {user.state || 'India'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Assigned Location: <strong className="text-slate-800">{user.cities || 'All Cities'}</strong></span>
              </span>
              {user.reportingManager && (
                <span className="text-[11px] text-slate-400 italic">
                  Reports to: <strong className="text-slate-600">{user.reportingManager.split('@')[0]}</strong>
                </span>
              )}
            </div>

            {/* Performance Metric Cards */}
            <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-100 text-center">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                <span className="text-[10px] font-semibold text-slate-500 block">Total Assigned</span>
                <span className="text-lg font-extrabold text-slate-900">{user.metrics.totalAssigned}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                <span className="text-[10px] font-semibold text-slate-500 block">Contacted</span>
                <span className="text-lg font-extrabold text-blue-600">{user.metrics.contacted}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                <span className="text-[10px] font-semibold text-slate-500 block">Demos</span>
                <span className="text-lg font-extrabold text-purple-600">{user.metrics.demos}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                <span className="text-[10px] font-semibold text-slate-500 block">Converted</span>
                <span className="text-lg font-extrabold text-emerald-600">{user.metrics.converted}</span>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs font-semibold pt-2 text-slate-600">
              <span>Contact Rate: {user.metrics.contactRate}%</span>
              <span className="text-emerald-700 font-bold">Conversion Rate: {user.metrics.conversionRate}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
