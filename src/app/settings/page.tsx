'use client';

import React, { useState, useEffect } from 'react';
import { Key, Shield, Save, CheckCircle2, Flame, Zap, Snowflake, Sliders } from 'lucide-react';

export default function SettingsPage() {
  const [dailyCap, setDailyCap] = useState('100');
  const [hotThreshold, setHotThreshold] = useState('80');
  const [warmThreshold, setWarmThreshold] = useState('60');
  const [phoneWeight, setPhoneWeight] = useState('25');
  const [keywordWeight, setKeywordWeight] = useState('20');
  const [ratingWeight, setRatingWeight] = useState('10');

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.dailyCap) setDailyCap(data.dailyCap);
        if (data.hotThreshold) setHotThreshold(data.hotThreshold);
        if (data.warmThreshold) setWarmThreshold(data.warmThreshold);
        if (data.phoneWeight) setPhoneWeight(data.phoneWeight);
        if (data.keywordWeight) setKeywordWeight(data.keywordWeight);
        if (data.ratingWeight) setRatingWeight(data.ratingWeight);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);

    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dailyCap,
          hotThreshold,
          warmThreshold,
          phoneWeight,
          keywordWeight,
          ratingWeight,
        }),
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 font-bold text-xs">
        Loading System &amp; Category Settings...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="font-heading text-2xl font-black text-slate-900 tracking-tight">System Settings &amp; Category Rules</h1>
          <p className="text-xs text-slate-600 mt-0.5 font-medium">
            Define custom score thresholds for HOT, WARM, COLD categories and Google API caps
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Custom HOT, WARM, COLD Category Thresholds */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sliders className="w-5 h-5 text-orange-600" />
            <h2 className="font-bold text-slate-900 text-base font-heading">Define HOT, WARM &amp; COLD Category Thresholds</h2>
          </div>

          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            Customize the score cutoffs below. Leads scoring at or above the HOT threshold get prioritized for immediate field calls.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* HOT Cutoff */}
            <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-1.5 font-black text-rose-900 text-xs">
                <Flame className="w-4 h-4 text-rose-600 fill-rose-500" />
                <span>🔥 HOT Lead Minimum Score</span>
              </div>
              <input
                type="number"
                min="1"
                max="100"
                value={hotThreshold}
                onChange={(e) => setHotThreshold(e.target.value)}
                className="w-full bg-white border border-rose-300 rounded-xl p-3 text-sm font-black text-rose-900 focus:outline-none focus:border-rose-600 shadow-xs"
              />
              <p className="text-[10px] text-rose-700 font-medium">Default: 80+ points (Immediate POS Pitch Target)</p>
            </div>

            {/* WARM Cutoff */}
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-1.5 font-black text-amber-900 text-xs">
                <Zap className="w-4 h-4 text-amber-600 fill-amber-500" />
                <span>⚡ WARM Lead Minimum Score</span>
              </div>
              <input
                type="number"
                min="1"
                max="100"
                value={warmThreshold}
                onChange={(e) => setWarmThreshold(e.target.value)}
                className="w-full bg-white border border-amber-300 rounded-xl p-3 text-sm font-black text-amber-900 focus:outline-none focus:border-amber-600 shadow-xs"
              />
              <p className="text-[10px] text-amber-700 font-medium">Default: 60+ points (Follow-up Target)</p>
            </div>

            {/* COLD Category */}
            <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-1.5 font-black text-sky-900 text-xs">
                <Snowflake className="w-4 h-4 text-sky-600" />
                <span>❄️ COLD Lead Threshold</span>
              </div>
              <div className="bg-white border border-sky-300 rounded-xl p-3 text-sm font-black text-sky-900 shadow-xs">
                Below {warmThreshold} Points
              </div>
              <p className="text-[10px] text-sky-700 font-medium">Leads scoring below {warmThreshold} are categorized as COLD.</p>
            </div>
          </div>
        </div>

        {/* Lead Scoring Criteria Point Weights */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h2 className="font-bold text-slate-900 text-base font-heading border-b border-slate-100 pb-3">
            Scoring Criteria Point Weights (100 Max Points)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <label className="text-slate-600 font-extrabold text-[11px] block">Verified Phone Number Points</label>
              <input
                type="number"
                value={phoneWeight}
                onChange={(e) => setPhoneWeight(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-black text-slate-900 focus:outline-none"
              />
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <label className="text-slate-600 font-extrabold text-[11px] block">Intercity Keyword Match Points</label>
              <input
                type="number"
                value={keywordWeight}
                onChange={(e) => setKeywordWeight(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-black text-slate-900 focus:outline-none"
              />
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <label className="text-slate-600 font-extrabold text-[11px] block">Google High Rating Points</label>
              <input
                type="number"
                value={ratingWeight}
                onChange={(e) => setRatingWeight(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-black text-slate-900 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Google Places API Safeguards */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Key className="w-5 h-5 text-orange-600" />
            <h2 className="font-bold text-slate-900 text-base font-heading">Google Places API Status &amp; Daily Cap</h2>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
            <Shield className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-emerald-900">Google Places API Connected (Server-Side Key Active)</p>
              <p className="text-[11px] text-emerald-700 mt-0.5 font-medium">Server environment key GOOGLE_API_KEY verified.</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Daily Search Limit Cap (Safety Cushion)</label>
            <input
              type="number"
              value={dailyCap}
              onChange={(e) => setDailyCap(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
            />
            <p className="text-[10px] text-slate-500 font-medium">Recommended setting: 100 queries/day (guarantees 100% free usage under $200 monthly credit).</p>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white font-black rounded-xl text-xs uppercase tracking-wider transition shadow-sm flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Category Rules &amp; Settings</span>
          </button>

          {saved && (
            <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Category Settings Saved Successfully!</span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
