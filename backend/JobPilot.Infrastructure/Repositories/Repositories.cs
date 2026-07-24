using JobPilot.Application.Interfaces;
using JobPilot.Domain.Entities;
using JobPilot.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace JobPilot.Infrastructure.Repositories;

public class JobRepository : IJobRepository
{
    private readonly JobPilotDbContext _db;

    public JobRepository(JobPilotDbContext db)
    {
        _db = db;
    }

    public async Task<JobOpportunity?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _db.Jobs.FirstOrDefaultAsync(j => j.Id == id, ct);
    }

    public async Task<JobOpportunity?> GetByExternalIdAsync(string externalId, CancellationToken ct = default)
    {
        return await _db.Jobs.AsNoTracking().FirstOrDefaultAsync(j => j.ExternalId == externalId, ct);
    }

    public async Task<IEnumerable<JobOpportunity>> GetAllAsync(string? status = null, string? search = null, CancellationToken ct = default)
    {
        var query = _db.Jobs.AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<JobStatus>(status, true, out var parsedStatus))
        {
            query = query.Where(j => j.Status == parsedStatus);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(j => j.Title.ToLower().Contains(searchLower) ||
                                     j.Company.ToLower().Contains(searchLower) ||
                                     j.Location.ToLower().Contains(searchLower) ||
                                     j.Skills.ToLower().Contains(searchLower));
        }

        return await query.OrderByDescending(j => j.CreatedAt).ToListAsync(ct);
    }

    public async Task<IEnumerable<JobOpportunity>> GetPendingReviewAsync(CancellationToken ct = default)
    {
        return await _db.Jobs
            .Where(j => j.Status == JobStatus.Pending)
            .OrderByDescending(j => j.CreatedAt)
            .ToListAsync(ct);
    }

    public async Task AddAsync(JobOpportunity job, CancellationToken ct = default)
    {
        var tracked = _db.Jobs.Local.FirstOrDefault(j => j.Id == job.Id);
        if (tracked != null)
        {
            _db.Entry(tracked).State = EntityState.Detached;
        }
        await _db.Jobs.AddAsync(job, ct);
        await _db.SaveChangesAsync(ct);
    }

    public async Task UpdateAsync(JobOpportunity job, CancellationToken ct = default)
    {
        job.UpdatedAt = DateTime.UtcNow;
        var tracked = _db.Jobs.Local.FirstOrDefault(j => j.Id == job.Id);
        if (tracked != null)
        {
            _db.Entry(tracked).State = EntityState.Detached;
        }
        _db.Jobs.Update(job);
        await _db.SaveChangesAsync(ct);
    }

    public async Task BulkUpdateStatusAsync(IEnumerable<Guid> ids, JobStatus status, CancellationToken ct = default)
    {
        var jobs = await _db.Jobs.Where(j => ids.Contains(j.Id)).ToListAsync(ct);
        foreach (var job in jobs)
        {
            job.Status = status;
            job.UpdatedAt = DateTime.UtcNow;
        }
        await _db.SaveChangesAsync(ct);
    }

    public async Task<int> GetCountByStatusAsync(JobStatus status, DateTime? since = null, CancellationToken ct = default)
    {
        var query = _db.Jobs.Where(j => j.Status == status);
        if (since.HasValue)
        {
            query = query.Where(j => j.CreatedAt >= since.Value);
        }
        return await query.CountAsync(ct);
    }

    public async Task<int> GetTotalFoundTodayAsync(CancellationToken ct = default)
    {
        var today = DateTime.UtcNow.Date;
        return await _db.Jobs.CountAsync(j => j.CreatedAt >= today, ct);
    }

    public async Task<IEnumerable<JobOpportunity>> GetRecentActivityAsync(int limit = 10, CancellationToken ct = default)
    {
        return await _db.Jobs
            .OrderByDescending(j => j.UpdatedAt ?? j.CreatedAt)
            .Take(limit)
            .ToListAsync(ct);
    }
}

public class SearchProfileRepository : ISearchProfileRepository
{
    private readonly JobPilotDbContext _db;

    public SearchProfileRepository(JobPilotDbContext db)
    {
        _db = db;
    }

