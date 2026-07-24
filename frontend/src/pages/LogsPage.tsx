import { useState } from 'react';
import {
  Terminal,
  Trash2,
  Search,
  FileText
} from 'lucide-react';
import type { AutomationLog } from '../types';

interface LogsPageProps {
  logs: AutomationLog[];
  onClearLogs: () => void;
}

export const LogsPage: React.FC<LogsPageProps> = ({ logs, onClearLogs }) => {
  const [levelFilter, setLevelFilter] = useState<'ALL' | 'Info' | 'Warning' | 'Error'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<AutomationLog | null>(null);

  const filtered = logs.filter((log) => {
    if (levelFilter !== 'ALL' && log.level !== levelFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.message.toLowerCase().includes(q) ||
        log.category.toLowerCase().includes(q) ||
        (log.details && log.details.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl flex flex-wrap items-center justify-between gap-4 border-indigo-500/20">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Terminal className="w-4 h-4" /> Serilog Structured Telemetry
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Structured Logs Explorer</h1>
          <p className="text-sm text-slate-400">
            Real-time Serilog telemetry, browser automation actions, and error tracebacks
          </p>
        </div>

        <button
          onClick={onClearLogs}
          className="px-4 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-semibold flex items-center gap-2 transition-all"
        >
          <Trash2 className="w-4 h-4" /> Clear Log Archive
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search logs by message or category..."
            className="w-full bg-slate-900 border border-slate-800 text-sm text-slate-200 pl-10 pr-4 py-2 rounded-xl outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          {(['ALL', 'Info', 'Warning', 'Error'] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevelFilter(lvl)}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                levelFilter === lvl
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Structured Logs Grid */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono">
            <thead>
              <tr className="bg-slate-900/90 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 font-sans">
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Severity</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Message</th>
                <th className="py-3.5 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs font-medium">
              {filtered.map((log) => {
                const isError = log.level === 'Error';
                const isWarn = log.level === 'Warning';
                return (
                  <tr key={log.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase ${
                          isError
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : isWarn
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                        }`}
                      >
                        {log.level}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-300 font-semibold text-[11px]">
                      {log.category}
                    </td>

                    <td className={`py-3 px-4 ${isError ? 'text-rose-300' : isWarn ? 'text-amber-300' : 'text-slate-200'}`}>
                      {log.message}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {log.details ? (
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-indigo-400 text-[11px] font-sans font-semibold border border-slate-800"
                        >
                          View Payload
                        </button>
                      ) : (
                        <span className="text-slate-600 text-[11px] font-sans">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 text-sm font-sans">
                    No log events match the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payload Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-xl p-6 rounded-2xl space-y-4 border-indigo-500/30">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" /> Log Payload Inspector
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-xs font-semibold text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="text-slate-400">Timestamp: {new Date(selectedLog.timestamp).toLocaleString()}</div>
              <div className="text-slate-400">Message: <span className="text-white font-semibold">{selectedLog.message}</span></div>
            </div>

            <pre className="bg-slate-950 p-4 rounded-xl font-mono text-xs text-indigo-300 border border-slate-800 overflow-x-auto">
              {selectedLog.details}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
