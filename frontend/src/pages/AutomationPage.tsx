import { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Play,
  Pause,
  Square,
  Sliders,
  Terminal,
  Trash2,
  Copy,
  Check
} from 'lucide-react';
import type { AutomationConfig, AutomationLog, RunnerState, ChromeProfileInfo } from '../types';
import { api } from '../services/api';

interface AutomationPageProps {
  runnerConfig: AutomationConfig;
  onSaveRunnerConfig: (config: AutomationConfig) => Promise<void>;
  runnerState: RunnerState;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  logs: AutomationLog[];
  onClearLogs: () => void;
}

export const AutomationPage: React.FC<AutomationPageProps> = ({
  runnerConfig,
  onSaveRunnerConfig,
  runnerState,
  onStart,
  onPause,
  onResume,
  onStop,
  logs,
  onClearLogs
}) => {
  const [config, setConfig] = useState<AutomationConfig>(runnerConfig);
  const [chromeProfiles, setChromeProfiles] = useState<ChromeProfileInfo[]>([]);
  const [logFilter, setLogFilter] = useState<'ALL' | 'Info' | 'Warning' | 'Error'>('ALL');
  const [logSearch, setLogSearch] = useState('');
  const [autoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getChromeProfiles().then((profiles) => {
      if (profiles && profiles.length > 0) {
        setChromeProfiles(profiles);
      }
    });
  }, []);

  useEffect(() => {
    setConfig(runnerConfig);
  }, [runnerConfig]);

  useEffect(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const handleConfigChange = async (updated: AutomationConfig) => {
    setConfig(updated);
    await onSaveRunnerConfig(updated);
  };

  const filteredLogs = logs.filter(log => {
    if (logFilter !== 'ALL' && log.level !== logFilter) return false;
    if (logSearch.trim()) {
      const q = logSearch.toLowerCase();
      return log.message.toLowerCase().includes(q) || log.category.toLowerCase().includes(q);
    }
    return true;
  });

  const copyLogs = () => {
    const text = logs.map(l => `[${new Date(l.timestamp).toLocaleTimeString()}] [${l.level}] [${l.category}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Runner Status Control Header */}
      <div className="glass-panel p-6 rounded-2xl flex flex-wrap items-center justify-between gap-4 border-indigo-500/20">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Bot className="w-4 h-4" /> Microsoft Playwright Automation Engine
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            Automation Control Panel
            <span
              className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider border ${
                runnerState === 'Running'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                  : runnerState === 'Paused'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              ● {runnerState}
            </span>
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {runnerState === 'Idle' || runnerState === 'Stopped' || runnerState === 'Completed' || runnerState === 'Failed' ? (
            <button
              onClick={onStart}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition-all transform hover:scale-105"
            >
              <Play className="w-4 h-4 fill-current" /> Start Engine
            </button>
          ) : runnerState === 'Running' ? (
            <button
              onClick={onPause}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white font-bold text-sm shadow-lg shadow-amber-500/25 flex items-center gap-2 transition-all"
            >
              <Pause className="w-4 h-4 fill-current" /> Pause Execution
            </button>
          ) : (
            <button
              onClick={onResume}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition-all"
            >
              <Play className="w-4 h-4 fill-current" /> Resume Execution
            </button>
          )}

          {(runnerState === 'Running' || runnerState === 'Paused') && (
            <button
              onClick={onStop}
              className="px-5 py-3 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 font-bold text-sm flex items-center gap-2 transition-all"
            >
              <Square className="w-4 h-4 fill-current" /> Stop
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Automation Configuration Column */}
        <div className="glass-panel p-6 rounded-2xl space-y-6">
          <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sliders className="w-4 h-4 text-indigo-400" /> Engine Parameters
          </h2>

          {/* Max Jobs Limit */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
              <span>Maximum jobs to process</span>
              <span className="text-indigo-400">{config.maxJobsToProcess} jobs</span>
            </div>
            <input
              type="range"
              min={1}
              max={50}
              value={config.maxJobsToProcess}
              onChange={(e) => handleConfigChange({ ...config, maxJobsToProcess: parseInt(e.target.value) })}
              className="w-full accent-indigo-500 bg-slate-900 rounded-lg cursor-pointer"
            />
            <span className="text-[11px] text-slate-500">Default = 5</span>
          </div>

          {/* Action Delay */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
              <span>Delay between browser actions</span>
              <span className="text-indigo-400">{config.delayBetweenActionsSeconds}s</span>
            </div>
            <input
              type="range"
              min={1}
              max={30}
              value={config.delayBetweenActionsSeconds}
              onChange={(e) => handleConfigChange({ ...config, delayBetweenActionsSeconds: parseInt(e.target.value) })}
              className="w-full accent-indigo-500 bg-slate-900 rounded-lg cursor-pointer"
            />

            <label className="flex items-center gap-2 mt-2 cursor-pointer text-xs text-slate-400">
              <input
                type="checkbox"
                checked={config.randomizeDelay}
                onChange={(e) => handleConfigChange({ ...config, randomizeDelay: e.target.checked })}
                className="rounded border-slate-800 text-indigo-600 focus:ring-0"
              />
              Randomize Delay (human simulation)
            </label>
          </div>

          {/* Headless Mode */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-200">Headless Mode</div>
              <div className="text-[11px] text-slate-400">Run browser in background without GUI</div>
            </div>
            <button
              onClick={() => handleConfigChange({ ...config, headless: !config.headless })}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                config.headless ? 'bg-indigo-600' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  config.headless ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Browser Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300">Browser Selection</label>
              <span className="text-[11px] font-bold text-indigo-300 bg-indigo-500/15 px-2 py-0.5 rounded-md border border-indigo-500/30">
                Active: {config.preferredBrowser}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(['Chromium', 'Chrome', 'Edge', 'Firefox'] as const).map((b) => {
                const isSelected = config.preferredBrowser?.toLowerCase() === b.toLowerCase();
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => {
                      const updated = { ...config, preferredBrowser: b };
                      setConfig(updated);
                      handleConfigChange(updated);
                    }}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-500/30 ring-2 ring-indigo-500/40'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                    }`}
                  >
                    {b} {isSelected ? '✓' : ''}
                  </button>
                );
              })}
            </div>

            {/* Chrome Profile Selector */}
            <div className="mt-3.5 pt-3 border-t border-slate-800/80">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">Chrome Profile</label>
                <span className="text-[10px] font-mono text-cyan-400">
                  {config.selectedChromeProfile || 'Default'}
                </span>
              </div>
              <select
                value={config.selectedChromeProfile || 'Default'}
                onChange={(e) => handleConfigChange({ ...config, selectedChromeProfile: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 px-3 py-2 rounded-xl outline-none focus:border-indigo-500 font-semibold"
              >
                {chromeProfiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
                {chromeProfiles.length === 0 && (
                  <>
                    <option value="Vimal">Vimal Profile</option>
                    <option value="Default">Default Profile</option>
                    <option value="Profile 1">Profile 1</option>
                  </>
                )}
              </select>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Select your existing Chrome profile (stores cookies & Naukri session).
              </span>
            </div>
          </div>

          {/* Retry Settings */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-slate-200">Retry Failed Operations</div>
              <input
                type="checkbox"
                checked={config.retryFailedOperations}
                onChange={(e) => handleConfigChange({ ...config, retryFailedOperations: e.target.checked })}
                className="rounded border-slate-800 text-indigo-600"
              />
            </div>
            {config.retryFailedOperations && (
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                <span className="text-[11px] text-slate-400">Max Retry Count</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={config.maxRetryCount}
                  onChange={(e) => handleConfigChange({ ...config, maxRetryCount: parseInt(e.target.value) || 3 })}
                  className="w-16 bg-slate-950 border border-slate-800 text-xs text-slate-200 px-2 py-1 rounded-lg text-center"
                />
              </div>
            )}
          </div>
        </div>

        {/* Live Logs Terminal Stream */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl flex flex-col h-[560px]">
          {/* Terminal Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <h2 className="text-base font-bold text-white">Live Execution Terminal</h2>
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                {logs.length} events
              </span>
            </div>

            {/* Terminal Actions */}
            <div className="flex items-center gap-2">
              {/* Level Filter */}
              <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-[11px]">
                {(['ALL', 'Info', 'Warning', 'Error'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setLogFilter(lvl)}
                    className={`px-2 py-1 rounded-md font-semibold transition-all ${
                      logFilter === lvl
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>

              <button
                onClick={copyLogs}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800"
                title="Copy Terminal Logs"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>

              <button
                onClick={onClearLogs}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800"
                title="Clear Logs"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search Filter */}
          <div className="my-3">
            <input
              type="text"
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
              placeholder="Filter log output..."
              className="w-full bg-slate-950 border border-slate-800/80 text-xs text-slate-200 px-3 py-1.5 rounded-xl outline-none focus:border-indigo-500"
            />
          </div>

          {/* Console Stream Box */}
          <div className="flex-1 bg-slate-950 p-4 rounded-xl font-mono text-xs overflow-y-auto space-y-2 border border-slate-800/80">
            {filteredLogs.map((log) => {
              const isError = log.level === 'Error';
              const isWarn = log.level === 'Warning';
              return (
                <div key={log.id} className="flex items-start gap-2 leading-relaxed group">
                  <span className="text-slate-500 text-[10px] whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                      isError
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : isWarn
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                    }`}
                  >
                    {log.level}
                  </span>
                  <span className="text-slate-400 font-semibold text-[11px]">[{log.category}]</span>
                  <span className={`flex-1 ${isError ? 'text-rose-300' : isWarn ? 'text-amber-300' : 'text-slate-200'}`}>
                    {log.message}
                  </span>
                </div>
              );
            })}
            {filteredLogs.length === 0 && (
              <div className="py-12 text-center text-slate-600 text-xs font-sans">
                Console output is clear. Click "Start Engine" to begin Playwright automation.
              </div>
            )}
            <div ref={terminalEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
};