    public async Task<SearchProfile> GetActiveProfileAsync(CancellationToken ct = default)
    {
        var profile = await _db.SearchProfiles.FirstOrDefaultAsync(p => p.IsActive, ct);
        if (profile == null)
        {
            profile = new SearchProfile();
            await _db.SearchProfiles.AddAsync(profile, ct);
            await _db.SaveChangesAsync(ct);
        }
        return profile;
    }

    public async Task SaveProfileAsync(SearchProfile profile, CancellationToken ct = default)
    {
        var existing = await _db.SearchProfiles.FirstOrDefaultAsync(p => p.Id == profile.Id, ct);
        if (existing == null)
        {
            await _db.SearchProfiles.AddAsync(profile, ct);
        }
        else
        {
            existing.Name = profile.Name;
            existing.KeywordsJson = profile.KeywordsJson;
            existing.LocationsJson = profile.LocationsJson;
            existing.MinimumExperience = profile.MinimumExperience;
            existing.MaximumExperience = profile.MaximumExperience;
            existing.MinimumSalary = profile.MinimumSalary;
            existing.MaximumSalary = profile.MaximumSalary;
            existing.PostedWithinDays = profile.PostedWithinDays;
            existing.JobTypesJson = profile.JobTypesJson;
            existing.ExcludedCompaniesJson = profile.ExcludedCompaniesJson;
            existing.IncludedCompaniesJson = profile.IncludedCompaniesJson;
            existing.IsActive = profile.IsActive;
            existing.UpdatedAt = DateTime.UtcNow;
        }
        await _db.SaveChangesAsync(ct);
    }
}

public class AutomationConfigRepository : IAutomationConfigRepository
{
    private readonly JobPilotDbContext _db;

    public AutomationConfigRepository(JobPilotDbContext db)
    {
        _db = db;
    }

    public async Task<AutomationConfig> GetConfigAsync(CancellationToken ct = default)
    {
        var config = await _db.AutomationConfigs.FirstOrDefaultAsync(ct);
        if (config == null)
        {
            config = new AutomationConfig();
            await _db.AutomationConfigs.AddAsync(config, ct);
            await _db.SaveChangesAsync(ct);
        }
        return config;
    }

    public async Task SaveConfigAsync(AutomationConfig config, CancellationToken ct = default)
    {
        var existing = await _db.AutomationConfigs.FirstOrDefaultAsync(c => c.Id == config.Id, ct);
        if (existing == null)
        {
            await _db.AutomationConfigs.AddAsync(config, ct);
        }
        else
        {
            existing.MaxJobsToProcess = config.MaxJobsToProcess;
            existing.DelayBetweenActionsSeconds = config.DelayBetweenActionsSeconds;
            existing.RandomizeDelay = config.RandomizeDelay;
            existing.Headless = config.Headless;
            existing.PreferredBrowser = config.PreferredBrowser;
            existing.RetryFailedOperations = config.RetryFailedOperations;
            existing.MaxRetryCount = config.MaxRetryCount;
            existing.AutoSave = config.AutoSave;
            existing.SoundEnabled = config.SoundEnabled;
            existing.DesktopNotifications = config.DesktopNotifications;
            existing.UpdatedAt = DateTime.UtcNow;
        }
        await _db.SaveChangesAsync(ct);
    }
}

public class LogRepository : ILogRepository
{
    private readonly JobPilotDbContext _db;

    public LogRepository(JobPilotDbContext db)
    {
        _db = db;
    }

    public async Task AddLogAsync(AutomationLog log, CancellationToken ct = default)
    {
        await _db.AutomationLogs.AddAsync(log, ct);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<IEnumerable<AutomationLog>> GetLogsAsync(string? level = null, string? category = null, int limit = 100, CancellationToken ct = default)
    {
        var query = _db.AutomationLogs.AsQueryable();

        if (!string.IsNullOrWhiteSpace(level) && Enum.TryParse<LogLevelSeverity>(level, true, out var parsedLevel))
        {
            query = query.Where(l => l.Level == parsedLevel);
        }

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(l => l.Category == category);
        }

        return await query.OrderByDescending(l => l.Timestamp).Take(limit).ToListAsync(ct);
    }

    public async Task ClearLogsAsync(CancellationToken ct = default)
    {
        _db.AutomationLogs.RemoveRange(_db.AutomationLogs);
        await _db.SaveChangesAsync(ct);
    }
}
