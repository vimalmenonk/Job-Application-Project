import { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  X,
  Building2,
  MapPin,
  Calendar,
  Save,
  CheckCircle,
  IndianRupee
} from 'lucide-react';
import type { SearchProfile } from '../types';

interface JobSearchPageProps {
  profile: SearchProfile;
  onSaveProfile: (profile: SearchProfile) => Promise<void>;
}

export const JobSearchPage: React.FC<JobSearchPageProps> = ({ profile, onSaveProfile }) => {
  const [formData, setFormData] = useState<SearchProfile>(profile);
  const [keywordInput, setKeywordInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [excludeCompanyInput, setExcludeCompanyInput] = useState('');
  const [includeCompanyInput, setIncludeCompanyInput] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  const addKeyword = (word: string) => {
    if (!word.trim() || formData.keywords.includes(word.trim())) return;
    setFormData({ ...formData, keywords: [...formData.keywords, word.trim()] });
    setKeywordInput('');
  };

  const removeKeyword = (index: number) => {
    setFormData({
      ...formData,
      keywords: formData.keywords.filter((_, i) => i !== index)
    });
  };

  const addLocation = (loc: string) => {
    if (!loc.trim() || formData.locations.includes(loc.trim())) return;
    setFormData({ ...formData, locations: [...formData.locations, loc.trim()] });
    setLocationInput('');
  };

  const removeLocation = (index: number) => {
    setFormData({
      ...formData,
      locations: formData.locations.filter((_, i) => i !== index)
    });
  };

  const toggleJobType = (type: string) => {
    const exists = formData.jobTypes.includes(type);
    setFormData({
      ...formData,
      jobTypes: exists
        ? formData.jobTypes.filter(t => t !== type)
        : [...formData.jobTypes, type]
    });
  };

  const addExcludedCompany = () => {
    if (!excludeCompanyInput.trim()) return;
    setFormData({
      ...formData,
      excludedCompanies: [...formData.excludedCompanies, excludeCompanyInput.trim()]
    });
    setExcludeCompanyInput('');
  };

  const addIncludedCompany = () => {
    if (!includeCompanyInput.trim()) return;
    setFormData({
      ...formData,
      includedCompanies: [...formData.includedCompanies, includeCompanyInput.trim()]
    });
    setIncludeCompanyInput('');
  };

  const handleSave = async () => {
    setSaving(true);
    await onSaveProfile(formData);
    setSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const exampleKeywords = ['.NET Developer', 'ASP.NET Core', 'C#', 'Backend Developer', 'Software Engineer'];

  const formatInr = (val: number | null) => {
    if (!val) return '₹0';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="glass-panel p-6 rounded-2xl flex items-center justify-between border-indigo-500/20">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Search className="w-4 h-4" /> Naukri Targeting & Criteria Builder
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Job Search Configuration</h1>
          <p className="text-sm text-slate-400">
            Define your exact search parameters for Playwright Naukri browser automation
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all"
        >
          {savedSuccess ? <CheckCircle className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : savedSuccess ? 'Criteria Saved!' : 'Save Criteria'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Keywords Section */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Search className="w-4 h-4 text-indigo-400" /> Keywords (Multiple)
          </h2>
          <p className="text-xs text-slate-400">Search keywords to target on Naukri portal</p>

          <div className="flex gap-2">
            <input
              type="text"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addKeyword(keywordInput)}
              placeholder="e.g. .NET Developer, C#"
              className="flex-1 bg-slate-900 border border-slate-800 text-sm text-slate-200 px-3.5 py-2 rounded-xl focus:border-indigo-500 outline-none"
            />
            <button
              onClick={() => addKeyword(keywordInput)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-slate-400">Quick add:</span>
            {exampleKeywords.map((ex) => (
              <button
                key={ex}
                onClick={() => addKeyword(ex)}
                className="text-[11px] bg-slate-900/80 hover:bg-indigo-950 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-lg transition-colors"
              >
                + {ex}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {formData.keywords.map((word, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-medium flex items-center gap-2"
              >
                {word}
                <button onClick={() => removeKeyword(idx)} className="hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Locations */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-cyan-400" /> Locations & Remote Setup
          </h2>
          <p className="text-xs text-slate-400">Target Indian locations and remote setup</p>

          <div className="flex gap-2">
            <input
              type="text"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addLocation(locationInput)}
              placeholder="e.g. Kerala, Bangalore, Remote"
              className="flex-1 bg-slate-900 border border-slate-800 text-sm text-slate-200 px-3.5 py-2 rounded-xl focus:border-indigo-500 outline-none"
            />
            <button
              onClick={() => addLocation(locationInput)}
              className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {formData.locations.map((loc, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-medium flex items-center gap-2"
              >
                {loc}
                <button onClick={() => removeLocation(idx)} className="hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Experience & Salary (INR / LPA) Bounds */}
        <div className="glass-panel p-6 rounded-2xl space-y-5">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-emerald-400" /> Expected CTC & Salary Range (₹ INR / LPA)
          </h2>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span className="text-slate-300">Experience Bounds (Years)</span>
                <span className="text-emerald-400 font-semibold">{formData.minimumExperience} yrs - {formData.maximumExperience} yrs</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 mb-1 block">Minimum Experience</label>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={formData.minimumExperience}
                    onChange={(e) => setFormData({ ...formData, minimumExperience: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-800 text-sm text-slate-200 px-3 py-2 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 mb-1 block">Maximum Experience</label>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={formData.maximumExperience}
                    onChange={(e) => setFormData({ ...formData, maximumExperience: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-800 text-sm text-slate-200 px-3 py-2 rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Expected CTC (₹ LPA)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step={0.5}
                    value={formData.expectedCtcLpa || 12.0}
                    onChange={(e) => setFormData({ ...formData, expectedCtcLpa: parseFloat(e.target.value) || 0 })}
                    className="flex-1 bg-slate-900 border border-slate-800 text-sm text-slate-200 px-3.5 py-2 rounded-xl"
                  />
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-500/20">
                    {formData.expectedCtcLpa} LPA
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 mb-1 block">Minimum Expected Salary (₹)</label>
                  <input
                    type="number"
                    step={50000}
                    value={formData.minimumSalary || 300000}
                    onChange={(e) => setFormData({ ...formData, minimumSalary: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-800 text-sm text-slate-200 px-3 py-2 rounded-xl"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block font-mono">{formatInr(formData.minimumSalary)}</span>
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 mb-1 block">Maximum Expected Salary (₹)</label>
                  <input
                    type="number"
                    step={50000}
                    value={formData.maximumSalary || 1500000}
                    onChange={(e) => setFormData({ ...formData, maximumSalary: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-800 text-sm text-slate-200 px-3 py-2 rounded-xl"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block font-mono">{formatInr(formData.maximumSalary)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Posted Within & Job Types */}
        <div className="glass-panel p-6 rounded-2xl space-y-5">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-400" /> Posted Within & Job Type
          </h2>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-2">Posted Within</label>
            <div className="grid grid-cols-5 gap-1.5 p-1 bg-slate-900/80 rounded-xl border border-slate-800">
              {[1, 3, 7, 15, 30].map((days) => (
                <button
                  key={days}
                  onClick={() => setFormData({ ...formData, postedWithinDays: days })}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    formData.postedWithinDays === days
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {days === 1 ? 'Today' : `${days} Days`}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <label className="text-xs font-medium text-slate-300 block mb-2">Job Type Filter</label>
            <div className="grid grid-cols-2 gap-2">
              {['Full Time', 'Remote', 'Hybrid', 'Contract', 'Work From Home'].map((type) => {
                const checked = formData.jobTypes.includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => toggleJobType(type)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border text-left flex items-center justify-between transition-all ${
                      checked
                        ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-200'
                        : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {type}
                    {checked && <CheckCircle className="w-3.5 h-3.5 text-indigo-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Company Filters */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-purple-400" /> Company Filter Controls
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">Exclude Companies</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={excludeCompanyInput}
                  onChange={(e) => setExcludeCompanyInput(e.target.value)}
                  placeholder="e.g. Agency X, Spam Corp"
                  className="flex-1 bg-slate-900 border border-slate-800 text-sm text-slate-200 px-3 py-2 rounded-xl"
                />
                <button
                  onClick={addExcludedCompany}
                  className="px-3 py-2 bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white rounded-xl text-xs font-semibold"
                >
                  Exclude
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-2">
                {formData.excludedCompanies.map((c, i) => (
                  <span key={i} className="text-xs bg-rose-500/15 border border-rose-500/30 text-rose-300 px-2.5 py-1 rounded-lg">
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">Include Priority Companies</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={includeCompanyInput}
                  onChange={(e) => setIncludeCompanyInput(e.target.value)}
                  placeholder="e.g. TCS, Infosys, Microsoft India"
                  className="flex-1 bg-slate-900 border border-slate-800 text-sm text-slate-200 px-3 py-2 rounded-xl"
                />
                <button
                  onClick={addIncludedCompany}
                  className="px-3 py-2 bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-xl text-xs font-semibold"
                >
                  Include
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-2">
                {formData.includedCompanies.map((c, i) => (
                  <span key={i} className="text-xs bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-2.5 py-1 rounded-lg">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
