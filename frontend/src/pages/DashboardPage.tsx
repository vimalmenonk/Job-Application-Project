import React from 'react';
import {
  Briefcase,
  Send,
  SkipForward,
  AlertTriangle,
  Clock,
  Activity,
  Key,
  ArrowUpRight,
  TrendingUp,
  UserCheck,
  FileCheck,
  Percent,
  Globe,
  MapPin,
  Mail,
  ShieldCheck,
  Monitor
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import type { DashboardStats, ActivityPoint, JobOpportunity } from '../types';

interface DashboardPageProps {
  stats: DashboardStats;
  activity: ActivityPoint[];
  recentJobs: JobOpportunity[];
  onNavigateTab: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  stats,
  activity,
  recentJobs,
  onNavigateTab
}) => {
  const cards = [
    {
      title: 'Chrome Connected',
      value: stats.chromeConnected,
      icon: Monitor,
      color: stats.chromeConnected.includes('Connected') ? 'from-emerald-500 to-teal-600' : 'from-rose-500 to-red-600',
      textColor: stats.chromeConnected.includes('Connected') ? 'text-emerald-400' : 'text-rose-400',
      badge: 'Chrome Session'
    },
    {
      title: 'Browser Profile',
      value: stats.browserProfile,
      icon: Globe,
      color: 'from-indigo-500 to-blue-600',
      textColor: 'text-indigo-300',
      badge: 'Existing Profile'
    },
    {
      title: 'Current Account Name',
      value: stats.currentAccountName,
      icon: UserCheck,
      color: 'from-cyan-500 to-teal-600',
      textColor: 'text-cyan-300',
      badge: 'Naukri Verified'
    },
    {
      title: 'Current Email',
      value: stats.currentEmail,
      icon: Mail,
      color: 'from-blue-500 to-indigo-600',
      textColor: 'text-blue-300',
      badge: 'Account Email'
    },
    {
      title: 'Profile Completion',
      value: stats.profileCompletion,
      icon: Percent,
      color: stats.profileCompletion === '100%' ? 'from-emerald-500 to-green-600' : 'from-amber-500 to-orange-600',
      textColor: stats.profileCompletion === '100%' ? 'text-emerald-300' : 'text-amber-300',
      badge: 'Real Account Read'
    },
    {
      title: 'Resume Last Updated',
      value: stats.resumeLastUpdated,
      icon: FileCheck,
      color: 'from-teal-500 to-emerald-600',
      textColor: 'text-teal-300',
      badge: 'Naukri Resume'
    },
    {
      title: 'Applications Today',
      value: stats.applicationsToday,
      icon: Send,
      color: 'from-emerald-500 to-green-600',
      textColor: 'text-emerald-400',
      badge: 'Live Submissions'
    },
    {
      title: 'Jobs Found',
      value: stats.jobsFound,
      icon: Briefcase,
      color: 'from-indigo-500 to-blue-600',
      textColor: 'text-indigo-400',
      badge: 'Real Naukri Scrape'
    },
    {
      title: 'Jobs Submitted',
      value: stats.jobsSubmitted,
      icon: Send,
      color: 'from-cyan-500 to-teal-600',
      textColor: 'text-cyan-400',
      badge: 'Completed Submissions'
    },
    {
      title: 'Jobs Skipped',
      value: stats.jobsSkipped,
      icon: SkipForward,
      color: 'from-slate-500 to-slate-700',
      textColor: 'text-slate-400',
      badge: 'Criteria Excluded'
    },
    {
      title: 'Failed Attempts',
      value: stats.failedAttempts,
      icon: AlertTriangle,
      color: 'from-rose-500 to-red-600',
      textColor: 'text-rose-400',
      badge: 'Retry Ready'
    },
    {
      title: 'Pending Review',
      value: stats.pendingReview,
      icon: Clock,
      color: 'from-amber-500 to-orange-600',
      textColor: 'text-amber-400',
      badge: 'Action Required'
    },
    {
      title: 'Automation Status',
      value: stats.automationStatus,
      icon: Activity,
      color: 'from-purple-500 to-indigo-600',
      textColor: 'text-purple-300',
      badge: 'Playwright Worker'
    },
    {
      title: 'Current Keyword',
      value: stats.currentKeyword,
      icon: Key,
      color: 'from-cyan-500 to-blue-600',
      textColor: 'text-cyan-300',
      badge: 'Active Target'
    },
    {
      title: 'Current Location Filter',
      value: stats.currentLocationFilter,
      icon: MapPin,
      color: 'from-teal-500 to-cyan-600',
      textColor: 'text-teal-300',
      badge: 'Location Search'
    }
  ];

  const isConnected = stats.chromeConnected.includes('Connected');

  return (
    <div className="space-y-6">
      {/* Real Naukri Account Banner */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden space-y-4 border-indigo-500/30">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-indigo-500/20">
              NK
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-white tracking-tight">
                  ✓ Logged in as: {stats.currentAccountName}
                </h1>
                <span
                  className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${
                    isConnected
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  ● {stats.chromeConnected}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Profile Path: {stats.browserProfile} • Last Scan: {stats.lastScanTime}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigateTab('search')}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-colors"
            >
              Configure Search
            </button>
            <button
              onClick={() => onNavigateTab('automation')}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-1.5"
            >
              Start Automation <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Profile Details Top Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-800/80">
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <div>
                <span className="text-[11px] text-slate-400 block">Naukri Account Name</span>
                <span className="text-xs font-bold text-white">{stats.currentAccountName}</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-[11px] text-slate-400 block">Resume Last Updated</span>
                <span className="text-xs font-bold text-emerald-300">{stats.resumeLastUpdated}</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-cyan-400" /> Real Profile Completion
              </span>
              <span className="font-bold text-cyan-300">{stats.profileCompletion}</span>
            </div>
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full rounded-full transition-all"
                style={{ width: stats.profileCompletion.includes('%') ? stats.profileCompletion : '100%' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Display Grid of 15 Live Telemetry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="glass-panel glass-panel-hover p-4 rounded-2xl flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-400 truncate pr-1">{card.title}</span>
                <div className={`p-2 rounded-xl bg-gradient-to-br ${card.color} text-white shadow-md flex-shrink-0`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <div className={`text-base font-extrabold tracking-tight ${card.textColor} truncate max-w-[140px]`}>
                  {card.value}
                </div>
                <span className="text-[10px] font-medium text-slate-400 bg-slate-900/60 px-1.5 py-0.5 rounded-full border border-slate-800 flex-shrink-0">
                  {card.badge}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Activity Chart & Queue Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-400" /> Naukri Discovery & Application Telemetry
              </h2>
              <p className="text-xs text-slate-400">Daily breakdown of real jobs found on Naukri vs submitted</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5 text-indigo-400">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Naukri Jobs Found
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Submitted
              </div>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorFound" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSubmitted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '12px',
                    color: '#f8fafc'
                  }}
                />
                <Area type="monotone" dataKey="found" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorFound)" />
                <Area type="monotone" dataKey="submitted" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorSubmitted)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Review Activity Queue */}
        <div className="glass-panel p-6 rounded-2xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">Pending Naukri Queue</h2>
              <button
                onClick={() => onNavigateTab('queue')}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
              >
                View All ({stats.pendingReview})
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1">Recently collected live Naukri jobs waiting for review</p>

            <div className="mt-4 space-y-3">
              {recentJobs.slice(0, 4).map((job) => (
                <div key={job.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/30 transition-all flex items-center justify-between">
                  <div className="space-y-0.5 truncate pr-2">
                    <div className="text-xs font-semibold text-slate-100 truncate">{job.title}</div>
                    <div className="text-[11px] text-slate-400">{job.company} • {job.location}</div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                    {job.minimumSalary && job.maximumSalary
                      ? `₹${(job.minimumSalary / 100000).toFixed(1)}-${(job.maximumSalary / 100000).toFixed(1)} LPA`
                      : 'Naukri Role'}
                  </span>
                </div>
              ))}
              {recentJobs.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-500">
                  No jobs currently in queue. Click "Start Automation" to collect matching Naukri postings.
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('queue')}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-800 transition-colors"
          >
            Review Pipeline Jobs
          </button>
        </div>
      </div>
    </div>
  );
};
