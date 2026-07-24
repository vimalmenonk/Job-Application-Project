
import {
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Bell,
  Search
} from 'lucide-react';
import type { RunnerState } from '../types';

interface HeaderProps {
  runnerState: RunnerState;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  runnerState,
  onStart,
  onPause,
  onResume,
  onStop,
  soundEnabled,
  setSoundEnabled,
  searchQuery,
  setSearchQuery
}) => {
  return (
    <header className="h-16 px-6 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-xl flex items-center justify-between sticky top-0 z-20">
      {/* Global Quick Search */}
      <div className="relative w-80">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Quick search jobs, companies, skills..."
          className="w-full bg-slate-900/80 border border-slate-800 focus:border-indigo-500 text-sm text-slate-200 pl-10 pr-4 py-2 rounded-xl focus:outline-none transition-all placeholder:text-slate-500"
        />
      </div>

      {/* Runner Quick Controls & System Toggles */}
      <div className="flex items-center gap-4">
        {/* Automation Runner Quick Status Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/60">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              runnerState === 'Running'
                ? 'bg-emerald-500 animate-ping'
                : runnerState === 'Paused'
                ? 'bg-amber-500'
                : 'bg-slate-500'
            }`}
          />
          <span className="text-xs font-medium text-slate-300">
            Runner: <span className="font-semibold text-white">{runnerState}</span>
          </span>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          {/* Quick Action Trigger Buttons */}
          {runnerState === 'Idle' || runnerState === 'Stopped' || runnerState === 'Completed' || runnerState === 'Failed' ? (
            <button
              onClick={onStart}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 transition-all shadow-md shadow-emerald-600/20"
            >
              <Play className="w-3 h-3 fill-current" /> Start
            </button>
          ) : runnerState === 'Running' ? (
            <button
              onClick={onPause}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1 transition-all shadow-md shadow-amber-600/20"
            >
              <Pause className="w-3 h-3 fill-current" /> Pause
            </button>
          ) : (
            <button
              onClick={onResume}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 transition-all shadow-md shadow-emerald-600/20"
            >
              <Play className="w-3 h-3 fill-current" /> Resume
            </button>
          )}

          {(runnerState === 'Running' || runnerState === 'Paused') && (
            <button
              onClick={onStop}
              className="px-2 py-1 text-xs font-semibold rounded-lg bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 flex items-center transition-all"
              title="Stop Runner"
            >
              <Square className="w-3 h-3 fill-current" />
            </button>
          )}
        </div>

        {/* Sound Toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800 transition-colors"
          title={soundEnabled ? "Mute notifications" : "Enable notifications sound"}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-400" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Notification Bell */}
        <button
          className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800 transition-colors relative"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500" />
        </button>

        {/* User Pill */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-xs shadow-md">
            JP
          </div>
          <div className="hidden md:block">
            <div className="text-xs font-semibold text-slate-200 leading-none">Enterprise Admin</div>
            <div className="text-[10px] text-slate-400 mt-0.5">admin@jobpilot.ai</div>
          </div>
        </div>
      </div>
    </header>
  );
};
