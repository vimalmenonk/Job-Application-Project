using JobPilot.Domain.Entities;

namespace JobPilot.Application.DTOs;

public record JobOpportunityDto(
    Guid Id,
    string ExternalId,
    string Title,
    string Company,
    string Location,
    decimal? MinimumSalary,
    decimal? MaximumSalary,
    string Currency,
    string EmploymentType,
    string WorkType,
    bool IsRemote,
    int ExperienceYears,
    DateTime PostedDate,
    string Description,
    string Url,
    string Status,
    List<string> Skills,
    string ApplicationNotes,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

public record UpdateJobStatusDto(
    string Status,
    string? ApplicationNotes
);

public record BulkStatusUpdateDto(
    List<Guid> JobIds,
    string Status
);

public record SearchProfileDto(
    Guid Id,
    string Name,
    List<string> Keywords,
    List<string> Locations,
    int MinimumExperience,
    int MaximumExperience,
    decimal? MinimumSalary,
    decimal? MaximumSalary,
    decimal ExpectedCtcLpa,
    int PostedWithinDays,
    List<string> JobTypes,
    List<string> ExcludedCompanies,
    List<string> IncludedCompanies,
    bool IsActive
);

public record AutomationConfigDto(
    Guid Id,
    int MaxJobsToProcess,
    int DelayBetweenActionsSeconds,
    bool RandomizeDelay,
    bool Headless,
    string PreferredBrowser,
    string SelectedChromeProfile,
    bool RetryFailedOperations,
    int MaxRetryCount,
    bool AutoSave,
    bool SoundEnabled,
    bool DesktopNotifications
);

public record AutomationLogDto(
    Guid Id,
    DateTime Timestamp,
    string Level,
    string Message,
    string Category,
    string? Details,
    Guid? JobId
);

public record DashboardStatsDto(
    string ChromeConnected,
    string BrowserProfile,
    string CurrentAccountName,
    string CurrentEmail,
    string ProfileCompletion,
    string ResumeLastUpdated,
    int ApplicationsToday,
    int JobsFound,
    int JobsSubmitted,
    int JobsSkipped,
    int FailedAttempts,
    int PendingReview,
    string AutomationStatus,
    string CurrentKeyword,
    string CurrentLocationFilter,
    string LastScanTime
);

public record ActivityPointDto(
    string Date,
    int Found,
    int Submitted,
    int Skipped,
    int Failed
);

public record AnalyticsSummaryDto(
    int ApplicationsToday,
    double SuccessRate,
    double AvgTimePerSubmissionMinutes,
    List<CategoryMetricDto> TopCompanies,
    List<CategoryMetricDto> TopLocations,
    List<CategoryMetricDto> TopKeywords,
    List<ActivityPointDto> WeeklyActivity,
    List<ActivityPointDto> MonthlyActivity
);

public record CategoryMetricDto(
    string Name,
    int Count,
    double Percentage
);
