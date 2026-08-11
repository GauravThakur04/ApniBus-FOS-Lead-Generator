import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface Stage {
  name: string;
  count: number;
  conversionRate?: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

interface SalesFunnelProps {
  funnelData: {
    newLeads: number;
    contacted: number;
    interested: number;
    demoScheduled: number;
    demoCompleted: number;
    converted: number;
  };
}

export function SalesFunnel({ funnelData }: SalesFunnelProps) {
  const totalPipeline =
    (funnelData.newLeads || 0) +
    (funnelData.contacted || 0) +
    (funnelData.interested || 0) +
    (funnelData.demoScheduled || 0) +
    (funnelData.demoCompleted || 0) +
    (funnelData.converted || 0);

  const getShareStr = (count: number) => {
    if (totalPipeline === 0) return '0.0%';
    return `${((count / totalPipeline) * 100).toFixed(1)}%`;
  };

  const overallConvRate = totalPipeline > 0 ? ((funnelData.converted / totalPipeline) * 100).toFixed(1) : '0.0';

  const stages: Stage[] = [
    {
      name: '1. New Leads',
      count: funnelData.newLeads || 0,
      conversionRate: getShareStr(funnelData.newLeads || 0),
      color: 'text-slate-800',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
    },
    {
      name: '2. Contacted',
      count: funnelData.contacted || 0,
      conversionRate: getShareStr(funnelData.contacted || 0),
      color: 'text-blue-700',
      bgColor: 'bg-blue-50/70',
      borderColor: 'border-blue-200',
    },
    {
      name: '3. Interested',
      count: funnelData.interested || 0,
      conversionRate: getShareStr(funnelData.interested || 0),
      color: 'text-purple-700',
      bgColor: 'bg-purple-50/70',
      borderColor: 'border-purple-200',
    },
    {
      name: '4. Demo Scheduled',
      count: funnelData.demoScheduled || 0,
      conversionRate: getShareStr(funnelData.demoScheduled || 0),
      color: 'text-amber-700',
      bgColor: 'bg-amber-50/70',
      borderColor: 'border-amber-200',
    },
    {
      name: '5. Demo Done',
      count: funnelData.demoCompleted || 0,
      conversionRate: getShareStr(funnelData.demoCompleted || 0),
      color: 'text-orange-700',
      bgColor: 'bg-orange-50/70',
      borderColor: 'border-orange-200',
    },
    {
      name: '6. Converted (POS)',
      count: funnelData.converted || 0,
      conversionRate: getShareStr(funnelData.converted || 0),
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50/80',
      borderColor: 'border-emerald-300',
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight font-heading flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-500" />
            <span>Intercity POS Sales Funnel</span>
          </h2>
          <p className="text-xs text-slate-500">Live conversion pipeline for Tier-3 &amp; Tier-4 bus operator ticketing machines</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-semibold">Overall Conversion Rate:</span>
          <span className="font-extrabold text-emerald-700 px-2.5 py-1 bg-emerald-50 rounded-full border border-emerald-200">
            {overallConvRate}%
          </span>
        </div>
      </div>

      {/* Funnel Stage Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        {stages.map((stage, idx) => (
          <div
            key={stage.name}
            className={`p-4 rounded-xl border ${stage.bgColor} ${stage.borderColor} flex flex-col justify-between relative transition hover:shadow-sm`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">{stage.name}</span>
                {idx < stages.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />}
              </div>
              <p className={`text-2xl font-black mt-2 font-heading ${stage.color}`}>{stage.count}</p>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-200/60 flex justify-between items-center text-[10px] font-semibold text-slate-500">
              <span>Pipeline Share:</span>
              <span className={stage.color}>{stage.conversionRate}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
