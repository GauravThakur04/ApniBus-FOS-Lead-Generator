'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, ExternalLink, Bus } from 'lucide-react';
import { LeadItem } from '@/components/leads/LeadsTable';
import { ALL_INDIAN_STATES } from '@/lib/constants';

export default function MapViewPage() {
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState('ALL');

  useEffect(() => {
    fetch('/api/leads?limit=200')
      .then((res) => res.json())
      .then((data) => {
        setLeads(data.leads || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = leads.filter((l) => (selectedState === 'ALL' ? true : l.state === selectedState));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 font-bold text-xs">
        Loading Map Coordinates...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="font-heading text-2xl font-black text-slate-900 tracking-tight">Territory Geographic Map View</h1>
          <p className="text-xs text-slate-600 mt-0.5 font-medium">
            Geotagged intercity bus operator clusters for FOS field visit planning
          </p>
        </div>

        <select
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
        >
          <option value="ALL">All States &amp; UTs ({ALL_INDIAN_STATES.length})</option>
          {ALL_INDIAN_STATES.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
      </div>

      {/* Geotagged Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-3 bg-white p-12 text-center text-slate-400 rounded-2xl border border-slate-200 italic font-medium">
            No geotagged bus operators found in selected territory.
          </div>
        ) : (
          filtered.map((lead) => {
            const mapsUrl =
              lead.googleMapsUrl ||
              `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                `${lead.businessName}, ${lead.city}, ${lead.state}`
              )}`;

            return (
              <div key={lead.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-heading font-black text-base text-slate-900">{lead.businessName}</h3>
                    <p className="text-xs text-slate-500 font-bold mt-0.5">{lead.city}, {lead.state}</p>
                  </div>
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                      lead.leadTemperature === 'HOT'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : lead.leadTemperature === 'WARM'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-sky-50 text-sky-700 border-sky-200'
                    }`}
                  >
                    Score {lead.leadScore}
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1 border-t border-slate-100 pt-2 font-mono">
                  <p>Phone: {lead.phone || 'N/A'}</p>
                  <p>Status: {lead.status}</p>
                </div>

                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
                >
                  <MapPin className="w-4 h-4 text-orange-500" />
                  <span>Navigate on Google Maps</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
