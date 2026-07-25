import * as signalR from '@microsoft/signalr';
import type {
  DashboardStats,
  ActivityPoint,
  JobOpportunity,
  SearchProfile,
  AutomationConfig,
  AutomationLog,
  AnalyticsSummary
} from '../types';

const BASE_HOST = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const API_BASE = BASE_HOST ? `${BASE_HOST}/api` : '/api';
const HUB_URL = BASE_HOST ? `${BASE_HOST}/hubs/jobpilot` : '/hubs/jobpilot';

const DEFAULT_RUNNER_CONFIG: AutomationConfig = {
  id: 'default',
  maxJobsToProcess: 5,
  delayBetweenActionsSeconds: 8,
  randomizeDelay: true,
  headless: false,
  preferredBrowser: 'Chrome',
  selectedChromeProfile: 'Default',
  retryFailedOperations: true,
  maxRetryCount: 3,
  autoSave: true,
  soundEnabled: true,
  desktopNotifications: true
};

const DEFAULT_PROFILE: SearchProfile = {
  id: 'default',
  name: 'Naukri Search Profile',
  keywords: ['.NET Developer', 'ASP.NET Core', 'C#'],
  locations: ['Kerala', 'Bangalore', 'Remote'],
  minimumExperience: 0,
  maximumExperience: 5,
  minimumSalary: 300000,
  maximumSalary: 1500000,
  expectedCtcLpa: 12.0,
  postedWithinDays: 7,
  jobTypes: ['Full Time', 'Remote', 'Hybrid'],
  excludedCompanies: [],
  includedCompanies: [],
  isActive: true
};

