'use client';

import React, { useState } from 'react';
import { Search, Plus, X, AlertTriangle, CheckCircle2, RefreshCw, Bus, CheckSquare, Square } from 'lucide-react';
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

  // High-converting bus search keywords
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
      setErrorMessage('Please select State, City, and at least 1 Bus Keyword.');
      return;
    }

    setErrorMessage('');
    setIsSearching(true);
    setSearchResult(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s safety timeout

    try {
      const res = await fetch('/api/leads/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          state: selectedState,
          city: targetCity,
          keywords: selectedKeywords,
        }),
      });

      clearTimeout(timeoutId);

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate leads');
      }

      setSearchResult(data);
      if (onSearchSuccess) {
        onSearchSuccess(data);
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        setErrorMessage('Request timeout. Google Places API took too long to respond. Please try again.');
      } else {
        setErrorMessage(err.message || 'Error occurred while searching Google Places API.');
      }
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="font-heading font-black text-xl text-slate-900 flex items-center gap-2">
          <Bus className="w-5 h-5 text-orange-500" />
          <span>Intercity Bus Lead Generator</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">
          Discover Stage Carriage, Seater Route &amp; Roadways bus operators using Google Places API
        </p>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2 font-medium">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Territory Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* State Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Target State</label>
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

      {/* Keywords Selection */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-xs font-black text-slate-900 uppercase tracking-wide block">
            Target Search Keywords ({selectedKeywords.length} Selected)
          </label>

          <div className="flex items-center gap-3 text-xs font-bold">
            <button
              type="button"
              onClick={selectAllKeywords}
              className="text-orange-600 hover:text-orange-700 flex items-center gap-1 font-extrabold"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Select All Keywords</span>
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={clearAllKeywords}
              className="text-slate-500 hover:text-slate-700 font-medium"
            >
              Clear All
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
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {isSelected ? <CheckSquare className="w-3.5 h-3.5 text-orange-400" /> : <Square className="w-3.5 h-3.5 text-slate-400" />}
                <span>{kw}</span>
              </button>
            );
          })}
        </div>

        {/* Custom Keyword Input */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="text"
            placeholder="Add custom bus search keyword..."
            value={customKeyword}
            onChange={(e) => setCustomKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomKeyword())}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500"
          />
          <button
            type="button"
            onClick={addCustomKeyword}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-1 transition"
          >
            <Plus className="w-3.5 h-3.5 text-orange-400" />
            <span>Add Keyword</span>
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="button"
        onClick={handleRunSearch}
        disabled={isSearching}
        className="w-full py-4 bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
      >
        {isSearching ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin text-white" />
            <span>Generating Bus Leads Now (Ultra-Fast Mode)...</span>
          </>
        ) : (
          <>
            <Search className="w-4 h-4 text-white" />
            <span>Generate Bus Leads Now ({selectedKeywords.length} Keywords Active)</span>
          </>
        )}
      </button>

      {/* Search Result Summary Card */}
      {searchResult && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-800 font-black text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Lead Generation Run Completed!</span>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-1 font-bold text-slate-700">
            <div className="bg-white p-2 rounded-xl border border-emerald-100 text-center">
              <span className="text-[10px] text-slate-400 uppercase block font-bold">Places Found</span>
              <span className="text-sm font-black text-slate-900 font-heading">{searchResult.resultsFound}</span>
            </div>
            <div className="bg-white p-2 rounded-xl border border-emerald-100 text-center">
              <span className="text-[10px] text-slate-400 uppercase block font-bold">New Bus Leads</span>
              <span className="text-sm font-black text-emerald-600 font-heading">{searchResult.newLeads}</span>
            </div>
            <div className="bg-white p-2 rounded-xl border border-emerald-100 text-center">
              <span className="text-[10px] text-slate-400 uppercase block font-bold">Duplicates</span>
              <span className="text-sm font-black text-amber-600 font-heading">{searchResult.duplicates}</span>
            </div>
            <div className="bg-white p-2 rounded-xl border border-emerald-100 text-center">
              <span className="text-[10px] text-slate-400 uppercase block font-bold">Non-Bus Filtered</span>
              <span className="text-sm font-black text-rose-600 font-heading">{searchResult.filteredOutNonBus || 0}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
