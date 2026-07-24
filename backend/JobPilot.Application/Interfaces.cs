using JobPilot.Application.DTOs;
using JobPilot.Domain.Entities;

namespace JobPilot.Application.Interfaces;

public interface IJobRepository
{
    Task<JobOpportunity?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<JobOpportunity?> GetByExternalIdAsync(string externalId, CancellationToken ct = default);
    Task<IEnumerable<JobOpportunity>> GetAllAsync(string? status = null, string? search = null, CancellationToken ct = default);
    Task<IEnumerable<JobOpportunity>> GetPendingReviewAsync(CancellationToken ct = default);
    Task AddAsync(JobOpportunity job, CancellationToken ct = default);
    Task UpdateAsync(JobOpportunity job, CancellationToken ct = default);
    Task BulkUpdateStatusAsync(IEnumerable<Guid> ids, JobStatus status, CancellationToken ct = default);
    Task<int> GetCountByStatusAsync(JobStatus status, DateTime? since = null, CancellationToken ct = default);
    Task<int> GetTotalFoundTodayAsync(CancellationToken ct = default);
    Task<IEnumerable<JobOpportunity>> GetRecentActivityAsync(int limit = 10, CancellationToken ct = default);
}

public interface ISearchProfileRepository
{
    Task<SearchProfile> GetActiveProfileAsync(CancellationToken ct = default);
    Task SaveProfileAsync(SearchProfile profile, CancellationToken ct = default);
}

public interface IAutomationConfigRepository
{
    Task<AutomationConfig> GetConfigAsync(CancellationToken ct = default);
    Task SaveConfigAsync(AutomationConfig config, CancellationToken ct = default);
}

public interface ILogRepository
{
    Task AddLogAsync(AutomationLog log, CancellationToken ct = default);
    Task<IEnumerable<AutomationLog>> GetLogsAsync(string? level = null, string? category = null, int limit = 100, CancellationToken ct = default);
    Task ClearLogsAsync(CancellationToken ct = default);
}

public interface IAutomationEngine
{
    RunnerState CurrentState { get; }
    AutomationSession CurrentSession { get; }
    Task StartAsync(SearchProfile profile, AutomationConfig config, CancellationToken ct = default);
    Task PauseAsync();
    Task ResumeAsync();
    Task StopAsync();
}

public interface INotificationHubService
{
    Task SendLogAsync(AutomationLogDto log);
    Task SendStatusUpdateAsync(string runnerState, string currentKeyword, int jobsFound, int jobsProcessed);
    Task SendJobDiscoveredAsync(JobOpportunityDto job);
}