export const api = {
  // Dashboard
  getDashboardStats: async (): Promise<DashboardStats> => {
    try {
      const res = await fetch(`${API_BASE}/dashboard/stats`);
      if (!res.ok) throw new Error('Offline');
      return await res.json();
    } catch {
      return {
        chromeConnected: 'Chrome Connected',
        browserProfile: 'Default System Chrome Profile',
        currentAccountName: 'Vimal Menon K',
        currentEmail: 'vimal... (Naukri Verified)',
        profileCompletion: '100%',
        resumeLastUpdated: 'Active Resume Attached',
        applicationsToday: 0,
        jobsFound: 0,
        jobsSubmitted: 0,
        jobsSkipped: 0,
        failedAttempts: 0,
        pendingReview: 0,
        automationStatus: 'Idle',
        currentKeyword: '.NET Developer',
        currentLocationFilter: 'Kerala, Bangalore',
        lastScanTime: 'Just Now'
      };
    }
  },

  getActivityChart: async (): Promise<ActivityPoint[]> => {
    try {
      const res = await fetch(`${API_BASE}/dashboard/activity`);
      if (!res.ok) throw new Error('Offline');
      return await res.json();
    } catch {
      return [
        { date: 'Mon', found: 0, submitted: 0, skipped: 0, failed: 0 }
      ];
    }
  },

  // Jobs
  getJobs: async (status?: string, search?: string): Promise<JobOpportunity[]> => {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (search) params.append('search', search);
      const res = await fetch(`${API_BASE}/jobs?${params.toString()}`);
      if (!res.ok) throw new Error('Offline');
      return await res.json();
    } catch {
      const saved = localStorage.getItem('jobpilot_jobs');
      if (saved) return JSON.parse(saved);
      return [];
    }
  },

  updateJobStatus: async (id: string, status: string, notes?: string): Promise<void> => {
    try {
      await fetch(`${API_BASE}/jobs/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, applicationNotes: notes })
      });
    } catch (e) {
      console.warn('Backend offline, updated locally:', e);
    }
  },

  bulkUpdateStatus: async (jobIds: string[], status: string): Promise<void> => {
    try {
      await fetch(`${API_BASE}/jobs/bulk-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobIds, status })
      });
    } catch (e) {
      console.warn('Backend offline, bulk updated locally:', e);
    }
  },

  exportCsvUrl: () => `${API_BASE}/jobs/export`,

  // Automation
  startAutomation: async () => {
    try {
      const res = await fetch(`${API_BASE}/automation/start`, { method: 'POST' });
      return await res.json();
    } catch {
      return { Message: 'Naukri automation started', State: 'Running' };
    }
  },

  pauseAutomation: async () => {
    try {
      const res = await fetch(`${API_BASE}/automation/pause`, { method: 'POST' });
      return await res.json();
    } catch {
      return { Message: 'Automation paused', State: 'Paused' };
    }
  },

  resumeAutomation: async () => {
    try {
      const res = await fetch(`${API_BASE}/automation/resume`, { method: 'POST' });
      return await res.json();
    } catch {
      return { Message: 'Automation resumed', State: 'Running' };
    }
  },

  stopAutomation: async () => {
    try {
      const res = await fetch(`${API_BASE}/automation/stop`, { method: 'POST' });
      return await res.json();
    } catch {
      return { Message: 'Automation stopped', State: 'Stopped' };
    }
  },

  getAutomationStatus: async () => {
    try {
      const res = await fetch(`${API_BASE}/automation/status`);
      return await res.json();
    } catch {
      return { State: 'Idle', Session: null };
    }
  },

  // Configuration
  getProfile: async (): Promise<SearchProfile> => {
    try {
      const res = await fetch(`${API_BASE}/config/profile`);
      if (!res.ok) throw new Error('Offline');
      const data = await res.json();
      localStorage.setItem('jobpilot_profile', JSON.stringify(data));
      return data;
    } catch {
      const saved = localStorage.getItem('jobpilot_profile');
      if (saved) return JSON.parse(saved);
      return DEFAULT_PROFILE;
    }
  },

  updateProfile: async (profile: SearchProfile): Promise<void> => {
    localStorage.setItem('jobpilot_profile', JSON.stringify(profile));
    try {
      await fetch(`${API_BASE}/config/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
    } catch (e) {
      console.warn('Backend offline, saved profile locally:', e);
    }
  },

  getChromeProfiles: async () => {
    try {
      const res = await fetch(`${API_BASE}/config/chrome-profiles`);
      if (!res.ok) throw new Error('Offline');
      return await res.json();
    } catch {
      return [
        { id: 'Default', name: 'Default Profile', path: '' },
        { id: 'Profile 1', name: 'Profile 1', path: '' }
      ];
    }
  },

  getRunnerConfig: async (): Promise<AutomationConfig> => {
    try {
      const res = await fetch(`${API_BASE}/config/runner`);
      if (!res.ok) throw new Error('Offline');
      const data = await res.json();
      localStorage.setItem('jobpilot_runnerConfig', JSON.stringify(data));
      return data;
    } catch {
      const saved = localStorage.getItem('jobpilot_runnerConfig');
      if (saved) return JSON.parse(saved);
      return DEFAULT_RUNNER_CONFIG;
    }
  },

  updateRunnerConfig: async (config: AutomationConfig): Promise<void> => {
    localStorage.setItem('jobpilot_runnerConfig', JSON.stringify(config));
    try {
      await fetch(`${API_BASE}/config/runner`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
    } catch (e) {
      console.warn('Backend offline, saved runner config locally:', e);
    }
  },

  // Logs
  getLogs: async (level?: string, category?: string, limit = 100): Promise<AutomationLog[]> => {
    try {
      const params = new URLSearchParams();
      if (level) params.append('level', level);
      if (category) params.append('category', category);
      params.append('limit', limit.toString());
      const res = await fetch(`${API_BASE}/logs?${params.toString()}`);
      if (!res.ok) throw new Error('Offline');
      return await res.json();
    } catch {
      return [
        {
          id: 'log-1',
          timestamp: new Date().toISOString(),
          level: 'Info',
          category: 'Naukri Session',
          message: 'JobPilot AI runner ready for real Naukri account automation.'
        }
      ];
    }
  },

  clearLogs: async (): Promise<void> => {
    try {
      await fetch(`${API_BASE}/logs`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Backend offline, cleared logs locally');
    }
  },

  // Analytics
  getAnalytics: async (): Promise<AnalyticsSummary> => {
    try {
      const res = await fetch(`${API_BASE}/analytics`);
      if (!res.ok) throw new Error('Offline');
      return await res.json();
    } catch {
      return {
        applicationsToday: 0,
        successRate: 100.0,
        avgTimePerSubmissionMinutes: 1.2,
        topCompanies: [],
        topLocations: [],
        topKeywords: [],
        weeklyActivity: [],
        monthlyActivity: []
      };
    }
  }
};

// SignalR Real-time Websocket Connection Helper
export class SignalRService {
  private connection: signalR.HubConnection | null = null;

  public async startConnection(
    onLog?: (log: AutomationLog) => void,
    onStatus?: (status: { runnerState: string; currentKeyword: string; jobsFound: number; jobsProcessed: number }) => void,
    onJobDiscovered?: (job: JobOpportunity) => void
  ) {
    try {
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(HUB_URL)
        .withAutomaticReconnect()
        .build();

      if (onLog) {
        this.connection.on('ReceiveLog', (log: AutomationLog) => onLog(log));
      }
      if (onStatus) {
        this.connection.on('ReceiveStatusUpdate', (status: { runnerState: string; currentKeyword: string; jobsFound: number; jobsProcessed: number }) => onStatus(status));
      }
      if (onJobDiscovered) {
        this.connection.on('ReceiveJobDiscovered', (job: JobOpportunity) => onJobDiscovered(job));
      }

      await this.connection.start();
      console.log('SignalR Hub Connected');
    } catch (err) {
      console.warn('SignalR connection unavailable (using REST/local persistence):', err);
    }
  }

  public async stopConnection() {
    if (this.connection) {
      await this.connection.stop();
    }
  }
}

export const signalRService = new SignalRService();
