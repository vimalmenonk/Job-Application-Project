import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { JobSearchPage } from './pages/JobSearchPage';
import { AutomationPage } from './pages/AutomationPage';
import { ReviewQueuePage } from './pages/ReviewQueuePage';
import { HistoryPage } from './pages/HistoryPage';
import { ConfigurationPage } from './pages/ConfigurationPage';
import { LogsPage } from './pages/LogsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { api, signalRService } from './services/api';
import type {
  DashboardStats,
  ActivityPoint,
  JobOpportunity,
  SearchProfile,
  AutomationConfig,
  AutomationLog,
  AnalyticsSummary,
  JobStatus,
  RunnerState
} from './types';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5000,
    },
  },
});

function MainApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [liveLogs, setLiveLogs] = useState<AutomationLog[]>([]);
  const [runnerState, setRunnerState] = useState<RunnerState>('Idle');

  const qc = useQueryClient();

  // Queries
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['dashboardStats'],
    queryFn: api.getDashboardStats,
    refetchInterval: 3000,
  });

  const { data: activity } = useQuery<ActivityPoint[]>({
    queryKey: ['activityChart'],
    queryFn: api.getActivityChart,
  });

  const { data: jobs = [] } = useQuery<JobOpportunity[]>({
    queryKey: ['jobs', searchQuery],
    queryFn: () => api.getJobs(undefined, searchQuery),
    refetchInterval: 4000,
  });

  const { data: profile } = useQuery<SearchProfile>({
    queryKey: ['searchProfile'],
    queryFn: api.getProfile,
  });

  const { data: runnerConfig } = useQuery<AutomationConfig>({
    queryKey: ['runnerConfig'],
    queryFn: api.getRunnerConfig,
  });

  const { data: logs = [] } = useQuery<AutomationLog[]>({
    queryKey: ['logs'],
    queryFn: () => api.getLogs('ALL', undefined, 150),
    refetchInterval: 3000,
  });

  const { data: analytics } = useQuery<AnalyticsSummary>({
    queryKey: ['analytics'],
    queryFn: api.getAnalytics,
  });

  // SignalR WebSockets initialization
  useEffect(() => {
    signalRService.startConnection(
      (log) => {
        setLiveLogs((prev) => [log, ...prev].slice(0, 200));
        qc.invalidateQueries({ queryKey: ['logs'] });
      },
      (status) => {
        if (status.runnerState) {
          setRunnerState(status.runnerState as RunnerState);
        }
        qc.invalidateQueries({ queryKey: ['dashboardStats'] });
      },
      (_newJob) => {
        qc.invalidateQueries({ queryKey: ['jobs'] });
        qc.invalidateQueries({ queryKey: ['dashboardStats'] });
      }
    );

    return () => {
      signalRService.stopConnection();
    };
  }, [qc]);

  // Combined logs (server + live socket)
  const combinedLogs = [...liveLogs, ...logs].filter(
    (log, index, self) => index === self.findIndex((l) => l.id === log.id)
  );

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: JobStatus; notes?: string }) =>
      api.updateJobStatus(id, status, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] });
      qc.invalidateQueries({ queryKey: ['dashboardStats'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
    },
  });

  const bulkStatusMutation = useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: JobStatus }) =>
      api.bulkUpdateStatus(ids, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] });
      qc.invalidateQueries({ queryKey: ['dashboardStats'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
    },
  });

  const saveProfileMutation = useMutation({
    mutationFn: api.updateProfile,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['searchProfile'] }),
  });

  const saveRunnerConfigMutation = useMutation({
    mutationFn: api.updateRunnerConfig,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['runnerConfig'] }),
  });

  const startAutomationMutation = useMutation({
    mutationFn: api.startAutomation,
    onMutate: () => {
      setRunnerState('Running');
    },
    onSuccess: () => {
      setRunnerState('Running');
      qc.invalidateQueries({ queryKey: ['dashboardStats'] });
      qc.invalidateQueries({ queryKey: ['logs'] });
    },
  });

  const pauseAutomationMutation = useMutation({
    mutationFn: api.pauseAutomation,
    onMutate: () => setRunnerState('Paused'),
    onSuccess: () => {
      setRunnerState('Paused');
      qc.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });

  const resumeAutomationMutation = useMutation({
    mutationFn: api.resumeAutomation,
    onMutate: () => setRunnerState('Running'),
    onSuccess: () => {
      setRunnerState('Running');
      qc.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });

  const stopAutomationMutation = useMutation({
    mutationFn: api.stopAutomation,
    onMutate: () => setRunnerState('Stopped'),
    onSuccess: () => {
      setRunnerState('Stopped');
      qc.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });

  const clearLogsMutation = useMutation({
    mutationFn: api.clearLogs,
    onSuccess: () => {
      setLiveLogs([]);
      qc.invalidateQueries({ queryKey: ['logs'] });
    },
  });

  const activeRunnerState = (stats?.automationStatus as RunnerState) || runnerState;
  const pendingCount = jobs.filter((j) => j.status === 'Pending').length;

  const defaultStats: DashboardStats = {
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
    pendingReview: pendingCount,
    automationStatus: activeRunnerState,
    currentKeyword: '.NET Developer',
    currentLocationFilter: 'Kerala, Bangalore',
    lastScanTime: 'Just Now'
  };

  const defaultProfile: SearchProfile = {
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
    isActive: true,
  };

  const defaultRunnerConfig: AutomationConfig = {
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
    desktopNotifications: true,
  };

  const defaultAnalytics: AnalyticsSummary = {
    applicationsToday: 5,
    successRate: 83.3,
    avgTimePerSubmissionMinutes: 1.4,
    topCompanies: [
      { name: 'CloudPulse', count: 8, percentage: 32 },
      { name: 'Vercel', count: 6, percentage: 24 },
      { name: 'Nexus AI', count: 5, percentage: 20 },
    ],
    topLocations: [
      { name: 'Remote', count: 12, percentage: 48 },
      { name: 'Bangalore', count: 8, percentage: 32 },
      { name: 'Kerala', count: 5, percentage: 20 },
    ],
    topKeywords: [
      { name: 'C#', count: 18, percentage: 72 },
      { name: 'ASP.NET Core', count: 15, percentage: 60 },
      { name: 'EF Core', count: 12, percentage: 48 },
    ],
    weeklyActivity: [
      { date: 'Mon', found: 10, submitted: 4, skipped: 2, failed: 0 },
      { date: 'Tue', found: 14, submitted: 6, skipped: 3, failed: 0 },
    ],
    monthlyActivity: [
      { date: 'Wk 1', found: 40, submitted: 18, skipped: 8, failed: 1 },
    ],
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex">
      {/* Left Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        pendingCount={pendingCount}
        runnerState={activeRunnerState}
      />

      {/* Main Content Area */}
      <div className={`flex-1 transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-64'}`}>
        <Header
          runnerState={activeRunnerState}
          onStart={() => startAutomationMutation.mutate()}
          onPause={() => pauseAutomationMutation.mutate()}
          onResume={() => resumeAutomationMutation.mutate()}
          onStop={() => stopAutomationMutation.mutate()}
          soundEnabled={soundEnabled}
          setSoundEnabled={setSoundEnabled}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        <main className="p-6">
          {activeTab === 'dashboard' && (
            <DashboardPage
              stats={stats || defaultStats}
              activity={activity || []}
              recentJobs={jobs}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'search' && (
            <JobSearchPage
              profile={profile || defaultProfile}
              onSaveProfile={async (p) => {
                await saveProfileMutation.mutateAsync(p);
              }}
            />
          )}

          {activeTab === 'automation' && (
            <AutomationPage
              runnerConfig={runnerConfig || defaultRunnerConfig}
              onSaveRunnerConfig={async (c) => {
                await saveRunnerConfigMutation.mutateAsync(c);
              }}
              runnerState={activeRunnerState}
              onStart={() => startAutomationMutation.mutate()}
              onPause={() => pauseAutomationMutation.mutate()}
              onResume={() => resumeAutomationMutation.mutate()}
              onStop={() => stopAutomationMutation.mutate()}
              logs={combinedLogs}
              onClearLogs={() => clearLogsMutation.mutate()}
            />
          )}

          {activeTab === 'queue' && (
            <ReviewQueuePage
              jobs={jobs}
              onUpdateStatus={async (id, s, n) => {
                await updateStatusMutation.mutateAsync({ id, status: s, notes: n });
              }}
              onBulkUpdateStatus={async (ids, s) => {
                await bulkStatusMutation.mutateAsync({ ids, status: s });
              }}
            />
          )}

          {activeTab === 'history' && (
            <HistoryPage jobs={jobs} exportCsvUrl={api.exportCsvUrl()} />
          )}

          {activeTab === 'config' && (
            <ConfigurationPage
              profile={profile || defaultProfile}
              runnerConfig={runnerConfig || defaultRunnerConfig}
              onSaveProfile={async (p) => {
                await saveProfileMutation.mutateAsync(p);
              }}
              onSaveRunnerConfig={async (c) => {
                await saveRunnerConfigMutation.mutateAsync(c);
              }}
            />
          )}

          {activeTab === 'logs' && (
            <LogsPage logs={combinedLogs} onClearLogs={() => clearLogsMutation.mutate()} />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsPage analytics={analytics || defaultAnalytics} />
          )}

          {activeTab === 'settings' && (
            <SettingsPage
              runnerConfig={runnerConfig || defaultRunnerConfig}
              onSaveRunnerConfig={async (c) => {
                await saveRunnerConfigMutation.mutateAsync(c);
              }}
              soundEnabled={soundEnabled}
              setSoundEnabled={setSoundEnabled}
              exportCsvUrl={api.exportCsvUrl()}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MainApp />
    </QueryClientProvider>
  );
}
