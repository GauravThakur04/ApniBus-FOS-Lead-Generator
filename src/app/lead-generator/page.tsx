'use client';

import React from 'react';
import { GeneratorForm } from '@/components/lead-generator/GeneratorForm';

export default function LeadGeneratorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Lead Generator</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Search bus operators by state, city, and keywords using server-side Google Places API (New)
        </p>
      </div>

      <GeneratorForm />
    </div>
  );
}
