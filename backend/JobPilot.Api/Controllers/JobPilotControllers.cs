using System.Text;
using System.Text.Json;
using JobPilot.Application.DTOs;
using JobPilot.Application.Interfaces;
using JobPilot.Domain.Entities;
using JobPilot.Infrastructure.Services;
using Microsoft.AspNetCore.Mvc;

namespace JobPilot.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
public class DashboardController : ControllerBase
{
    private readonly IJobRepository _jobRepo;
    private readonly IAutomationEngine _automationEngine;
    private readonly ISearchProfileRepository _profileRepo;

    public DashboardController(IJobRepository jobRepo, IAutomationEngine automationEngine, ISearchProfileRepository profileRepo)
    {
        _jobRepo = jobRepo;
        _automationEngine = automationEngine;
        _profileRepo = profileRepo;
    }

    [HttpGet("stats")]
    public async Task<ActionResult<DashboardStatsDto>> GetStats(CancellationToken ct)
    {
        var foundToday = await _jobRepo.GetTotalFoundTodayAsync(ct);
        var reviewed = await _jobRepo.GetCountByStatusAsync(JobStatus.Reviewed, null, ct);
        var submitted = await _jobRepo.GetCountByStatusAsync(JobStatus.Submitted, null, ct);
        var skipped = await _jobRepo.GetCountByStatusAsync(JobStatus.Skipped, null, ct);
        var failed = await _jobRepo.GetCountByStatusAsync(JobStatus.Failed, null, ct);
        var pending = await _jobRepo.GetCountByStatusAsync(JobStatus.Pending, null, ct);

        var profile = await _profileRepo.GetActiveProfileAsync(ct);
        var keywords = JsonSerializer.Deserialize<List<string>>(profile.KeywordsJson) ?? new List<string>();
        var locations = JsonSerializer.Deserialize<List<string>>(profile.LocationsJson) ?? new List<string>();

        var session = _automationEngine.CurrentSession;

        string currentKeyword = session?.CurrentKeyword ?? (keywords.FirstOrDefault() ?? ".NET Developer");
        string currentLocation = session?.CurrentLocationFilter ?? (locations.FirstOrDefault() ?? "Bangalore");

        string chromeConnected = (session != null && session.ChromeConnected)
            ? "Chrome Connected"
            : "Unable to connect to existing Chrome profile";

        string browserProfile = string.IsNullOrEmpty(session?.BrowserProfilePath)
            ? "Default Chrome System Profile"
            : session.BrowserProfilePath;

        string accountName = string.IsNullOrEmpty(session?.LoggedProfileName)
            ? "Not Logged In"
            : session.LoggedProfileName;

        string email = string.IsNullOrEmpty(session?.AccountEmail)
            ? "Not Disclosed"
            : session.AccountEmail;

        string completion = string.IsNullOrEmpty(session?.ProfileCompletionText)
            ? "Unavailable"
            : session.ProfileCompletionText;

        string resumeStatus = string.IsNullOrEmpty(session?.ResumeLastUpdated)
            ? "Checking..."
            : session.ResumeLastUpdated;

        string lastScan = session?.LastScanTime.HasValue == true
            ? session.LastScanTime.Value.ToLocalTime().ToString("hh:mm:ss tt")
            : "Just Now";

        var stats = new DashboardStatsDto(
            ChromeConnected: chromeConnected,
            BrowserProfile: browserProfile,
            CurrentAccountName: accountName,
            CurrentEmail: email,
            ProfileCompletion: completion,
            ResumeLastUpdated: resumeStatus,
            ApplicationsToday: submitted,
            JobsFound: foundToday,
            JobsSubmitted: submitted,
            JobsSkipped: skipped,
            FailedAttempts: failed,
            PendingReview: pending,
            AutomationStatus: _automationEngine.CurrentState.ToString(),
            CurrentKeyword: currentKeyword,
            CurrentLocationFilter: currentLocation,
            LastScanTime: lastScan
        );

        return Ok(stats);
    }

