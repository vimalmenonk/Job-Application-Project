import { useState } from 'react';
import {
  Settings,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Bell,
  Save,
  Download,
  CheckCircle2,
  Shield
} from 'lucide-react';
import type { AutomationConfig } from '../types';

interface SettingsPageProps {
  runnerConfig: AutomationConfig;
  onSaveRunnerConfig: (config: AutomationConfig) => Promise<void>;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  exportCsvUrl: string;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  runnerConfig,
  onSaveRunnerConfig,
  soundEnabled,
  setSoundEnabled,
  exportCsvUrl
}) => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [desktopNotifs, setDesktopNotifs] = useState(runnerConfig.desktopNotifications);
  const [autoSave, setAutoSave] = useState(runnerConfig.autoSave);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleToggleDesktopNotifs = async (enabled: boolean) => {
    setDesktopNotifs(enabled);
    if (enabled && 'Notification' in window) {
      Notification.requestPermission();
    }
    await onSaveRunnerConfig({ ...runnerConfig, desktopNotifications: enabled });
  };

  const handleToggleAutoSave = async (enabled: boolean) => {
    setAutoSave(enabled);
    await onSaveRunnerConfig({ ...runnerConfig, autoSave: enabled });
  };

  const handleSave = async () => {
    await onSaveRunnerConfig({
      ...runnerConfig,
      soundEnabled: soundEnabled,
      desktopNotifications: desktopNotifs,
      autoSave: autoSave
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl flex items-center justify-between border-indigo-500/20">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Settings className="w-4 h-4" /> Application Preferences
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">System Settings</h1>
          <p className="text-sm text-slate-400">
            Configure UI themes, notifications, automation sounds, and data backups
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all"
        >
          {savedSuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
          {savedSuccess ? 'Settings Saved!' : 'Save Settings'}
        </button>
      </div>

      <div className="space-y-4">
        {/* Visual Theme */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Moon className="w-4 h-4 text-indigo-400" /> Appearance & Theme
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setIsDarkMode(true)}
              className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                isDarkMode
                  ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-indigo-400" />
                <div className="text-left">
                  <div className="text-sm font-bold">Dark Mode</div>
                  <div className="text-xs text-slate-400">Premium SaaS Glassmorphism</div>
                </div>
              </div>
              {isDarkMode && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
            </button>

            <button
              onClick={() => setIsDarkMode(false)}
              className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                !isDarkMode
                  ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <Sun className="w-5 h-5 text-amber-400" />
                <div className="text-left">
                  <div className="text-sm font-bold">Light Mode</div>
                  <div className="text-xs text-slate-400">Clean High Contrast UI</div>
                </div>
              </div>
              {!isDarkMode && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
            </button>
          </div>
        </div>

        {/* Notifications & Audio */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-cyan-400" /> Notifications & Audio Alerts
          </h2>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {soundEnabled ? <Volume2 className="w-5 h-5 text-indigo-400" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
                <div>
                  <div className="text-sm font-semibold text-slate-200">Notification Sounds</div>
                  <div className="text-xs text-slate-400">Play audio chime when job matches are discovered</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="w-5 h-5 rounded border-slate-800 text-indigo-600"
              />
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-cyan-400" />
                <div>
                  <div className="text-sm font-semibold text-slate-200">Desktop Notifications</div>
                  <div className="text-xs text-slate-400">Display OS native toast alerts during Playwright execution</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={desktopNotifs}
                onChange={(e) => handleToggleDesktopNotifs(e.target.checked)}
                className="w-5 h-5 rounded border-slate-800 text-indigo-600"
              />
            </div>
          </div>
        </div>

        {/* Automation & Storage */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" /> Storage & Export Controls
          </h2>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-200">Auto Save Configuration</div>
                <div className="text-xs text-slate-400">Persist criteria changes automatically to SQLite database</div>
              </div>
              <input
                type="checkbox"
                checked={autoSave}
                onChange={(e) => handleToggleAutoSave(e.target.checked)}
                className="w-5 h-5 rounded border-slate-800 text-indigo-600"
              />
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-200">Export Application Logs</div>
                <div className="text-xs text-slate-400">Download complete application history in standard CSV format</div>
              </div>
              <a
                href={exportCsvUrl}
                download
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Export Logs
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
