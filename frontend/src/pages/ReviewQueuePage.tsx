import { useState } from 'react';
import {
  ListTodo,
  ExternalLink,
  CheckCircle2,
  Send,
  SkipForward,
  Search,
  Building2,
  MapPin,
  Eye,
  X
} from 'lucide-react';
import type { JobOpportunity, JobStatus } from '../types';

interface ReviewQueuePageProps {
  jobs: JobOpportunity[];
  onUpdateStatus: (id: string, status: JobStatus, notes?: string) => Promise<void>;
  onBulkUpdateStatus: (ids: string[], status: JobStatus) => Promise<void>;
}

export const ReviewQueuePage: React.FC<ReviewQueuePageProps> = ({
  jobs,
  onUpdateStatus,
  onBulkUpdateStatus
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('Pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobModal, setSelectedJobModal] = useState<JobOpportunity | null>(null);

  const filteredJobs = jobs.filter((job) => {
    if (statusFilter !== 'ALL' && job.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        job.title.toLowerCase().includes(q) ||
        job.company.toLowerCase().includes(q) ||
        job.location.toLowerCase().includes(q) ||
        job.skills.some((s) => s.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredJobs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredJobs.map((j) => j.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulk = async (status: JobStatus) => {
    if (selectedIds.length === 0) return;
    await onBulkUpdateStatus(selectedIds, status);
    setSelectedIds([]);
  };

  const formatInrSalary = (min: number | null, max: number | null) => {
    if (!min || !max) return 'As per Naukri standards';
    const minLpa = (min / 100000).toFixed(1);
    const maxLpa = (max / 100000).toFixed(1);
    return `₹${minLpa} - ₹${maxLpa} LPA`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="glass-panel p-6 rounded-2xl flex flex-wrap items-center justify-between gap-4 border-indigo-500/20">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <ListTodo className="w-4 h-4" /> Live Naukri Opportunity Pipeline
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Review Queue</h1>
          <p className="text-sm text-slate-400">
            Review real scraped Naukri postings, mark status, or submit applications cleanly
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          {['Pending', 'Reviewed', 'Submitted', 'Skipped', 'ALL'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                statusFilter === tab
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Controls & Search */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Naukri jobs by title, company, or skills..."
            className="w-full bg-slate-900 border border-slate-800 text-sm text-slate-200 pl-10 pr-4 py-2 rounded-xl focus:border-indigo-500 outline-none"
          />
        </div>

        {/* Batch Toolbar */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 bg-indigo-950/60 border border-indigo-500/30 px-3 py-1.5 rounded-xl text-xs">
            <span className="font-semibold text-indigo-200">{selectedIds.length} selected</span>
            <div className="h-4 w-px bg-indigo-500/30 mx-1" />
            <button
              onClick={() => handleBulk('Submitted')}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold flex items-center gap-1"
            >
              <Send className="w-3 h-3" /> Submit Selected
            </button>
            <button
              onClick={() => handleBulk('Skipped')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold flex items-center gap-1"
            >
              <SkipForward className="w-3 h-3" /> Skip Selected
            </button>
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/90 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <th className="py-3.5 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === filteredJobs.length}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-800 text-indigo-600 focus:ring-0"
                  />
                </th>
                <th className="py-3.5 px-4">Job Title & Company</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Salary (₹ LPA)</th>
                <th className="py-3.5 px-4">Exp</th>
                <th className="py-3.5 px-4">Posted Date</th>
                <th className="py-3.5 px-4">Skills</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs font-medium text-slate-200">
              {filteredJobs.map((job) => {
                const isSelected = selectedIds.includes(job.id);
                return (
                  <tr
                    key={job.id}
                    className={`hover:bg-slate-900/60 transition-colors ${
                      isSelected ? 'bg-indigo-950/20' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(job.id)}
                        className="rounded border-slate-800 text-indigo-600 focus:ring-0"
                      />
                    </td>

                    <td className="py-3.5 px-4">
                      <div>
                        <div className="font-bold text-slate-100 flex items-center gap-1.5">
                          {job.title}
                          {job.isRemote && (
                            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded border border-indigo-500/30">
                              Remote
                            </span>
                          )}
                        </div>
                        <div className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3" /> {job.company}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-300">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-cyan-400" /> {job.location}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-emerald-400">
                      {formatInrSalary(job.minimumSalary, job.maximumSalary)}
                    </td>

                    <td className="py-3.5 px-4 text-slate-300">{job.experienceYears} yrs</td>

                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {new Date(job.postedDate).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {job.skills.slice(0, 3).map((skill, i) => (
                          <span
                            key={i}
                            className="bg-slate-900 border border-slate-800 text-slate-300 text-[10px] px-1.5 py-0.5 rounded"
                          >
                            {skill}
                          </span>
                        ))}
                        {job.skills.length > 3 && (
                          <span className="text-[10px] text-slate-500">+{job.skills.length - 3}</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                          job.status === 'Submitted'
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : job.status === 'Reviewed'
                            ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                            : job.status === 'Skipped'
                            ? 'bg-slate-800 text-slate-400 border-slate-700'
                            : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedJobModal(job)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800"
                          title="Quick Preview"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onUpdateStatus(job.id, 'Reviewed')}
                          className="p-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/30"
                          title="Mark Reviewed"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onUpdateStatus(job.id, 'Submitted')}
                          className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30"
                          title="Submit Application"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onUpdateStatus(job.id, 'Skipped')}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800"
                          title="Skip Job"
                        >
                          <SkipForward className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredJobs.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 text-sm">
                    No jobs match the selected status filter. Click "Start Automation" on the Automation page to collect real Naukri jobs.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Preview Modal */}
      {selectedJobModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-2xl p-6 rounded-2xl space-y-5 border-indigo-500/30 relative">
            <button
              onClick={() => setSelectedJobModal(null)}
              className="absolute right-5 top-5 p-1 rounded-lg text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                Naukri ID: {selectedJobModal.externalId}
              </div>
              <h2 className="text-xl font-bold text-white mt-1">{selectedJobModal.title}</h2>
              <div className="text-sm text-slate-300 mt-1 flex items-center gap-3">
                <span>{selectedJobModal.company}</span> • <span>{selectedJobModal.location}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 block">Salary Range</span>
                <span className="font-semibold text-emerald-400">
                  {formatInrSalary(selectedJobModal.minimumSalary, selectedJobModal.maximumSalary)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Experience</span>
                <span className="font-semibold text-slate-200">{selectedJobModal.experienceYears} Years</span>
              </div>
              <div>
                <span className="text-slate-500 block">Employment Type</span>
                <span className="font-semibold text-indigo-300">{selectedJobModal.employmentType || 'Full Time'}</span>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Job Description</h3>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                {selectedJobModal.description}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Skills & Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {selectedJobModal.skills.map((s, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-300 text-xs font-medium border border-indigo-500/30">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <a
                href={selectedJobModal.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                Open Original Naukri Posting <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onUpdateStatus(selectedJobModal.id, 'Submitted');
                    setSelectedJobModal(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                >
                  <Send className="w-3.5 h-3.5" /> Submit Application
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