    [HttpGet("activity")]
    public async Task<ActionResult<List<ActivityPointDto>>> GetActivity(CancellationToken ct)
    {
        var points = new List<ActivityPointDto>();
        var today = DateTime.UtcNow.Date;

        var allJobs = await _jobRepo.GetAllAsync(null, null, ct);

        for (int i = 6; i >= 0; i--)
        {
            var day = today.AddDays(-i);
            var dayStr = day.ToString("ddd MM/dd");
            var dayJobs = allJobs.Where(j => j.CreatedAt.Date == day.Date).ToList();

            points.Add(new ActivityPointDto(
                Date: dayStr,
                Found: dayJobs.Count,
                Submitted: dayJobs.Count(j => j.Status == JobStatus.Submitted),
                Skipped: dayJobs.Count(j => j.Status == JobStatus.Skipped),
                Failed: dayJobs.Count(j => j.Status == JobStatus.Failed)
            ));
        }

        return Ok(points);
    }
}

[ApiController]
[Route("api/jobs")]
public class JobsController : ControllerBase
{
    private readonly IJobRepository _jobRepo;

    public JobsController(IJobRepository jobRepo)
    {
        _jobRepo = jobRepo;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<JobOpportunityDto>>> GetAll([FromQuery] string? status, [FromQuery] string? search, CancellationToken ct)
    {
        var jobs = await _jobRepo.GetAllAsync(status, search, ct);
        var dtos = jobs.Select(j => new JobOpportunityDto(
            j.Id, j.ExternalId, j.Title, j.Company, j.Location, j.MinimumSalary, j.MaximumSalary,
            j.Currency, j.EmploymentType, j.WorkType.ToString(), j.IsRemote, j.ExperienceYears, j.PostedDate,
            j.Description, j.Url, j.Status.ToString(),
            string.IsNullOrWhiteSpace(j.Skills) ? new List<string>() : j.Skills.Split(',').Select(s => s.Trim()).ToList(),
            j.ApplicationNotes, j.CreatedAt, j.UpdatedAt
        ));
        return Ok(dtos);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<JobOpportunityDto>> GetById(Guid id, CancellationToken ct)
    {
        var j = await _jobRepo.GetByIdAsync(id, ct);
        if (j == null) return NotFound();

        var dto = new JobOpportunityDto(
            j.Id, j.ExternalId, j.Title, j.Company, j.Location, j.MinimumSalary, j.MaximumSalary,
            j.Currency, j.EmploymentType, j.WorkType.ToString(), j.IsRemote, j.ExperienceYears, j.PostedDate,
            j.Description, j.Url, j.Status.ToString(),
            string.IsNullOrWhiteSpace(j.Skills) ? new List<string>() : j.Skills.Split(',').Select(s => s.Trim()).ToList(),
            j.ApplicationNotes, j.CreatedAt, j.UpdatedAt
        );
        return Ok(dto);
    }

    [HttpPost("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateJobStatusDto dto, CancellationToken ct)
    {
        var job = await _jobRepo.GetByIdAsync(id, ct);
        if (job == null) return NotFound();

        if (Enum.TryParse<JobStatus>(dto.Status, true, out var parsedStatus))
        {
            job.Status = parsedStatus;
        }

        if (!string.IsNullOrWhiteSpace(dto.ApplicationNotes))
        {
            job.ApplicationNotes = dto.ApplicationNotes;
        }

        await _jobRepo.UpdateAsync(job, ct);
        return NoContent();
    }

    [HttpPost("bulk-status")]
    public async Task<IActionResult> BulkUpdateStatus([FromBody] BulkStatusUpdateDto dto, CancellationToken ct)
    {
        if (Enum.TryParse<JobStatus>(dto.Status, true, out var parsedStatus))
        {
            await _jobRepo.BulkUpdateStatusAsync(dto.JobIds, parsedStatus, ct);
        }
        return NoContent();
    }

    [HttpGet("export")]
    public async Task<IActionResult> ExportCsv(CancellationToken ct)
    {
        var jobs = await _jobRepo.GetAllAsync(null, null, ct);
        var sb = new StringBuilder();
        sb.AppendLine("Job ID,Naukri ID,Title,Company,Location,Employment Type,Min Salary (INR),Max Salary (INR),Posted Date,Status,Skills,Url");

        foreach (var j in jobs)
        {
            sb.AppendLine($"\"{j.Id}\",\"{j.ExternalId}\",\"{j.Title.Replace("\"", "\"\"")}\",\"{j.Company.Replace("\"", "\"\"")}\",\"{j.Location}\",\"{j.EmploymentType}\",\"{j.MinimumSalary}\",\"{j.MaximumSalary}\",\"{j.PostedDate:yyyy-MM-dd}\",\"{j.Status}\",\"{j.Skills.Replace("\"", "\"\"")}\",\"{j.Url}\"");
        }

        var bytes = Encoding.UTF8.GetBytes(sb.ToString());
        return File(bytes, "text/csv", $"naukri_jobpilot_history_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv");
    }
}

