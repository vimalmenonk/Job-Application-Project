import { useState } from 'react';
import {
  History,
  Download,
  Search,
  ExternalLink
} from 'lucide-react';
import type { JobOpportunity } from '../types';

interface HistoryPageProps {
  jobs: JobOpportunity[];
  exportCsvUrl: string;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ jobs, exportCsvUrl }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');

  const filtered = jobs.filter((j) => {
    if (j.status === 'Pending') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.externalId.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (dateFilter !== 'ALL') {
      const date = new Date(j.createdAt);
      const today = new Date();
      if (dateFilter === 'TODAY' && date.toDateString() !== today.toDateString()) return false;
      if (dateFilter === 'WEEK' && (today.getTime() - date.getTime()) > 7 * 24 * 3600 * 1000) return false;
      if (dateFilter === 'MONTH' && (today.getTime() - date.getTime()) > 30 * 24 * 3600 * 1000) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl flex flex-wrap items-center justify-between gap-4 border-indigo-500/20">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <History className="w-4 h-4" /> Naukri Processed Application History
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Application & Search History</h1>
          <p className="text-sm text-slate-400">
            Archive of all previously processed, submitted, or skipped Naukri job opportunities
          </p>
        </div>

        {/* CSV Export Trigger */}
        <a
          href={exportCsvUrl}
          download
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all"
        >
          <Download className="w-4 h-4" /> Export CSV History
        </a>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search history by Title, Company, or Naukri Job ID..."
            className="w-full bg-slate-900 border border-slate-800 text-sm text-slate-200 pl-10 pr-4 py-2 rounded-xl outline-none focus:border-indigo-500"
          />
        </div>

        {/* Date Quick Filter */}
        <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          {[
            { id: 'ALL', label: 'All Time' },
            { id: 'TODAY', label: 'Today' },
            { id: 'WEEK', label: 'Past 7 Days' },
            { id: 'MONTH', label: 'Past 30 Days' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setDateFilter(f.id as any)}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                dateFilter === f.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* History Grid */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/90 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <th className="py-3.5 px-4">Naukri Job ID</th>
                <th className="py-3.5 px-4">Company</th>
                <th className="py-3.5 px-4">Title</th>
                <th className="py-3.5 px-4">Processed Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Notes</th>
                <th className="py-3.5 px-4 text-right">Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs font-medium text-slate-200">
              {filtered.map((j) => (
                <tr key={j.id} className="hover:bg-slate-900/60 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-indigo-400 text-[11px]">
                    {j.externalId}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-100">{j.company}</td>
                  <td className="py-3.5 px-4 text-slate-200">{j.title}</td>
                  <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                    {new Date(j.updatedAt || j.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                        j.status === 'Submitted'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : j.status === 'Reviewed'
                          ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                          : j.status === 'Skipped'
                          ? 'bg-slate-800 text-slate-400 border-slate-700'
                          : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                      }`}
                    >
                      {j.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 italic max-w-xs truncate">
                    {j.applicationNotes || 'Naukri application processed'}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <a
                      href={j.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 inline-flex rounded-lg bg-slate-900 hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 border border-slate-800"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-sm">
                    No processed Naukri application history found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
