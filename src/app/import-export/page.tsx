'use client';

import React, { useState } from 'react';
import { Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle, FileText, HelpCircle, Check } from 'lucide-react';

export default function ImportExportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
      setResult(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select your CSV file to upload.');
      return;
    }

    setImporting(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/leads/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');

      setResult(data);
      setFile(null);
    } catch (err: any) {
      setError(err.message || 'Error importing CSV.');
    } finally {
      setImporting(false);
    }
  };

  const downloadSampleCsv = () => {
    const csvContent =
      'Operator Name,Company Name,Phone Number,Alternate No,State,District/ Location\n' +
      'Rakesh,Rakesh,8955943054,,RJ,Dungargarh\n' +
      'CHAUDHARY TOURIST BUS SERVICE,CHAUDHARY TOURIST BUS SERVICE,8948620311,,UP,Basti\n' +
      'leelaram meena | Lila Ram,leelaram meena | Lila Ram,6376469479,,RJ,Jaipur\n' +
      'Barkat bus service,Barkat bus service,8127392391,,UP,Lucknow\n' +
      'HR Bus Service,HR Bus Service,6378498831,,RJ,Barmer\n' +
      'Baba Bus Service,Baba Bus Service,8699200076,,PB,Sirhind\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'My_Bus_Leads_Upload.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="font-heading text-2xl font-black text-slate-900 tracking-tight">CSV Lead Import &amp; Database Export</h1>
          <p className="text-xs text-slate-600 mt-0.5 font-medium">
            Upload custom CSV/Excel lead files or export your entire lead database
          </p>
        </div>

        <button
          onClick={downloadSampleCsv}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-2 transition shadow-xs"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>📥 Download Matching CSV Sample</span>
        </button>
      </div>

      {/* Verified 100% Compatible Format Card */}
      <div className="bg-emerald-900 text-white p-5 rounded-2xl border border-emerald-800 shadow-md space-y-3">
        <div className="flex items-center gap-2 text-emerald-300 font-extrabold text-xs uppercase tracking-wider">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>✅ Your Sheet Format is 100% Supported &amp; Ready to Upload!</span>
        </div>

        <p className="text-xs text-emerald-100 font-medium leading-relaxed">
          Your exact CSV column layout (<strong>Operator Name</strong>, <strong>Company Name</strong>, <strong>Phone Number</strong>, <strong>Alternate No</strong>, <strong>State</strong> short codes like <code>RJ, UP, PB, JH</code>, and <strong>District/ Location</strong>) is <strong>100% fully supported</strong>.
        </p>

        {/* Column Match Table */}
        <div className="overflow-x-auto pt-1">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-emerald-950 text-emerald-300 font-bold border-b border-emerald-800">
                <th className="py-2 px-3">Your Excel Header</th>
                <th className="py-2 px-3">Mapped System Field</th>
                <th className="py-2 px-3">State Short Code Handling</th>
                <th className="py-2 px-3">Category After Upload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-800/60 text-emerald-50">
              <tr>
                <td className="py-2 px-3 font-bold text-amber-300">Operator Name / Company Name</td>
                <td className="py-2 px-3 font-mono text-[11px]">businessName</td>
                <td className="py-2 px-3 font-medium text-slate-300">N/A</td>
                <td className="py-2 px-3 font-extrabold text-amber-300" rowSpan={4}>
                  ⚪ Uncategorized (Your team defines HOT, WARM, COLD manually!)
                </td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-bold text-amber-300">Phone Number / Alternate No</td>
                <td className="py-2 px-3 font-mono text-[11px]">phone</td>
                <td className="py-2 px-3 font-medium text-slate-300">N/A</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-bold text-amber-300">State (RJ, UP, PB, JH, MP)</td>
                <td className="py-2 px-3 font-mono text-[11px]">state</td>
                <td className="py-2 px-3 font-bold text-emerald-300">Auto-converts RJ $\rightarrow$ Rajasthan, UP $\rightarrow$ Uttar Pradesh, PB $\rightarrow$ Punjab</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-bold text-amber-300">District/ Location</td>
                <td className="py-2 px-3 font-mono text-[11px]">city</td>
                <td className="py-2 px-3 font-medium text-slate-300">N/A</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CSV Upload Box */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Upload className="w-5 h-5 text-orange-600" />
            <h2 className="font-bold text-slate-900 text-base font-heading">Upload Your CSV Lead Sheet</h2>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleUpload} className="space-y-4">
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-orange-500 transition cursor-pointer bg-slate-50">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-file-input"
              />
              <label htmlFor="csv-file-input" className="cursor-pointer block space-y-2">
                <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700">
                  {file ? file.name : 'Click to select your CSV File'}
                </p>
                <p className="text-[10px] text-slate-400">Supports .csv files created from Excel or Google Sheets</p>
              </label>
            </div>

            <button
              type="submit"
              disabled={!file || importing}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white font-black rounded-xl text-xs uppercase tracking-wider transition shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {importing ? 'Importing Leads...' : 'Import Leads Now'}
            </button>
          </form>

          {result && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-800 font-bold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Import Completed Successfully!</span>
              </div>
              <p className="text-slate-700 font-medium">Total Rows Parsed: <strong>{result.totalParsed}</strong></p>
              <p className="text-emerald-700 font-bold">New Leads Added: <strong>{result.newInserted}</strong></p>
              <p className="text-amber-700 font-medium">Duplicates Skipped: <strong>{result.duplicatesSkipped}</strong></p>
            </div>
          )}
        </div>

        {/* CSV Export Box */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Download className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-slate-900 text-base font-heading">Export Database to Excel / CSV</h2>
            </div>
            <p className="text-xs text-slate-600 mt-3 font-medium leading-relaxed">
              Export your entire lead database including phone numbers, assigned sales leaders, and field activity history into a clean Excel-ready CSV format.
            </p>
          </div>

          <a
            href="/api/leads/export"
            download
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl text-xs uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4 text-orange-500" />
            <span>Export All Leads to CSV / Excel</span>
          </a>
        </div>
      </div>
    </div>
  );
}
