'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Phone,
  MessageSquare,
  Star,
  MapPin,
  ExternalLink,
  Globe,
  Tag,
  Search,
  Building,
  Trash2,
  Flame,
  Zap,
  Snowflake,
} from 'lucide-react';

interface LeadDetailDrawerProps {
  lead: any;
  onClose: () => void;
  onUpdate: () => void;
}

export function LeadDetailDrawer({ lead, onClose, onUpdate }: LeadDetailDrawerProps) {
  const [status, setStatus] = useState(lead?.status || 'New');
  const [leadTemperature, setLeadTemperature] = useState<'HOT' | 'WARM' | 'COLD'>(lead?.leadTemperature || 'WARM');
  const [assignedToId, setAssignedToId] = useState(lead?.assignedToId || '');
  const [noteText, setNoteText] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTime, setFollowUpTime] = useState('10:00');
  const [followUpReason, setFollowUpReason] = useState('POS Demo Call');
  const [activeTab, setActiveTab] = useState<'details' | 'timeline' | 'followup'>('details');

  const [fosList, setFosList] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!lead) return;
    setStatus(lead.status || 'New');
    setLeadTemperature(lead.leadTemperature || 'WARM');
    setAssignedToId(lead.assignedToId || '');

    fetch('/api/fos/performance')
      .then((res) => res.json())
      .then((data) => setFosList(data.fosPerformance || []))
      .catch(() => {});

    fetch(`/api/leads/${lead.id}/activity`)
      .then((res) => res.json())
      .then((data) => setActivities(data.activities || []))
      .catch(() => {});
  }, [lead]);

  if (!lead) return null;

  const handleDeleteLead = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete lead "${lead.businessName}"?`)) return;
    setSaving(true);
    try {
      await fetch(`/api/leads/${lead.id}`, { method: 'DELETE' });
      onUpdate();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStatus = async () => {
    setSaving(true);
    try {
      await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, leadTemperature }),
      });

      if (noteText.trim()) {
        await fetch(`/api/leads/${lead.id}/activity`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'Note_Added',
            description: noteText.trim(),
          }),
        });
        setNoteText('');
      }

      onUpdate();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleAssignFos = async (newFosId: string) => {
    setSaving(true);
    try {
      await fetch(`/api/leads/${lead.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: newFosId, assignedToId: newFosId }),
      });
      setAssignedToId(newFosId);
      onUpdate();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleScheduleFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpDate) return;
    setSaving(true);
    try {
      await fetch('/api/followups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          userId: assignedToId || undefined,
          followUpDate,
          time: followUpTime,
          reason: followUpReason,
        }),
      });
      setFollowUpDate('');
      onUpdate();
      setActiveTab('timeline');
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const googleMapsUrl =
    lead.googleMapsUrl ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${lead.businessName}, ${lead.city}, ${lead.state}`
    )}`;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-lg bg-white text-slate-900 border-l border-slate-200 h-full flex flex-col shadow-2xl">
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                  leadTemperature === 'HOT'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : leadTemperature === 'WARM'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-sky-50 text-sky-700 border-sky-200'
                }`}
              >
                Score {lead.leadScore} • {leadTemperature}
              </span>
              <span className="text-xs text-slate-500 font-semibold">{lead.city}, {lead.state}</span>
            </div>
            <h2 className="font-heading font-black text-xl text-slate-900 mt-1 leading-tight">{lead.businessName}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-300 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Triggers Bar */}
        <div className="px-6 py-3 bg-white border-b border-slate-200 flex items-center justify-between gap-2">
          {lead.phone ? (
            <div className="flex items-center gap-2 flex-1">
              <a
                href={`tel:${lead.phone}`}
                className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call ({lead.phone})</span>
              </a>
              <a
                href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                  `Hello Sir, this is ApniBus representative regarding POS ticketing machines for ${lead.businessName}.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            </div>
          ) : (
            <span className="text-xs text-slate-400 italic flex-1">No direct phone listed</span>
          )}

          <button
            onClick={handleDeleteLead}
            disabled={saving}
            title="Delete this lead permanently"
            className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-black flex items-center gap-1 transition border border-rose-200"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>Delete</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 text-xs font-bold bg-slate-50">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 py-3 text-center border-b-2 transition ${
              activeTab === 'details' ? 'border-orange-500 text-orange-600 bg-white font-black' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Lead Details
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex-1 py-3 text-center border-b-2 transition ${
              activeTab === 'timeline' ? 'border-orange-500 text-orange-600 bg-white font-black' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Activity History
          </button>
          <button
            onClick={() => setActiveTab('followup')}
            className={`flex-1 py-3 text-center border-b-2 transition ${
              activeTab === 'followup' ? 'border-orange-500 text-orange-600 bg-white font-black' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Schedule Demo
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'details' && (
            <>
              {/* Team Priority Tagging Selector (HOT / WARM / COLD) */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <label className="text-xs font-black text-slate-900 uppercase tracking-wide block">
                  Team Priority Categorization (Define HOT / WARM / COLD)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setLeadTemperature('HOT')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition ${
                      leadTemperature === 'HOT'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-white text-rose-800 border-rose-200 hover:bg-rose-50'
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>🔥 HOT</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLeadTemperature('WARM')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition ${
                      leadTemperature === 'WARM'
                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                        : 'bg-white text-amber-800 border-amber-200 hover:bg-amber-50'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>⚡ WARM</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLeadTemperature('COLD')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition ${
                      leadTemperature === 'COLD'
                        ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                        : 'bg-white text-sky-800 border-sky-200 hover:bg-sky-50'
                    }`}
                  >
                    <Snowflake className="w-3.5 h-3.5" />
                    <span>❄️ COLD</span>
                  </button>
                </div>
              </div>

              {/* Google Places API Verified Info Card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5 font-heading">
                    <Building className="w-4 h-4 text-orange-600" />
                    <span>Google Places API Verified Business Info</span>
                  </h3>
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => {
                      try {
                        const stored = JSON.parse(localStorage.getItem('apnibus_visited_map_leads') || '[]');
                        if (!stored.includes(lead.id)) {
                          stored.push(lead.id);
                          localStorage.setItem('apnibus_visited_map_leads', JSON.stringify(stored));
                        }
                      } catch (e) {}
                    }}
                    className="text-[11px] font-black text-purple-700 hover:underline flex items-center gap-1 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200"
                  >
                    <span>View on Maps ↗</span>
                    <ExternalLink className="w-3 h-3 text-purple-600" />
                  </a>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-500 block font-bold uppercase">Google Rating</span>
                      <span className="font-black text-slate-900">
                        {lead.rating ? `⭐ ${lead.rating} / 5.0` : 'No rating yet'}
                      </span>
                      {lead.reviewCount && (
                        <span className="text-[10px] text-slate-500 block">({lead.reviewCount} reviews)</span>
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center gap-2">
                    <Search className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-500 block font-bold uppercase">Matched Keyword</span>
                      <span className="font-bold text-slate-900 text-[11px] truncate block max-w-[120px]">
                        {lead.searchKeyword || 'Intercity Bus'}
                      </span>
                    </div>
                  </div>
                </div>

                {lead.address && (
                  <div className="text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200 flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-slate-500 block font-bold uppercase">Google Formatted Address</span>
                      <span className="font-medium text-slate-900 leading-snug">{lead.address}</span>
                    </div>
                  </div>
                )}

                {lead.website && (
                  <div className="text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div className="truncate">
                      <span className="text-[10px] text-slate-500 block font-bold uppercase">Official Website</span>
                      <a href={lead.website} target="_blank" rel="noreferrer" className="font-bold text-blue-600 hover:underline truncate block">
                        {lead.website}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Sales Pipeline Status */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Sales Pipeline Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  <option value="New">New</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Interested">Interested</option>
                  <option value="Demo Scheduled">Demo Scheduled</option>
                  <option value="Demo Completed">Demo Completed</option>
                  <option value="Converted">Converted (POS Machine Sold!)</option>
                  <option value="Not Interested">Not Interested</option>
                  <option value="Lost">Lost</option>
                </select>
              </div>

              {/* Leader Assignment */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Assigned Leader</label>
                <select
                  value={assignedToId}
                  onChange={(e) => handleAssignFos(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500 font-extrabold"
                >
                  <option value="">⚪ Unassigned (Click to Assign Leader)</option>
                  {fosList.map((u) => (
                    <option key={u.id} value={u.id}>
                      👤 {u.name} ({u.empId || u.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Add Field Activity Note</label>
                <textarea
                  rows={3}
                  placeholder="Record customer discussion details, fleet size, machine requirement..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                onClick={handleSaveStatus}
                disabled={saving}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white font-black rounded-xl text-xs uppercase tracking-wider transition shadow-sm"
              >
                {saving ? 'Updating...' : 'Save Pipeline & Category Changes'}
              </button>
            </>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase">Activity History Logs</h3>
              {activities.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No activity recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {activities.map((act) => (
                    <div key={act.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                      <div className="flex justify-between items-center text-slate-500 text-[10px]">
                        <span className="font-bold text-orange-600">{act.type}</span>
                        <span>{new Date(act.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-800 mt-1">{act.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'followup' && (
            <form onSubmit={handleScheduleFollowUp} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Follow-up Date</label>
                <input
                  type="date"
                  required
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Follow-up Time</label>
                <input
                  type="time"
                  value={followUpTime}
                  onChange={(e) => setFollowUpTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Purpose / Reason</label>
                <input
                  type="text"
                  placeholder="POS Machine Demo / Contract Discussion"
                  value={followUpReason}
                  onChange={(e) => setFollowUpReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs uppercase tracking-wider transition shadow-sm"
              >
                {saving ? 'Scheduling...' : 'Schedule POS Follow-up'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
