'use client';

import React, { useState } from 'react';
import { Search, Plus, X, AlertTriangle, CheckCircle2, RefreshCw, Bus, Sparkles, Flame, ShieldAlert, CheckSquare, Square } from 'lucide-react';
import { ALL_INDIAN_STATES, NON_SLEEPER_SEARCH_KEYWORDS } from '@/lib/constants';

interface StateCityData {
  [state: string]: string[];
}

const MASTER_TERRITORIES: StateCityData = {
  'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Pathankot', 'Muktsar Sahib', 'Mansa'],
  'Haryana': ['Gurgaon', 'Gurugram', 'Rohtak', 'Sirsa', 'Hisar', 'Faridabad', 'Panipat', 'Karnal', 'Ambala'],
  'Himachal Pradesh': ['Shimla', 'Dharamshala', 'Solan', 'Mandi', 'Kangra', 'Una', 'Chamba'],
  'Uttarakhand': ['Dehradun', 'Haridwar', 'Rishikesh', 'Roorkee', 'Haldwani', 'Nainital'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner', 'Barmer', 'Hanumangarh', 'Karauli', 'Bharatpur', 'Alwar', 'Sawai Madhopur', 'Jalore'],
  'Delhi': ['Delhi', 'New Delhi', 'North Delhi', 'South Delhi', 'West Delhi', 'East Delhi', 'Dwarka'],
  'Uttar Pradesh': ['Greater Noida', 'Noida', 'Agra', 'Lucknow', 'Kanpur', 'Ghaziabad', 'Meerut', 'Varanasi', 'Prayagraj'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Betul', 'Kurawar', 'Gwalior', 'Jabalpur', 'Ujjain'],
  'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg', 'Bemetara', 'KCG'],
  'Bihar': ['Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur', 'Darbhanga', 'Purnia'],
  'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Hazaribagh'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane', 'Aurangabad', 'Solapur', 'Kolhapur'],
  'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Sambalpur', 'Puri'],
  'Karnataka': ['Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem'],
  'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar'],
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool'],
  'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat'],
  'Jammu and Kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Udhampur'],
};

interface GeneratorFormProps {
  onSearchSuccess?: (result: any) => void;
}