[ApiController]
[Route("api/automation")]
public class AutomationController : ControllerBase
{
    private readonly IAutomationEngine _engine;
    private readonly ISearchProfileRepository _profileRepo;
    private readonly IAutomationConfigRepository _configRepo;

    public AutomationController(IAutomationEngine engine, ISearchProfileRepository profileRepo, IAutomationConfigRepository configRepo)
    {
        _engine = engine;
        _profileRepo = profileRepo;
        _configRepo = configRepo;
    }

    [HttpPost("start")]
    public async Task<IActionResult> Start(CancellationToken ct)
    {
        var profile = await _profileRepo.GetActiveProfileAsync(ct);
        var config = await _configRepo.GetConfigAsync(ct);
        await _engine.StartAsync(profile, config, ct);
        return Ok(new { Message = "Naukri automation started", State = _engine.CurrentState.ToString() });
    }

    [HttpPost("pause")]
    public async Task<IActionResult> Pause()
    {
        await _engine.PauseAsync();
        return Ok(new { Message = "Naukri automation paused", State = _engine.CurrentState.ToString() });
    }

    [HttpPost("resume")]
    public async Task<IActionResult> Resume()
    {
        await _engine.ResumeAsync();
        return Ok(new { Message = "Naukri automation resumed", State = _engine.CurrentState.ToString() });
    }

    [HttpPost("stop")]
    public async Task<IActionResult> Stop()
    {
        await _engine.StopAsync();
        return Ok(new { Message = "Naukri automation stopped", State = _engine.CurrentState.ToString() });
    }

    [HttpGet("status")]
    public IActionResult GetStatus()
    {
        return Ok(new
        {
            State = _engine.CurrentState.ToString(),
            Session = _engine.CurrentSession
        });
    }
}

[ApiController]
[Route("api/config")]
public class ConfigController : ControllerBase
{
    private readonly ISearchProfileRepository _profileRepo;
    private readonly IAutomationConfigRepository _configRepo;

    public ConfigController(ISearchProfileRepository profileRepo, IAutomationConfigRepository configRepo)
    {
        _profileRepo = profileRepo;
        _configRepo = configRepo;
    }

