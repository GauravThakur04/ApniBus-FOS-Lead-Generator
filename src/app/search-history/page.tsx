'use client';

import React, { useEffect, useState } from 'react';
import { History, Search, CheckCircle2, Clock } from 'lucide-react';

export default function SearchHistoryPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/search/history')
      .then((res) => res.json())
      .then((data) => {
        setJobs(data.searchJobs || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="font-heading text-2xl font-black text-slate-900 tracking-tight">Search Audit History Log</h1>
          <p className="text-xs text-slate-600 mt-0.5 font-medium">
            Audit log of all Google Places API lead generation queries executed
          </p>
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-8 text-center text-slate-500 font-bold text-xs">Loading search audit history...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-800 border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] tracking-wider text-slate-500 font-bold">
                <tr>
                  <th className="p-4">Searched At</th>
                  <th className="p-4">Territory State &amp; City</th>
                  <th className="p-4">Search Keyword</th>
                  <th className="p-4">Found</th>
                  <th className="p-4">New Leads</th>
                  <th className="p-4">Duplicates</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {jobs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 font-medium italic">
                      No search jobs logged yet.
                    </td>
                  </tr>
                ) : (
                  jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-50 transition">
                      <td className="p-4 font-mono text-[11px] text-slate-600">
                        {new Date(job.searchedAt).toLocaleString()}
                      </td>
                      <td className="p-4 font-bold text-slate-900">
                        {job.city}, {job.state}
                      </td>
                      <td className="p-4 font-extrabold text-orange-600">
                        {job.keyword}
                      </td>
                      <td className="p-4 font-bold text-slate-700">{job.resultsFound}</td>
                      <td className="p-4 font-extrabold text-emerald-600">+{job.newLeads}</td>
                      <td className="p-4 font-bold text-amber-600">{job.duplicates}</td>
                      <td className="p-4">
                        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {job.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