export function GeneratorForm({ onSearchSuccess }: GeneratorFormProps) {
  const [selectedState, setSelectedState] = useState<string>('Punjab');
  const [selectedCity, setSelectedCity] = useState<string>('Ludhiana');
  const [customCity, setCustomCity] = useState('');
  const [useCustomCity, setUseCustomCity] = useState(false);

  // All 10 High-converting non-sleeper keywords pre-selected by default
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([...NON_SLEEPER_SEARCH_KEYWORDS]);
  const [customKeyword, setCustomKeyword] = useState('');

  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleStateChange = (state: string) => {
    setSelectedState(state);
    const cities = MASTER_TERRITORIES[state] || [];
    if (cities.length > 0) {
      setSelectedCity(cities[0]);
      setUseCustomCity(false);
    } else {
      setUseCustomCity(true);
      setCustomCity('');
    }
  };

  const toggleKeyword = (kw: string) => {
    if (selectedKeywords.includes(kw)) {
      setSelectedKeywords(selectedKeywords.filter((k) => k !== kw));
    } else {
      setSelectedKeywords([...selectedKeywords, kw]);
    }
  };

  const selectAllKeywords = () => {
    setSelectedKeywords([...NON_SLEEPER_SEARCH_KEYWORDS]);
  };

  const clearAllKeywords = () => {
    setSelectedKeywords([]);
  };

  const addCustomKeyword = () => {
    if (customKeyword.trim() && !selectedKeywords.includes(customKeyword.trim())) {
      setSelectedKeywords([...selectedKeywords, customKeyword.trim()]);
      setCustomKeyword('');
    }
  };

  const handleRunSearch = async () => {
    const targetCity = useCustomCity ? customCity.trim() : selectedCity;
    if (!selectedState || !targetCity || selectedKeywords.length === 0) {
      setErrorMessage('Please select State, City, and at least 1 Non-Sleeper Bus Keyword.');
      return;
    }

    setErrorMessage('');
    setIsSearching(true);
    setSearchResult(null);

    try {
      const res = await fetch('/api/leads/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: selectedState,
          city: targetCity,
          keywords: selectedKeywords,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate leads');
      }

      setSearchResult(data);
      if (onSearchSuccess) onSearchSuccess(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during search.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
        <div>
          <h2 className="font-heading font-black text-xl text-slate-900 flex items-center gap-2">
            <Bus className="w-5 h-5 text-orange-500" />
            <span>Non-Sleeper Bus Lead Generator (ApniBus POS Target)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Discover Stage Carriage, Seater Route &amp; Roadways bus operators using Google Places API
          </p>
        </div>
        <span className="text-xs font-black bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
          Targeting Non-Sleeper Seater Buses Only
        </span>
      </div>

      <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs flex items-center gap-2 text-amber-900 font-medium">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
        <span>
          <strong>ApniBus POS Target Rule:</strong> Sleeper buses rely on online OTAs (redBus). Non-sleeper/stage carriage route buses are heavily prioritized (+25 score boost) while sleeper buses are penalized (-35 points).
        </span>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2 font-medium">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Territory Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* State Selection (ALL 28 States & 8 UTs) */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Target State (All Indian States &amp; UTs)</label>
          <select
            value={selectedState}
            onChange={(e) => handleStateChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
          >
            {ALL_INDIAN_STATES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        {/* City Selection */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Target City</label>
            <button
              type="button"
              onClick={() => setUseCustomCity(!useCustomCity)}
              className="text-[10px] text-blue-600 hover:underline font-bold"
            >
              {useCustomCity ? 'Choose from List' : '+ Enter Custom City'}
            </button>
          </div>

          {useCustomCity || !(MASTER_TERRITORIES[selectedState] && MASTER_TERRITORIES[selectedState].length > 0) ? (
            <input
              type="text"
              placeholder="Enter city name (e.g. Ludhiana, Karnal, Udaipur)..."
              value={customCity}
              onChange={(e) => setCustomCity(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
            />
          ) : (
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
            >
              {(MASTER_TERRITORIES[selectedState] || []).map((ct) => (
                <option key={ct} value={ct}>
                  {ct}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Keywords Selection (High-Intent Non-Sleeper) */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-xs font-black text-slate-900 uppercase tracking-wide block">
            Target Non-Sleeper Keywords ({selectedKeywords.length} Selected)
          </label>

          <div className="flex items-center gap-3 text-xs font-bold">
            <button
              type="button"
              onClick={selectAllKeywords}
              className="text-blue-600 hover:underline flex items-center gap-1"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Select All High-Intent Keywords</span>
            </button>
            <button
              type="button"
              onClick={clearAllKeywords}
              className="text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Keyword Pills */}
        <div className="flex flex-wrap gap-2">
          {NON_SLEEPER_SEARCH_KEYWORDS.map((kw) => {
            const isSelected = selectedKeywords.includes(kw);
            return (
              <button
                key={kw}
                type="button"
                onClick={() => toggleKeyword(kw)}
                className={`px-3 py-2 rounded-xl text-xs font-extrabold transition border flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{kw}</span>
                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-200" />}
              </button>
            );
          })}
        </div>

        {/* Custom Keyword Input */}
        <div className="flex gap-2 pt-1">
          <input
            type="text"
            placeholder="Add custom non-sleeper keyword (e.g. ordinary bus stand)..."
            value={customKeyword}
            onChange={(e) => setCustomKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomKeyword())}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
          <button
            type="button"
            onClick={addCustomKeyword}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-200"
          >
            Add Keyword
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="button"
        onClick={handleRunSearch}
        disabled={isSearching}
        className="w-full py-4 bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white font-black rounded-xl text-sm uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2"
      >
        {isSearching ? (
          <>
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Searching Google Places across {selectedKeywords.length} Non-Sleeper Keywords...</span>
          </>
        ) : (
          <>
            <Search className="w-5 h-5" />
            <span>Generate Non-Sleeper Bus Leads Now ({selectedKeywords.length} Keywords Active)</span>
          </>
        )}
      </button>

      {/* Result Alert Box */}
      {searchResult && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Search Completed Successfully!</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
            <div className="bg-white p-2 rounded-xl border border-emerald-100">
              <span className="text-slate-500 block text-[10px]">Total Found</span>
              <span className="font-extrabold text-slate-900 text-base">{searchResult.summary.totalFound}</span>
            </div>
            <div className="bg-white p-2 rounded-xl border border-emerald-100">
              <span className="text-slate-500 block text-[10px]">New Leads</span>
              <span className="font-extrabold text-emerald-600 text-base">{searchResult.summary.newLeadsCount}</span>
            </div>
            <div className="bg-white p-2 rounded-xl border border-emerald-100">
              <span className="text-slate-500 block text-[10px]">Duplicates Skipped</span>
              <span className="font-extrabold text-amber-600 text-base">{searchResult.summary.duplicatesSkipped}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