    [HttpGet("profile")]
    public async Task<ActionResult<SearchProfileDto>> GetProfile(CancellationToken ct)
    {
        var p = await _profileRepo.GetActiveProfileAsync(ct);
        var dto = new SearchProfileDto(
            p.Id, p.Name,
            JsonSerializer.Deserialize<List<string>>(p.KeywordsJson) ?? new(),
            JsonSerializer.Deserialize<List<string>>(p.LocationsJson) ?? new(),
            p.MinimumExperience, p.MaximumExperience, p.MinimumSalary, p.MaximumSalary,
            p.ExpectedCtcLpa,
            p.PostedWithinDays,
            JsonSerializer.Deserialize<List<string>>(p.JobTypesJson) ?? new(),
            JsonSerializer.Deserialize<List<string>>(p.ExcludedCompaniesJson) ?? new(),
            JsonSerializer.Deserialize<List<string>>(p.IncludedCompaniesJson) ?? new(),
            p.IsActive
        );
        return Ok(dto);
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] SearchProfileDto dto, CancellationToken ct)
    {
        var p = await _profileRepo.GetActiveProfileAsync(ct);
        p.Name = dto.Name;
        p.KeywordsJson = JsonSerializer.Serialize(dto.Keywords);
        p.LocationsJson = JsonSerializer.Serialize(dto.Locations);
        p.MinimumExperience = dto.MinimumExperience;
        p.MaximumExperience = dto.MaximumExperience;
        p.MinimumSalary = dto.MinimumSalary;
        p.MaximumSalary = dto.MaximumSalary;
        p.ExpectedCtcLpa = dto.ExpectedCtcLpa;
        p.PostedWithinDays = dto.PostedWithinDays;
        p.JobTypesJson = JsonSerializer.Serialize(dto.JobTypes);
        p.ExcludedCompaniesJson = JsonSerializer.Serialize(dto.ExcludedCompanies);
        p.IncludedCompaniesJson = JsonSerializer.Serialize(dto.IncludedCompanies);
        p.IsActive = dto.IsActive;

        await _profileRepo.SaveProfileAsync(p, ct);
        return NoContent();
    }

    [HttpGet("chrome-profiles")]
    public IActionResult GetChromeProfiles()
    {
        var profiles = ChromeProfileScanner.GetInstalledChromeProfiles();
        return Ok(profiles);
    }

    [HttpGet("runner")]
    public async Task<ActionResult<AutomationConfigDto>> GetRunnerConfig(CancellationToken ct)
    {
        var c = await _configRepo.GetConfigAsync(ct);
        var dto = new AutomationConfigDto(
            c.Id, c.MaxJobsToProcess, c.DelayBetweenActionsSeconds, c.RandomizeDelay,
            c.Headless, c.PreferredBrowser.ToString(), c.SelectedChromeProfile, c.RetryFailedOperations,
            c.MaxRetryCount, c.AutoSave, c.SoundEnabled, c.DesktopNotifications
        );
        return Ok(dto);
    }

    [HttpPut("runner")]
    public async Task<IActionResult> UpdateRunnerConfig([FromBody] AutomationConfigDto dto, CancellationToken ct)
    {
        var c = await _configRepo.GetConfigAsync(ct);
        c.MaxJobsToProcess = dto.MaxJobsToProcess;
        c.DelayBetweenActionsSeconds = dto.DelayBetweenActionsSeconds;
        c.RandomizeDelay = dto.RandomizeDelay;
        c.Headless = dto.Headless;
        if (Enum.TryParse<BrowserType>(dto.PreferredBrowser, true, out var browser))
        {
            c.PreferredBrowser = browser;
        }
        if (!string.IsNullOrWhiteSpace(dto.SelectedChromeProfile))
        {
            c.SelectedChromeProfile = dto.SelectedChromeProfile;
        }
        c.RetryFailedOperations = dto.RetryFailedOperations;
        c.MaxRetryCount = dto.MaxRetryCount;
        c.AutoSave = dto.AutoSave;
        c.SoundEnabled = dto.SoundEnabled;
        c.DesktopNotifications = dto.DesktopNotifications;

        await _configRepo.SaveConfigAsync(c, ct);
        return NoContent();
    }
}

[ApiController]
[Route("api/logs")]
public class LogsController : ControllerBase
{
    private readonly ILogRepository _logRepo;

    public LogsController(ILogRepository logRepo)
    {
        _logRepo = logRepo;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AutomationLogDto>>> GetLogs([FromQuery] string? level, [FromQuery] string? category, [FromQuery] int limit = 100, CancellationToken ct = default)
    {
        var logs = await _logRepo.GetLogsAsync(level, category, limit, ct);
        var dtos = logs.Select(l => new AutomationLogDto(
            l.Id, l.Timestamp, l.Level.ToString(), l.Message, l.Category, l.Details, l.JobId
        ));
        return Ok(dtos);
    }

    [HttpDelete]
    public async Task<IActionResult> ClearLogs(CancellationToken ct)
    {
        await _logRepo.ClearLogsAsync(ct);
        return NoContent();
    }
}

[ApiController]
[Route("api/analytics")]
public class AnalyticsController : ControllerBase
{
    private readonly IJobRepository _jobRepo;

