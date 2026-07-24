namespace JobPilot.Domain.Entities;

public enum JobStatus
{
    Pending = 0,
    Reviewed = 1,
    Submitted = 2,
    Skipped = 3,
    Failed = 4,
    AlreadyApplied = 5
}

public enum BrowserType
{
    Chromium = 0,
    Chrome = 1,
    Edge = 2,
    Firefox = 3
}

public enum RunnerState
{
    Idle = 0,
    Running = 1,
    Paused = 2,
    Completed = 3,
    Stopped = 4,
    Failed = 5
}

public enum WorkType
{
    FullTime = 0,
    Remote = 1,
    Hybrid = 2,
    Contract = 3,
    WorkFromHome = 4
}

public enum LogLevelSeverity
{
    Info = 0,
    Warning = 1,
    Error = 2
}

public class JobOpportunity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string ExternalId { get; set; } = string.Empty; // Naukri Job ID
    public string Title { get; set; } = string.Empty;
    public string Company { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public decimal? MinimumSalary { get; set; } // INR ₹
    public decimal? MaximumSalary { get; set; } // INR ₹
    public string Currency { get; set; } = "INR";
    public string EmploymentType { get; set; } = "Full Time";
    public WorkType WorkType { get; set; } = WorkType.FullTime;
    public bool IsRemote { get; set; }
    public int ExperienceYears { get; set; }
    public DateTime PostedDate { get; set; } = DateTime.UtcNow;
    public string Description { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public JobStatus Status { get; set; } = JobStatus.Pending;
    public string Skills { get; set; } = string.Empty;
    public string ApplicationNotes { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

public class SearchProfile
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = "Naukri Search Profile";
    public string KeywordsJson { get; set; } = "[\".NET Developer\",\"ASP.NET Core\",\"C#\"]";
    public string LocationsJson { get; set; } = "[\"Kerala\",\"Bangalore\",\"Remote\"]";
    public int MinimumExperience { get; set; } = 0;
    public int MaximumExperience { get; set; } = 5;
    public decimal? MinimumSalary { get; set; } = 300000; // ₹3,00,000 (3 LPA)
    public decimal? MaximumSalary { get; set; } = 1500000; // ₹15,00,000 (15 LPA)
    public decimal ExpectedCtcLpa { get; set; } = 12.0m;
    public int PostedWithinDays { get; set; } = 7;
    public string JobTypesJson { get; set; } = "[\"Full Time\",\"Remote\",\"Hybrid\"]";
    public string ExcludedCompaniesJson { get; set; } = "[]";
    public string IncludedCompaniesJson { get; set; } = "[]";
    public bool IsActive { get; set; } = true;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class AutomationConfig
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public int MaxJobsToProcess { get; set; } = 5;
    public int DelayBetweenActionsSeconds { get; set; } = 8;
    public bool RandomizeDelay { get; set; } = true;
    public bool Headless { get; set; } = false;
    public BrowserType PreferredBrowser { get; set; } = BrowserType.Chrome;
    public string SelectedChromeProfile { get; set; } = "Default";
    public bool RetryFailedOperations { get; set; } = true;
    public int MaxRetryCount { get; set; } = 3;
    public bool AutoSave { get; set; } = true;
    public bool SoundEnabled { get; set; } = true;
    public bool DesktopNotifications { get; set; } = true;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class AutomationLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public LogLevelSeverity Level { get; set; } = LogLevelSeverity.Info;
    public string Message { get; set; } = string.Empty;
    public string Category { get; set; } = "General";
    public string? Details { get; set; }
    public Guid? JobId { get; set; }
}

public class AutomationSession
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? StoppedAt { get; set; }
    public RunnerState Status { get; set; } = RunnerState.Idle;
    public bool ChromeConnected { get; set; } = false;
    public string ChromeConnectionStatus { get; set; } = "Connecting to existing Chrome...";
    public string BrowserProfilePath { get; set; } = "Default Chrome Profile";
    public string NaukriLoginStatus { get; set; } = "Not Logged In";
    public string LoggedProfileName { get; set; } = "Checking Session...";
    public string AccountEmail { get; set; } = "Not Disclosed";
    public string ProfileCompletionText { get; set; } = "Unavailable";
    public string ResumeLastUpdated { get; set; } = "Checking...";
    public int JobsFound { get; set; }
    public int JobsProcessed { get; set; }
    public int JobsSubmitted { get; set; }
    public int JobsSkipped { get; set; }
    public int FailedAttempts { get; set; }
    public string CurrentKeyword { get; set; } = ".NET Developer";
    public string CurrentLocationFilter { get; set; } = "Kerala, Bangalore";
    public string CurrentBrowser { get; set; } = "Chrome";
    public DateTime? LastScanTime { get; set; }
}
