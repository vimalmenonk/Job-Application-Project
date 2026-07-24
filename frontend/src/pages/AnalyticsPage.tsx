
import {
  BarChart3,
  TrendingUp,
  CheckCircle2,
  Clock,
  Building2,
  MapPin,
  Tag,
  Calendar
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import type { AnalyticsSummary } from '../types';

interface AnalyticsPageProps {
  analytics: AnalyticsSummary;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ analytics }) => {
  const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl flex items-center justify-between border-indigo-500/20">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <BarChart3 className="w-4 h-4" /> Telemetry & Conversion Analytics
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Performance & Insights</h1>
          <p className="text-sm text-slate-400">
            Conversion metrics, top hiring companies, regional job distribution, and keyword trends
          </p>
        </div>
      </div>

      {/* 3 Metric Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel glass-panel-hover p-6 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400">Applications Today</div>
            <div className="text-3xl font-extrabold text-white mt-2">{analytics.applicationsToday}</div>
            <div className="text-[11px] text-emerald-400 mt-1 font-medium flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> +15% vs yesterday
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel glass-panel-hover p-6 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400">Submission Success Rate</div>
            <div className="text-3xl font-extrabold text-emerald-400 mt-2">{analytics.successRate}%</div>
            <div className="text-[11px] text-slate-400 mt-1">Based on evaluated jobs</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel glass-panel-hover p-6 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400">Avg Time Per Submission</div>
            <div className="text-3xl font-extrabold text-cyan-400 mt-2">{analytics.avgTimePerSubmissionMinutes}m</div>
            <div className="text-[11px] text-cyan-300 mt-1">Playwright automated speed</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Top Companies & Top Locations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Companies */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-400" /> Top Hiring Companies
          </h2>
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.topCompanies} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={120} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }} />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Locations */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-cyan-400" /> Regional Distribution
          </h2>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.topLocations}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  paddingAngle={5}
                >
                  {analytics.topLocations.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Keywords & Activity Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Tag className="w-4 h-4 text-emerald-400" /> Top Keywords Demanded
          </h2>
          <div className="space-y-3 pt-2">
            {analytics.topKeywords.map((kw, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-200">
                  <span>{kw.name}</span>
                  <span className="text-emerald-400">{kw.count} roles ({kw.percentage}%)</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all"
                    style={{ width: `${Math.max(kw.percentage, 10)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly vs Monthly Trends */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-400" /> Weekly Activity Overview
          </h2>
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.weeklyActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }} />
                <Bar dataKey="found" fill="#6366f1" radius={[4, 4, 0, 0]} name="Jobs Found" />
                <Bar dataKey="submitted" fill="#10b981" radius={[4, 4, 0, 0]} name="Submitted" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