    public AnalyticsController(IJobRepository jobRepo)
    {
        _jobRepo = jobRepo;
    }

    [HttpGet]
    public async Task<ActionResult<AnalyticsSummaryDto>> GetAnalytics(CancellationToken ct)
    {
        var jobs = (await _jobRepo.GetAllAsync(null, null, ct)).ToList();
        var today = DateTime.UtcNow.Date;
        int appsToday = jobs.Count(j => j.CreatedAt.Date == today && j.Status == JobStatus.Submitted);

        int submitted = jobs.Count(j => j.Status == JobStatus.Submitted);
        int skipped = jobs.Count(j => j.Status == JobStatus.Skipped);
        int failed = jobs.Count(j => j.Status == JobStatus.Failed);
        int totalProcessed = submitted + skipped + failed;

        double successRate = totalProcessed > 0 ? Math.Round((double)submitted / totalProcessed * 100, 1) : 100.0;

        var topCompanies = jobs
            .GroupBy(j => j.Company)
            .OrderByDescending(g => g.Count())
            .Take(5)
            .Select(g => new CategoryMetricDto(g.Key, g.Count(), jobs.Count > 0 ? Math.Round((double)g.Count() / jobs.Count * 100, 1) : 0))
            .ToList();

        var topLocations = jobs
            .GroupBy(j => j.Location)
            .OrderByDescending(g => g.Count())
            .Take(5)
            .Select(g => new CategoryMetricDto(g.Key, g.Count(), jobs.Count > 0 ? Math.Round((double)g.Count() / jobs.Count * 100, 1) : 0))
            .ToList();

        var skillsAll = jobs.SelectMany(j => j.Skills.Split(',').Select(s => s.Trim())).Where(s => !string.IsNullOrEmpty(s));
        var topKeywords = skillsAll
            .GroupBy(s => s)
            .OrderByDescending(g => g.Count())
            .Take(5)
            .Select(g => new CategoryMetricDto(g.Key, g.Count(), skillsAll.Any() ? Math.Round((double)g.Count() / skillsAll.Count() * 100, 1) : 0))
            .ToList();

        var weeklyActivity = new List<ActivityPointDto>();
        for (int i = 6; i >= 0; i--)
        {
            var day = today.AddDays(-i);
            var dayJobs = jobs.Where(j => j.CreatedAt.Date == day.Date).ToList();
            weeklyActivity.Add(new ActivityPointDto(
                Date: day.ToString("ddd"),
                Found: dayJobs.Count,
                Submitted: dayJobs.Count(j => j.Status == JobStatus.Submitted),
                Skipped: dayJobs.Count(j => j.Status == JobStatus.Skipped),
                Failed: dayJobs.Count(j => j.Status == JobStatus.Failed)
            ));
        }

        var monthlyActivity = new List<ActivityPointDto>();
        for (int i = 4; i >= 0; i--)
        {
            var weekStart = today.AddDays(-i * 7);
            var weekEnd = weekStart.AddDays(7);
            var weekJobs = jobs.Where(j => j.CreatedAt >= weekStart && j.CreatedAt < weekEnd).ToList();
            monthlyActivity.Add(new ActivityPointDto(
                Date: $"Wk {5 - i}",
                Found: weekJobs.Count,
                Submitted: weekJobs.Count(j => j.Status == JobStatus.Submitted),
                Skipped: weekJobs.Count(j => j.Status == JobStatus.Skipped),
                Failed: weekJobs.Count(j => j.Status == JobStatus.Failed)
            ));
        }

        var result = new AnalyticsSummaryDto(
            ApplicationsToday: appsToday,
            SuccessRate: successRate,
            AvgTimePerSubmissionMinutes: 1.2,
            TopCompanies: topCompanies,
            TopLocations: topLocations,
            TopKeywords: topKeywords,
            WeeklyActivity: weeklyActivity,
            MonthlyActivity: monthlyActivity
        );

        return Ok(result);
    }
}
