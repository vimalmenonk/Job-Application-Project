import { useState, useEffect } from 'react';
import {
  FileCode2,
  Save,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';
import type { SearchProfile, AutomationConfig } from '../types';

interface ConfigurationPageProps {
  profile: SearchProfile;
  runnerConfig: AutomationConfig;
  onSaveProfile: (profile: SearchProfile) => Promise<void>;
  onSaveRunnerConfig: (config: AutomationConfig) => Promise<void>;
}

export const ConfigurationPage: React.FC<ConfigurationPageProps> = ({
  profile,
  runnerConfig,
  onSaveProfile,
  onSaveRunnerConfig
}) => {
  const buildJsonString = (p: SearchProfile, c: AutomationConfig) => {
    const jsonObject = {
      Keywords: p.keywords,
      Locations: p.locations,
      Experience: p.maximumExperience,
      MaxJobs: c.maxJobsToProcess,
      Delay: c.delayBetweenActionsSeconds,
      Headless: c.headless,
      Browser: c.preferredBrowser
    };
    return JSON.stringify(jsonObject, null, 4);
  };

  const [jsonText, setJsonText] = useState(() => buildJsonString(profile, runnerConfig));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setJsonText(buildJsonString(profile, runnerConfig));
  }, [profile, runnerConfig]);

  const handleJsonChange = (text: string) => {
    setJsonText(text);
    try {
      JSON.parse(text);
      setJsonError(null);
    } catch (err: any) {
      setJsonError(err.message);
    }
  };

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed, null, 4));
      setJsonError(null);
    } catch (err: any) {
      setJsonError('Cannot format invalid JSON');
    }
  };

  const handleSave = async () => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonError(null);

      const updatedProfile: SearchProfile = {
        ...profile,
        keywords: parsed.Keywords || profile.keywords,
        locations: parsed.Locations || profile.locations,
        maximumExperience: parsed.Experience ?? profile.maximumExperience
      };

      const updatedRunner: AutomationConfig = {
        ...runnerConfig,
        maxJobsToProcess: parsed.MaxJobs ?? runnerConfig.maxJobsToProcess,
        delayBetweenActionsSeconds: parsed.Delay ?? runnerConfig.delayBetweenActionsSeconds,
        headless: parsed.Headless ?? runnerConfig.headless,
        preferredBrowser: parsed.Browser ?? runnerConfig.preferredBrowser
      };

      await onSaveProfile(updatedProfile);
      await onSaveRunnerConfig(updatedRunner);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setJsonError('Failed to parse JSON configuration: ' + err.message);
    }
  };

  const handleExportJson = () => {
    const blob = new Blob([jsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'jobpilot_config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        handleJsonChange(content);
      }
    };
    reader.readAsText(file);
  };

  const copyText = () => {
    navigator.clipboard.writeText(jsonText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl flex flex-wrap items-center justify-between gap-4 border-indigo-500/20">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <FileCode2 className="w-4 h-4" /> Config Engine & Preset Synchronizer
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">System Configuration</h1>
          <p className="text-sm text-slate-400">
            Edit JSON configuration parameters directly and sync with the backend
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-xs border border-slate-800 cursor-pointer flex items-center gap-1.5">
            <Upload className="w-4 h-4 text-indigo-400" /> Import JSON
            <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
          </label>

          <button
            onClick={handleExportJson}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-xs border border-slate-800 flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-cyan-400" /> Export JSON
          </button>

          <button
            onClick={handleSave}
            disabled={!!jsonError}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {saveSuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
            {saveSuccess ? 'Config Saved!' : 'Save Configuration'}
          </button>
        </div>
      </div>

      {/* Main JSON Editor Glass Box */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
            <span className="text-xs font-mono text-slate-400 ml-2">appsettings.json / search_config.json</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleFormat}
              className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800"
            >
              Prettify Format
            </button>
            <button
              onClick={copyText}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
              title="Copy to Clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {jsonError && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{jsonError}</span>
          </div>
        )}

        <textarea
          value={jsonText}
          onChange={(e) => handleJsonChange(e.target.value)}
          rows={16}
          className="w-full bg-slate-950 p-4 rounded-xl font-mono text-xs text-indigo-300 border border-slate-800 focus:border-indigo-500 outline-none leading-relaxed"
          spellCheck={false}
        />
      </div>
    </div>
  );
};
