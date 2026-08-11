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
  EyeOff,
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

    // Load visited maps leads from localStorage
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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Temperature Counts
  const hotCount = leadsList.filter((l) => l.leadTemperature === 'HOT').length;
  const warmCount = leadsList.filter((l) => l.leadTemperature === 'WARM').length;
  const coldCount = leadsList.filter((l) => l.leadTemperature === 'COLD').length;

  // Manual Temperature Re-Categorization Handler by Team
  const handleCategoryChange = async (leadId: string, newTemp: 'HOT' | 'WARM' | 'COLD') => {
    setLeadsList((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, leadTemperature: newTemp } : l))
    );

    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadTemperature: newTemp }),
      });

      if (!res.ok) throw new Error('Failed to update temperature');
      showToast(`Lead priority re-categorized to ${newTemp}`);
      if (onQuickStatusChange) onQuickStatusChange();
    } catch (err: any) {
      console.error(err);
    }
  };

  // Single Lead Delete Handler
  const handleDeleteSingleLead = async (leadId: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to permanently delete lead "${name}"?`)) return;

    setLeadsList((prev) => prev.filter((l) => l.id !== leadId));
    setSelectedLeadIds((prev) => prev.filter((id) => id !== leadId));

    try {
      const res = await fetch(`/api/leads/${leadId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete lead');
      showToast(`Deleted lead "${name}"`);
      if (onQuickStatusChange) onQuickStatusChange();
    } catch (err: any) {
      console.error(err);
    }
  };

  // Bulk Delete Leads Handler
  const handleBulkDelete = async () => {
    if (selectedLeadIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to permanently delete all ${selectedLeadIds.length} selected leads?`)) return;

    setIsDeleting(true);
    const count = selectedLeadIds.length;
    const toDeleteIds = [...selectedLeadIds];

    setLeadsList((prev) => prev.filter((l) => !toDeleteIds.includes(l.id)));
    setSelectedLeadIds([]);

    try {
      const res = await fetch('/api/leads/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadIds: toDeleteIds }),
      });

      if (!res.ok) throw new Error('Bulk delete failed');
      showToast(`Successfully deleted ${count} useless leads.`);
      if (onQuickStatusChange) onQuickStatusChange();
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  // 1-Click Quick In-Line Assignment Handler
  const handleAssignSingleLead = async (leadId: string, userId: string) => {
    const targetLeader = leaders.find((l) => l.id === userId);

    setLeadsList((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? {
              ...l,
              assignedToId: userId || null,
              assignedTo: targetLeader ? { id: targetLeader.id, name: targetLeader.name, empId: targetLeader.empId } : null,
              status: userId ? 'Assigned' : l.status,
            }
          : l
      )
    );

    try {
      const res = await fetch(`/api/leads/${leadId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId || null,
          assignedToId: userId || null,
        }),
      });

      if (!res.ok) throw new Error('Failed to assign lead');
      showToast(targetLeader ? `Lead assigned to ${targetLeader.name}!` : 'Lead marked as Unassigned');
      if (onQuickStatusChange) onQuickStatusChange();
    } catch (err: any) {
      console.error(err);
    }
  };

  // Bulk Assignment Handler
  const handleBulkAssign = async (targetUserId: string) => {
    if (selectedLeadIds.length === 0) return;

    const targetLeader = leaders.find((l) => l.id === targetUserId);
    setIsDeleting(true);

    setLeadsList((prev) =>
      prev.map((l) =>
        selectedLeadIds.includes(l.id)
          ? {
              ...l,
              assignedToId: targetUserId || null,
              assignedTo: targetLeader ? { id: targetLeader.id, name: targetLeader.name, empId: targetLeader.empId } : null,
              status: targetUserId ? 'Assigned' : l.status,
            }
          : l
      )
    );

    try {
      const res = await fetch('/api/leads/bulk-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadIds: selectedLeadIds,
          userId: targetUserId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk assignment failed');

      showToast(`Assigned ${selectedLeadIds.length} leads to ${data.assignedTo}!`);
      setSelectedLeadIds([]);
      if (onQuickStatusChange) onQuickStatusChange();
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered Leads
  const filtered = leadsList.filter((l) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = l.businessName.toLowerCase().includes(q);
      const matchPhone = l.phone?.toLowerCase().includes(q);
      const matchCity = l.city.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchCity) return false;
    }
    if (statusFilter !== 'ALL' && l.status !== statusFilter) return false;
    if (stateFilter !== 'ALL' && l.state !== stateFilter) return false;
    if (tempFilter !== 'ALL' && l.leadTemperature !== tempFilter) return false;
    if (assignedFilter === 'UNASSIGNED' && l.assignedToId) return false;
    if (assignedFilter === 'ASSIGNED' && !l.assignedToId) return false;
    if (assignedFilter !== 'ALL' && assignedFilter !== 'UNASSIGNED' && assignedFilter !== 'ASSIGNED') {
      if (l.assignedToId !== assignedFilter) return false;
    }

    // Visited Maps Filter
    if (mapsVisitedFilter === 'VISITED' && !visitedMapIds.includes(l.id)) return false;
    if (mapsVisitedFilter === 'UNVISITED' && visitedMapIds.includes(l.id)) return false;

    return true;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'score') return b.leadScore - a.leadScore;
    if (sortBy === 'name') return a.businessName.localeCompare(b.businessName);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const toggleSelectAll = () => {
    if (selectedLeadIds.length === sorted.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(sorted.map((l) => l.id));
    }
  };

  const toggleSelectLead = (id: string) => {
    if (selectedLeadIds.includes(id)) {
      setSelectedLeadIds(selectedLeadIds.filter((item) => item !== id));
    } else {
      setSelectedLeadIds([...selectedLeadIds, id]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 p-4 bg-slate-900 text-white font-bold text-xs rounded-2xl border border-slate-700 shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HOT / WARM / COLD Temperature Quick Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setTempFilter('ALL')}
          className={`p-3.5 rounded-2xl border transition text-left ${
            tempFilter === 'ALL'
              ? 'bg-slate-900 text-white border-slate-900 shadow-md'
              : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">All Leads</span>
          <span className="font-heading font-black text-xl">{leadsList.length}</span>
        </button>

        <button
          onClick={() => setTempFilter('HOT')}
          className={`p-3.5 rounded-2xl border transition text-left ${
            tempFilter === 'HOT'
              ? 'bg-rose-600 text-white border-rose-600 shadow-md font-black'
              : 'bg-rose-50/60 text-rose-900 border-rose-200 hover:bg-rose-100/60'
          }`}
        >
          <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>🔥 HOT Leads</span>
          </span>
          <span className="font-heading font-black text-xl text-rose-700">{hotCount}</span>
        </button>

        <button
          onClick={() => setTempFilter('WARM')}
          className={`p-3.5 rounded-2xl border transition text-left ${
            tempFilter === 'WARM'
              ? 'bg-amber-500 text-white border-amber-500 shadow-md font-black'
              : 'bg-amber-50/60 text-amber-900 border-amber-200 hover:bg-amber-100/60'
          }`}
        >
          <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>⚡ WARM Leads</span>
          </span>
          <span className="font-heading font-black text-xl text-amber-700">{warmCount}</span>
        </button>

        <button
          onClick={() => setTempFilter('COLD')}
          className={`p-3.5 rounded-2xl border transition text-left ${
            tempFilter === 'COLD'
              ? 'bg-sky-600 text-white border-sky-600 shadow-md font-black'
              : 'bg-sky-50/60 text-sky-900 border-sky-200 hover:bg-sky-100/60'
          }`}
        >
          <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
            <Snowflake className="w-3.5 h-3.5 text-sky-500" />
            <span>❄️ COLD Leads</span>
          </span>
          <span className="font-heading font-black text-xl text-sky-700">{coldCount}</span>
        </button>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedLeadIds.length > 0 && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 rounded-2xl border border-slate-700 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="bg-orange-500 text-white text-xs font-black px-3 py-1 rounded-xl shadow-xs">
              {selectedLeadIds.length} Leads Selected
            </span>
            <span className="text-xs text-slate-300 font-bold">Choose Action:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl transition shadow-xs flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete {selectedLeadIds.length} Selected Leads</span>
            </button>

            <button
              onClick={() => handleBulkAssign('')}
              disabled={isDeleting}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-xl transition border border-slate-600"
            >
              Mark Unassigned
            </button>

            {leaders.map((leader) => (
              <button
                key={leader.id}
                onClick={() => handleBulkAssign(leader.id)}
                disabled={isDeleting}
                className="px-3 py-2 bg-gradient-to-r from-orange-500 to-blue-600 hover:from-orange-600 hover:to-blue-700 text-white text-xs font-black rounded-xl transition shadow-xs"
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
          {/* Maps Visited Filter */}
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

          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
          >
            <option value="score">Sort: Highest Lead Score</option>
            <option value="date">Sort: Newest First</option>
            <option value="name">Sort: Business Name</option>
          </select>
        </div>
      </div>

      {/* Main Leads Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
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
                      {/* Checkbox */}
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectLead(lead.id)}
                          className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
                        />
                      </td>

                      {/* Business Name & Google Rating & MAPS VISITED HIGHLIGHT */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div
                            onClick={() => onSelectLead(lead)}
                            className="cursor-pointer group hover:text-blue-600 transition flex items-center gap-2 font-extrabold text-sm text-slate-900 font-heading"
                          >
                            <span>{lead.businessName}</span>

                            {/* Color Highlight Badge for Visited Maps */}
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

                            {/* Distinct Maps Link Button with Visited State Color */}
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

                      {/* Location & Phone */}
                      <td className="py-3 px-4 text-slate-700">
                        <p className="font-bold text-slate-900">{lead.city}, {lead.state}</p>
                        <p className="text-slate-500 text-[11px] font-mono">{lead.phone || 'No phone listed'}</p>
                      </td>

                      {/* Interactive Manual Category Selector Dropdown */}
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

                      {/* Pipeline Status */}
                      <td className="py-3 px-4">
                        <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                          {lead.status}
                        </span>
                      </td>

                      {/* 1-Click Quick Assign Dropdown */}
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

                      {/* Action View & Delete */}
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
                            title="Delete useless lead"
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
