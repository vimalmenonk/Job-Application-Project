export type JobStatus = 'Pending' | 'Reviewed' | 'Submitted' | 'Skipped' | 'Failed';

export type WorkType = 'FullTime' | 'Remote' | 'Hybrid' | 'Contract' | 'WorkFromHome';

export type RunnerState = 'Idle' | 'Running' | 'Paused' | 'Completed' | 'Stopped' | 'Failed';

export interface JobOpportunity {
  id: string;
  externalId: string;
  title: string;
  company: string;
  location: string;
  minimumSalary: number | null; // INR ₹
  maximumSalary: number | null; // INR ₹
  currency: string; // "INR"
  employmentType: string;
  workType: string;
  isRemote: boolean;
  experienceYears: number;
  postedDate: string;
  description: string;
  url: string;
  status: JobStatus;
  skills: string[];
  applicationNotes: string;
  createdAt: string;
  updatedAt?: string | null;
}

export interface SearchProfile {
  id: string;
  name: string;
  keywords: string[];
  locations: string[];
  minimumExperience: number;
  maximumExperience: number;
  minimumSalary: number | null; // INR ₹
  maximumSalary: number | null; // INR ₹
  expectedCtcLpa: number; // ₹ LPA
  postedWithinDays: number;
  jobTypes: string[];
  excludedCompanies: string[];
  includedCompanies: string[];
  isActive: boolean;
}

export interface AutomationConfig {
  id: string;
  maxJobsToProcess: number;
  delayBetweenActionsSeconds: number;
  randomizeDelay: boolean;
  headless: boolean;
  preferredBrowser: 'Chromium' | 'Chrome' | 'Edge' | 'Firefox';
  selectedChromeProfile: string;
  retryFailedOperations: boolean;
  maxRetryCount: number;
  autoSave: boolean;
  soundEnabled: boolean;
  desktopNotifications: boolean;
}

export interface ChromeProfileInfo {
  id: string;
  name: string;
  path: string;
}

export interface AutomationLog {
  id: string;
  timestamp: string;
  level: 'Info' | 'Warning' | 'Error';
  message: string;
  category: string;
  details?: string | null;
  jobId?: string | null;
}

export interface DashboardStats {
  chromeConnected: string;
  browserProfile: string;
  currentAccountName: string;
  currentEmail: string;
  profileCompletion: string;
  resumeLastUpdated: string;
  applicationsToday: number;
  jobsFound: number;
  jobsSubmitted: number;
  jobsSkipped: number;
  failedAttempts: number;
  pendingReview: number;
  automationStatus: string;
  currentKeyword: string;
  currentLocationFilter: string;
  lastScanTime: string;
}

export interface ActivityPoint {
  date: string;
  found: number;
  submitted: number;
  skipped: number;
  failed: number;
}

export interface CategoryMetric {
  name: string;
  count: number;
  percentage: number;
}

export interface AnalyticsSummary {
  applicationsToday: number;
  successRate: number;
  avgTimePerSubmissionMinutes: number;
  topCompanies: CategoryMetric[];
  topLocations: CategoryMetric[];
  topKeywords: CategoryMetric[];
  weeklyActivity: ActivityPoint[];
  monthlyActivity: ActivityPoint[];
}
