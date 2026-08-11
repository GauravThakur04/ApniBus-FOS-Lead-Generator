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
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 dark-card p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 className="font-heading text-2xl font-black text-white tracking-tight">Search Audit History Log</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit log of all Google Places API lead generation queries executed
          </p>
        </div>
      </div>

      {/* Audit Table */}
      <div className="dark-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-8 text-center text-slate-400 font-bold text-xs">Loading search audit history...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 border-b border-slate-800 uppercase text-[10px] tracking-wider text-slate-400 font-bold">
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
              <tbody className="divide-y divide-slate-800/80">
                {jobs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                      No search jobs logged yet.
                    </td>
                  </tr>
                ) : (
                  jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-800/60 transition">
                      <td className="p-4 font-mono text-[11px] text-slate-400">
                        {new Date(job.searchedAt).toLocaleString()}
                      </td>
                      <td className="p-4 font-bold text-white">
                        {job.city}, {job.state}
                      </td>
                      <td className="p-4">
                        <span className="bg-slate-800 text-blue-300 px-2 py-0.5 rounded border border-slate-700 font-mono text-[11px]">
                          {job.keyword}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-slate-200">{job.resultsFound}</td>
                      <td className="p-4 font-bold text-emerald-400">{job.newLeads}</td>
                      <td className="p-4 font-bold text-amber-400">{job.duplicates}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
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
