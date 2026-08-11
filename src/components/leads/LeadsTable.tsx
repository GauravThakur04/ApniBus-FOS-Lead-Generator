'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Flame,
  CheckCircle2,
  ChevronRight,
  Star,
  MapPin,
  ExternalLink,
  Zap,
  Snowflake,
  Trash2,
  Eye,
  PhoneCall,
  MessageSquare,
} from 'lucide-react';
import { ALL_INDIAN_STATES } from '@/lib/constants';

export interface LeadItem {
  id: string;
  businessName: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  city: string;
  state: string;
  rating?: number | null;
  reviewCount?: number | null;
  leadScore: number;
  leadTemperature: 'HOT' | 'WARM' | 'COLD';
  status: string;
  googleMapsUrl?: string | null;
  assignedToId?: string | null;
  assignedTo?: {
    id: string;
    name: string;
    empId?: string | null;
    designation?: string | null;
  } | null;
  createdAt: string;
}

interface LeadsTableProps {
  leads: LeadItem[];
  totalLeads?: number;
  onSelectLead: (lead: LeadItem) => void;
  onQuickStatusChange?: () => void;
}

export function LeadsTable({ leads: initialLeads, totalLeads, onSelectLead, onQuickStatusChange }: LeadsTableProps) {
  const [leadsList, setLeadsList] = useState<LeadItem[]>(initialLeads);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [stateFilter, setStateFilter] = useState('ALL');
  const [tempFilter, setTempFilter] = useState('ALL');
  const [assignedFilter, setAssignedFilter] = useState('ALL');
  const [mapsVisitedFilter, setMapsVisitedFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'score' | 'date' | 'name'>('score');

  // Leaders List for manual assignment
  const [leaders, setLeaders] = useState<any[]>([]);

  // Track Visited Maps Lead IDs (Persisted in localStorage)
  const [visitedMapIds, setVisitedMapIds] = useState<string[]>([]);

  // Bulk Selection State
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    setLeadsList(initialLeads);
  }, [initialLeads]);

  useEffect(() => {
    fetch('/api/fos/performance')
      .then((res) => res.json())
      .then((data) => {
        setLeaders(data.fosPerformance || []);
      })
      .catch(() => {});

    try {
      const stored = localStorage.getItem('apnibus_visited_map_leads');
      if (stored) {
        setVisitedMapIds(JSON.parse(stored));
      }
    } catch (e) {}
  }, []);

  const markMapAsVisited = (leadId: string) => {
    if (!visitedMapIds.includes(leadId)) {
      const next = [...visitedMapIds, leadId];
      setVisitedMapIds(next);
      try {
        localStorage.setItem('apnibus_visited_map_leads', JSON.stringify(next));
      } catch (e) {}
    }
  };

  const handleCategoryChange = async (leadId: string, newTemp: 'HOT' | 'WARM' | 'COLD') => {
    setLeadsList((prev) =>
      prev.map((item) => (item.id === leadId ? { ...item, leadTemperature: newTemp } : item))
    );

    try {
      await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadTemperature: newTemp }),
      });
      if (onQuickStatusChange) onQuickStatusChange();
    } catch (err) {
      console.error('Failed to update category', err);
    }
  };

  const handleAssignSingleLead = async (leadId: string, assignedToId: string) => {
    const leader = leaders.find((l) => l.id === assignedToId);
    setLeadsList((prev) =>
      prev.map((item) =>
        item.id === leadId
          ? {
              ...item,
              assignedToId: assignedToId || null,
              assignedTo: leader ? { id: leader.id, name: leader.name, empId: leader.empId } : null,
            }
          : item
      )
    );

    try {
      await fetch(`/api/leads/${leadId}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedToId }),
      });
      if (onQuickStatusChange) onQuickStatusChange();
    } catch (err) {
      console.error('Failed to assign lead', err);
    }
  };

  const handleDeleteSingleLead = async (leadId: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete lead "${name}"?`)) return;

    try {
      const res = await fetch('/api/leads/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadIds: [leadId] }),
      });
      if (res.ok) {
        setLeadsList((prev) => prev.filter((item) => item.id !== leadId));
        setToastMessage(`Deleted "${name}"`);
        setTimeout(() => setToastMessage(''), 3000);
        if (onQuickStatusChange) onQuickStatusChange();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleSelectLead = (leadId: string) => {
    if (selectedLeadIds.includes(leadId)) {
      setSelectedLeadIds(selectedLeadIds.filter((id) => id !== leadId));
    } else {
      setSelectedLeadIds([...selectedLeadIds, leadId]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedLeadIds.length === filteredLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(filteredLeads.map((l) => l.id));
    }
  };

  const handleBulkAssign = async (assignedToId: string) => {
    if (selectedLeadIds.length === 0) return;
    try {
      const res = await fetch('/api/leads/bulk-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadIds: selectedLeadIds, assignedToId }),
      });
      if (res.ok) {
        setSelectedLeadIds([]);
        if (onQuickStatusChange) onQuickStatusChange();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedLeadIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedLeadIds.length} selected leads?`)) return;

    setIsDeleting(true);
    try {
      const res = await fetch('/api/leads/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadIds: selectedLeadIds }),
      });

      if (res.ok) {
        setLeadsList((prev) => prev.filter((item) => !selectedLeadIds.includes(item.id)));
        setToastMessage(`Successfully deleted ${selectedLeadIds.length} leads!`);
        setSelectedLeadIds([]);
        setTimeout(() => setToastMessage(''), 3000);
        if (onQuickStatusChange) onQuickStatusChange();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter Logic
  const filteredLeads = leadsList.filter((lead) => {
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      const matchName = lead.businessName.toLowerCase().includes(q);
      const matchCity = lead.city.toLowerCase().includes(q);
      const matchState = lead.state.toLowerCase().includes(q);
      const matchPhone = lead.phone ? lead.phone.includes(q) : false;
      if (!matchName && !matchCity && !matchState && !matchPhone) return false;
    }

    if (mapsVisitedFilter === 'VISITED' && !visitedMapIds.includes(lead.id)) return false;
    if (mapsVisitedFilter === 'UNVISITED' && visitedMapIds.includes(lead.id)) return false;

    if (stateFilter !== 'ALL' && lead.state.toLowerCase() !== stateFilter.toLowerCase()) return false;
    if (tempFilter !== 'ALL' && lead.leadTemperature !== tempFilter) return false;

    if (assignedFilter === 'UNASSIGNED' && lead.assignedToId) return false;
    if (assignedFilter === 'ASSIGNED' && !lead.assignedToId) return false;
    if (assignedFilter !== 'ALL' && assignedFilter !== 'UNASSIGNED' && assignedFilter !== 'ASSIGNED') {
      if (lead.assignedToId !== assignedFilter) return false;
    }

    return true;
  });

  const sorted = [...filteredLeads].sort((a, b) => {
    if (sortBy === 'score') return b.leadScore - a.leadScore;
    if (sortBy === 'date') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === 'name') return a.businessName.localeCompare(b.businessName);
    return 0;
  });

  return (
    <div className="space-y-4">
      {toastMessage && (
        <div className="p-3 bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center justify-between shadow-lg animate-bounce">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      {selectedLeadIds.length > 0 && (
        <div className="bg-slate-900 text-white p-3 rounded-2xl border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-3 sticky top-16 z-20">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black bg-orange-500 text-white px-2.5 py-0.5 rounded-full">
              {selectedLeadIds.length} Selected
            </span>
            <span className="text-xs font-bold text-slate-300">Bulk Actions:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-xl transition flex items-center gap-1.5 shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete ({selectedLeadIds.length})</span>
            </button>

            {leaders.map((leader) => (
              <button
                key={leader.id}
                onClick={() => handleBulkAssign(leader.id)}
                disabled={isDeleting}
                className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-black rounded-xl transition shadow-xs"
              >
                Assign to {leader.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search bus operator, phone, city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
          <select
            value={mapsVisitedFilter}
            onChange={(e) => setMapsVisitedFilter(e.target.value)}
            className="bg-purple-50 border border-purple-200 rounded-xl px-3 py-2 text-xs font-extrabold text-purple-900 focus:outline-none"
          >
            <option value="ALL">All Google Maps States</option>
            <option value="VISITED">💜 Maps Opened / Visited ({visitedMapIds.length})</option>
            <option value="UNVISITED">⚪ Unvisited Maps ({leadsList.length - visitedMapIds.length})</option>
          </select>

          <select
            value={assignedFilter}
            onChange={(e) => setAssignedFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
          >
            <option value="ALL">All Assignment States</option>
            <option value="UNASSIGNED">⚪ Unassigned Leads</option>
            <option value="ASSIGNED">🟢 Assigned Leads</option>
            {leaders.map((l) => (
              <option key={l.id} value={l.id}>
                👤 {l.name} ({l.empId})
              </option>
            ))}
          </select>

          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
          >
            <option value="ALL">All States ({ALL_INDIAN_STATES.length})</option>
            {ALL_INDIAN_STATES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 📱 MOBILE CARD VIEW FOR SMARTPHONES (Visible on screens < 768px) */}
      <div className="block md:hidden space-y-3 pb-16">
        {sorted.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 italic">
            No intercity bus operator leads found.
          </div>
        ) : (
          sorted.map((lead) => {
            const isMapVisited = visitedMapIds.includes(lead.id);
            const googleMapsUrl =
              lead.googleMapsUrl ||
              `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                `${lead.businessName}, ${lead.city}, ${lead.state}`
              )}`;

            return (
              <div
                key={lead.id}
                className={`p-4 rounded-2xl border shadow-xs space-y-3 transition ${
                  isMapVisited
                    ? 'bg-purple-50/80 border-purple-300'
                    : 'bg-white border-slate-200'
                }`}
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2">
                  <div onClick={() => onSelectLead(lead)} className="cursor-pointer space-y-1">
                    <h3 className="font-heading font-black text-slate-900 text-sm leading-tight">
                      {lead.businessName}
                    </h3>
                    <p className="text-xs font-bold text-slate-600">
                      📍 {lead.city}, {lead.state}
                    </p>
                  </div>

                  <button
                    onClick={(e) => handleDeleteSingleLead(lead.id, lead.businessName, e)}
                    className="p-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Direct 1-Tap Phone & Action Bar for Mobile */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {lead.phone ? (
                    <a
                      href={`tel:${lead.phone}`}
                      className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs flex items-center justify-center gap-1 shadow-xs"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </a>
                  ) : (
                    <button disabled className="py-2 px-3 bg-slate-100 text-slate-400 rounded-xl text-xs font-bold">
                      No Phone
                    </button>
                  )}

                  {lead.phone ? (
                    <a
                      href={`https://wa.me/91${lead.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-xs flex items-center justify-center gap-1 shadow-xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  ) : (
                    <button disabled className="py-2 px-3 bg-slate-100 text-slate-400 rounded-xl text-xs font-bold">
                      No WA
                    </button>
                  )}

                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => markMapAsVisited(lead.id)}
                    className={`py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1 border ${
                      isMapVisited
                        ? 'bg-purple-600 text-white border-purple-700'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Maps</span>
                  </a>
                </div>

                {/* Mobile Quick Dropdowns */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <select
                    value={lead.leadTemperature}
                    onChange={(e) => handleCategoryChange(lead.id, e.target.value as any)}
                    className={`w-full border rounded-xl px-2.5 py-1.5 text-xs font-black focus:outline-none ${
                      lead.leadTemperature === 'HOT'
                        ? 'bg-rose-50 border-rose-300 text-rose-800'
                        : lead.leadTemperature === 'WARM'
                        ? 'bg-amber-50 border-amber-300 text-amber-800'
                        : 'bg-sky-50 border-sky-300 text-sky-800'
                    }`}
                  >
                    <option value="HOT">🔥 HOT</option>
                    <option value="WARM">⚡ WARM</option>
                    <option value="COLD">❄️ COLD</option>
                  </select>

                  <select
                    value={lead.assignedToId || ''}
                    onChange={(e) => handleAssignSingleLead(lead.id, e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-extrabold focus:outline-none"
                  >
                    <option value="">⚪ Unassigned</option>
                    {leaders.map((leader) => (
                      <option key={leader.id} value={leader.id}>
                        👤 {leader.name.split(' ')[0]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 🖥️ DESKTOP LEADS TABLE (Visible on screens >= 768px) */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={sorted.length > 0 && selectedLeadIds.length === sorted.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4">Bus Operator &amp; Google Rating</th>
                <th className="py-3 px-4">Location &amp; Phone</th>
                <th className="py-3 px-4">Priority (HOT/WARM/COLD)</th>
                <th className="py-3 px-4">Pipeline Status</th>
                <th className="py-3 px-4">Assigned Leader</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-900">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                    No intercity bus operator leads match the selected filter.
                  </td>
                </tr>
              ) : (
                sorted.map((lead) => {
                  const isSelected = selectedLeadIds.includes(lead.id);
                  const isMapVisited = visitedMapIds.includes(lead.id);

                  const googleMapsUrl =
                    lead.googleMapsUrl ||
                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${lead.businessName}, ${lead.city}, ${lead.state}`
                    )}`;

                  return (
                    <tr
                      key={lead.id}
                      className={`transition ${
                        isMapVisited
                          ? 'bg-purple-50/70 border-l-4 border-l-purple-600 hover:bg-purple-100/70'
                          : isSelected
                          ? 'bg-orange-50/30'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectLead(lead.id)}
                          className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
                        />
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div
                            onClick={() => onSelectLead(lead)}
                            className="cursor-pointer group hover:text-blue-600 transition flex items-center gap-2 font-extrabold text-sm text-slate-900 font-heading"
                          >
                            <span>{lead.businessName}</span>
                            {isMapVisited && (
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-600 text-white shadow-2xs flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                <span>Maps Checked</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-[10px]">
                            {lead.rating ? (
                              <span className="font-extrabold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-0.5">
                                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                <span>⭐ {lead.rating}</span>
                                {lead.reviewCount && <span className="text-slate-500">({lead.reviewCount})</span>}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">No rating</span>
                            )}

                            <a
                              href={googleMapsUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={() => markMapAsVisited(lead.id)}
                              className={`px-2 py-0.5 rounded-lg border font-bold flex items-center gap-1 transition ${
                                isMapVisited
                                  ? 'bg-purple-600 text-white border-purple-700 hover:bg-purple-700 shadow-2xs font-black'
                                  : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                              }`}
                            >
                              <MapPin className="w-3 h-3" />
                              <span>{isMapVisited ? '✓ Visited Maps' : 'Maps ↗'}</span>
                            </a>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-700">
                        <p className="font-bold text-slate-900">{lead.city}, {lead.state}</p>
                        <p className="text-slate-500 text-[11px] font-mono">{lead.phone || 'No phone listed'}</p>
                      </td>

                      <td className="py-3 px-4">
                        <select
                          value={lead.leadTemperature}
                          onChange={(e) => handleCategoryChange(lead.id, e.target.value as any)}
                          className={`border rounded-xl px-2.5 py-1 text-xs font-black transition cursor-pointer focus:outline-none ${
                            lead.leadTemperature === 'HOT'
                              ? 'bg-rose-50 border-rose-300 text-rose-800'
                              : lead.leadTemperature === 'WARM'
                              ? 'bg-amber-50 border-amber-300 text-amber-800'
                              : 'bg-sky-50 border-sky-300 text-sky-800'
                          }`}
                        >
                          <option value="HOT">🔥 HOT Lead</option>
                          <option value="WARM">⚡ WARM Lead</option>
                          <option value="COLD">❄️ COLD Lead</option>
                        </select>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                          {lead.status}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <select
                          value={lead.assignedToId || ''}
                          onChange={(e) => handleAssignSingleLead(lead.id, e.target.value)}
                          className={`w-full max-w-[190px] border rounded-xl px-2.5 py-1.5 text-xs font-extrabold transition focus:outline-none cursor-pointer ${
                            lead.assignedToId
                              ? 'bg-orange-50 border-orange-300 text-orange-900 font-extrabold'
                              : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <option value="">⚪ Unassigned</option>
                          {leaders.map((leader) => (
                            <option key={leader.id} value={leader.id}>
                              👤 {leader.name} ({leader.empId})
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectLead(lead)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition border border-slate-200 inline-flex items-center gap-1"
                          >
                            <span>Details</span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                          </button>

                          <button
                            onClick={(e) => handleDeleteSingleLead(lead.id, lead.businessName, e)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-800 rounded-xl transition border border-rose-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
