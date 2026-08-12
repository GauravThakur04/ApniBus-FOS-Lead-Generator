'use client';

import React, { useState, useEffect } from 'react';
import {
  Phone,
  PhoneCall,
  MessageSquare,
  MapPin,
  Star,
  UserCheck,
  CheckCircle2,
  Trash2,
  Filter,
  ExternalLink,
  Flame,
  Search,
  Eye,
  CheckSquare,
  Square,
} from 'lucide-react';
import { ALL_INDIAN_STATES } from '@/lib/constants';

interface Lead {
  id: string;
  businessName: string;
  phone?: string | null;
  city: string;
  state: string;
  rating?: number | null;
  reviewCount?: number | null;
  leadTemperature: 'HOT' | 'WARM' | 'COLD';
  status: string;
  googleMapsUrl?: string | null;
  searchKeyword?: string | null;
  leadScore?: number;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
    empId?: string;
  } | null;
  assignedToId?: string | null;
}

export type LeadItem = Lead;


interface LeadsTableProps {
  leads: Lead[];
  totalLeads?: number;
  onSelectLead: (lead: Lead) => void;
  onQuickStatusChange?: () => void;
}

export function LeadsTable({
  leads,
  totalLeads,
  onSelectLead,
  onQuickStatusChange,
}: LeadsTableProps) {
  const [leadsList, setLeadsList] = useState<Lead[]>(leads);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [visitedMapIds, setVisitedMapIds] = useState<string[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('ALL');
  const [assignedFilter, setAssignedFilter] = useState('ALL');
  const [tempFilter, setTempFilter] = useState('ALL');
  const [mapsVisitedFilter, setMapsVisitedFilter] = useState('ALL');
  const [leaders, setLeaders] = useState<any[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Sync props to state
  useEffect(() => {
    setLeadsList(leads);
  }, [leads]);

  // Load visited maps history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('visitedMapIds');
    if (saved) {
      try {
        setVisitedMapIds(JSON.parse(saved));
      } catch (e) {}
    }

    // Load leaders for assignment dropdown
    fetch('/api/seed')
      .then((res) => res.json())
      .then((data) => {
        if (data.leaders) setLeaders(data.leaders);
      })
      .catch(() => {});
  }, []);

  const markMapAsVisited = (leadId: string) => {
    if (!visitedMapIds.includes(leadId)) {
      const updated = [...visitedMapIds, leadId];
      setVisitedMapIds(updated);
      localStorage.setItem('visitedMapIds', JSON.stringify(updated));
    }
  };

  const formatDisplayBusinessName = (name: string, keyword?: string | null, city?: string) => {
    if (!name || name.startsWith('places/') || name.includes('ChIJ')) {
      return `${keyword || 'Intercity Bus Operator'} (${city || 'Local'} Bus Operator)`;
    }
    return name;
  };

  // Quick Lead Category / Priority Change (1-Tap)
  const handleCategoryChange = async (leadId: string, newCategory: 'HOT' | 'WARM' | 'COLD') => {
    setLeadsList((prev) =>
      prev.map((item) => (item.id === leadId ? { ...item, leadTemperature: newCategory } : item))
    );

    try {
      await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadTemperature: newCategory }),
      });
      setToastMessage(`Updated lead temperature to ${newCategory}!`);
      setTimeout(() => setToastMessage(''), 2500);
      if (onQuickStatusChange) onQuickStatusChange();
    } catch (err) {
      console.error('Error updating category:', err);
    }
  };

  // Quick Assignment Change (1-Tap)
  const handleAssignLeader = async (leadId: string, assignedToId: string | null) => {
    const selectedLeader = leaders.find((l) => l.id === assignedToId);
    setLeadsList((prev) =>
      prev.map((item) =>
        item.id === leadId
          ? { ...item, assignedToId, assignedTo: selectedLeader ? { id: selectedLeader.id, name: selectedLeader.name, email: selectedLeader.email } : null }
          : item
      )
    );

    try {
      await fetch(`/api/leads/${leadId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedToId }),
      });
      setToastMessage(selectedLeader ? `Assigned lead to ${selectedLeader.name}!` : 'Lead unassigned.');
      setTimeout(() => setToastMessage(''), 2500);
      if (onQuickStatusChange) onQuickStatusChange();
    } catch (err) {
      console.error('Error assigning lead:', err);
    }
  };

  // Single Lead Smooth Delete
  const handleDeleteSingleLead = async (leadId: string, leadName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete "${leadName}"?`)) return;

    // Optimistic UI Removal (Smooth, Zero-Glitch)
    setLeadsList((prev) => prev.filter((item) => item.id !== leadId));
    setSelectedLeadIds((prev) => prev.filter((id) => id !== leadId));
    setToastMessage(`Deleted "${leadName}"`);
    setTimeout(() => setToastMessage(''), 2500);

    try {
      await fetch(`/api/leads/${leadId}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Error deleting lead:', err);
    }
  };

  // Bulk Checkbox Toggles
  const toggleSelectLead = (id: string) => {
    if (selectedLeadIds.includes(id)) {
      setSelectedLeadIds(selectedLeadIds.filter((item) => item !== id));
    } else {
      setSelectedLeadIds([...selectedLeadIds, id]);
    }
  };

  const selectAllFilteredLeads = () => {
    const ids = filteredLeads.map((l) => l.id);
    setSelectedLeadIds(ids);
  };

  const clearSelectedLeads = () => {
    setSelectedLeadIds([]);
  };

  const handleBulkAssign = async (assignedToId: string) => {
    if (selectedLeadIds.length === 0) return;
    const selectedLeader = leaders.find((l) => l.id === assignedToId);
    
    // Optimistic assignment update
    setLeadsList((prev) =>
      prev.map((item) =>
        selectedLeadIds.includes(item.id)
          ? { ...item, assignedToId, assignedTo: selectedLeader ? { id: selectedLeader.id, name: selectedLeader.name, email: selectedLeader.email } : null }
          : item
      )
    );

    const idsToAssign = [...selectedLeadIds];
    setSelectedLeadIds([]);
    setToastMessage(`Assigned ${idsToAssign.length} leads to ${selectedLeader?.name || 'Leader'}`);
    setTimeout(() => setToastMessage(''), 2500);

    try {
      await fetch('/api/leads/bulk-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadIds: idsToAssign, assignedToId }),
      });
      if (onQuickStatusChange) onQuickStatusChange();
    } catch (err) {
      console.error(err);
    }
  };

  // Smooth Glitch-Free Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedLeadIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedLeadIds.length} selected leads?`)) return;

    const idsToDelete = [...selectedLeadIds];

    // Optimistic UI Removal (Smooth, Zero-Glitch)
    setLeadsList((prev) => prev.filter((item) => !idsToDelete.includes(item.id)));
    setSelectedLeadIds([]);
    setToastMessage(`Successfully deleted ${idsToDelete.length} leads!`);
    setTimeout(() => setToastMessage(''), 2500);

    try {
      await fetch('/api/leads/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadIds: idsToDelete }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Filter Logic
  const filteredLeads = leadsList.filter((lead) => {
    const displayTitle = formatDisplayBusinessName(lead.businessName, lead.searchKeyword, lead.city);
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      const matchName = displayTitle.toLowerCase().includes(q);
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
    const scoreA = a.leadTemperature === 'HOT' ? 3 : a.leadTemperature === 'WARM' ? 2 : 1;
    const scoreB = b.leadTemperature === 'HOT' ? 3 : b.leadTemperature === 'WARM' ? 2 : 1;
    return scoreB - scoreA;
  });

  return (
    <div className="space-y-4">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="p-3 bg-slate-900 text-white font-black text-xs rounded-xl shadow-lg flex items-center justify-between animate-fade-in border border-slate-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Bulk Action Bar */}
      {selectedLeadIds.length > 0 && (
        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-3 animate-fade-in border border-slate-800">
          <div className="flex items-center gap-3">
            <span className="text-xs font-black bg-orange-500 text-white px-2.5 py-1 rounded-lg">
              {selectedLeadIds.length} Selected
            </span>
            <button
              onClick={clearSelectedLeads}
              className="text-xs text-slate-400 hover:text-white font-bold underline"
            >
              Deselect All
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-xl transition flex items-center gap-1.5 shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete ({selectedLeadIds.length})</span>
            </button>

            {leaders.map((leader) => (
              <button
                key={leader.id}
                onClick={() => handleBulkAssign(leader.id)}
                disabled={isDeleting}
                className="px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-black rounded-xl transition shadow-xs"
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
            <option value="VISITED">💜 Maps Checked ({visitedMapIds.length})</option>
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

      {/* Table & Mobile Phone Cards Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* MOBILE SMARTPHONE CARD VIEW */}
        <div className="block md:hidden space-y-3 p-4 bg-slate-50">
          {sorted.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-bold text-xs">
              No bus operator leads match the selected filter.
            </div>
          ) : (
            sorted.map((lead) => {
              const isSelected = selectedLeadIds.includes(lead.id);
              const isMapVisited = visitedMapIds.includes(lead.id);
              const displayTitle = formatDisplayBusinessName(lead.businessName, lead.searchKeyword, lead.city);
              const googleMapsUrl =
                lead.googleMapsUrl ||
                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${displayTitle}, ${lead.city}, ${lead.state}`
                )}`;

              return (
                <div
                  key={lead.id}
                  className={`p-4 rounded-2xl border transition space-y-3 ${
                    isMapVisited
                      ? 'bg-purple-50/80 border-purple-300'
                      : isSelected
                      ? 'bg-orange-50/50 border-orange-300'
                      : 'bg-white border-slate-200 shadow-xs'
                  }`}
                >
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-2">
                    <div onClick={() => onSelectLead(lead)} className="cursor-pointer space-y-1">
                      <h3 className="font-heading font-black text-slate-900 text-sm leading-tight">
                        {displayTitle}
                      </h3>
                      <p className="text-xs font-bold text-slate-600">
                        📍 {lead.city}, {lead.state}
                      </p>
                    </div>

                    <button
                      onClick={(e) => handleDeleteSingleLead(lead.id, displayTitle, e)}
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-200 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Direct 1-Tap Action Buttons */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {lead.phone ? (
                      <a
                        href={`tel:${lead.phone}`}
                        className="py-2 px-3 bg-emerald-600 text-white rounded-xl font-black text-xs flex items-center justify-center gap-1 shadow-xs"
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
                        className="py-2 px-3 bg-emerald-500 text-white rounded-xl font-black text-xs flex items-center justify-center gap-1 shadow-xs"
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

                  {/* Quick Selectors */}
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
                      <option value="HOT">🔥 HOT Lead</option>
                      <option value="WARM">🟡 WARM Lead</option>
                      <option value="COLD">🔵 COLD Lead</option>
                    </select>

                    <select
                      value={lead.assignedToId || ''}
                      onChange={(e) => handleAssignLeader(lead.id, e.target.value || null)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none"
                    >
                      <option value="">⚪ Unassigned</option>
                      {leaders.map((l) => (
                        <option key={l.id} value={l.id}>
                          👤 {l.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* DESKTOP DATA TABLE VIEW */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-800 border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] tracking-wider text-slate-500 font-bold">
              <tr>
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={sorted.length > 0 && selectedLeadIds.length === sorted.length}
                    onChange={() =>
                      selectedLeadIds.length === sorted.length ? clearSelectedLeads() : selectAllFilteredLeads()
                    }
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
                  const displayTitle = formatDisplayBusinessName(lead.businessName, lead.searchKeyword, lead.city);

                  const googleMapsUrl =
                    lead.googleMapsUrl ||
                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${displayTitle}, ${lead.city}, ${lead.state}`
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
                            <span>{displayTitle}</span>
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
                              <MapPin className="w-3 h-3 text-blue-600" />
                              <span>{isMapVisited ? '✓ Visited Maps' : 'Check Google Maps'}</span>
                            </a>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900">
                            {lead.city}, <span className="text-slate-500 font-normal">{lead.state}</span>
                          </p>
                          {lead.phone ? (
                            <div className="flex items-center gap-2 font-mono text-xs text-emerald-700 font-bold">
                              <span>{lead.phone}</span>
                              <a href={`tel:${lead.phone}`} title="Call Now">
                                <PhoneCall className="w-3.5 h-3.5 text-emerald-600 hover:scale-110 transition" />
                              </a>
                              <a
                                href={`https://wa.me/91${lead.phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                title="WhatsApp"
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-emerald-500 hover:scale-110 transition" />
                              </a>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">No Phone</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <select
                          value={lead.leadTemperature}
                          onChange={(e) => handleCategoryChange(lead.id, e.target.value as any)}
                          className={`border rounded-xl px-2.5 py-1 text-xs font-black focus:outline-none ${
                            lead.leadTemperature === 'HOT'
                              ? 'bg-rose-50 border-rose-200 text-rose-700'
                              : lead.leadTemperature === 'WARM'
                              ? 'bg-amber-50 border-amber-200 text-amber-700'
                              : 'bg-sky-50 border-sky-200 text-sky-700'
                          }`}
                        >
                          <option value="HOT">🔥 HOT Lead</option>
                          <option value="WARM">🟡 WARM Lead</option>
                          <option value="COLD">🔵 COLD Lead</option>
                        </select>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {lead.status}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <select
                          value={lead.assignedToId || ''}
                          onChange={(e) => handleAssignLeader(lead.id, e.target.value || null)}
                          className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none"
                        >
                          <option value="">⚪ Unassigned</option>
                          {leaders.map((l) => (
                            <option key={l.id} value={l.id}>
                              👤 {l.name} ({l.empId})
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => handleDeleteSingleLead(lead.id, displayTitle, e)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete Lead"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
