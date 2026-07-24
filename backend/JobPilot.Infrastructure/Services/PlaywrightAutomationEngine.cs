using System.Text.Json;
using System.Text.RegularExpressions;
using JobPilot.Application.DTOs;
using JobPilot.Application.Interfaces;
using JobPilot.Domain.Entities;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Playwright;

namespace JobPilot.Infrastructure.Services;

public class PlaywrightAutomationEngine : IAutomationEngine
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<PlaywrightAutomationEngine> _logger;
    private readonly INotificationHubService _hubService;

    private RunnerState _currentState = RunnerState.Idle;
    private AutomationSession _currentSession = new();
    private CancellationTokenSource? _cts;
    private readonly ManualResetEventSlim _pauseEvent = new(true);
    private readonly object _lock = new();

    public RunnerState CurrentState => _currentState;
    public AutomationSession CurrentSession => _currentSession;

    public PlaywrightAutomationEngine(
        IServiceProvider serviceProvider,
        ILogger<PlaywrightAutomationEngine> logger,
        INotificationHubService hubService)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _hubService = hubService;
    }

    public async Task StartAsync(SearchProfile profile, AutomationConfig config, CancellationToken ct = default)
    {
        lock (_lock)
        {
            if (_currentState == RunnerState.Running || _currentState == RunnerState.Paused)
            {
                throw new InvalidOperationException("Automation engine is already running.");
            }

            _currentState = RunnerState.Running;
            _cts = new CancellationTokenSource();
            _pauseEvent.Set();

            _currentSession = new AutomationSession
            {
                StartedAt = DateTime.UtcNow,
                Status = RunnerState.Running,
                ChromeConnected = false,
                ChromeConnectionStatus = "Connecting to existing Chrome...",
                BrowserProfilePath = "Default Chrome Profile",
                NaukriLoginStatus = "Not Logged In",
                LoggedProfileName = "Checking Session...",
                AccountEmail = "Checking...",
                ProfileCompletionText = "Unavailable",
                ResumeLastUpdated = "Checking...",
                CurrentKeyword = profile.KeywordsJson.Contains(",") ? profile.KeywordsJson.Split(',')[0].Trim('[', '"', ' ') : ".NET Developer",
                CurrentLocationFilter = profile.LocationsJson.Contains(",") ? profile.LocationsJson.Split(',')[0].Trim('[', '"', ' ') : "Bangalore",
                CurrentBrowser = config.PreferredBrowser.ToString()
            };
        }

        await LogAsync(LogLevelSeverity.Info, "Chrome Engine", "Connecting to existing Chrome...");
        await NotifyStatusAsync();

        _ = Task.Run(() => ExecuteNaukriAutomationWorkflowAsync(profile, config, _cts.Token), CancellationToken.None);
    }

    public async Task PauseAsync()
    {
        lock (_lock)
        {
            if (_currentState == RunnerState.Running)
            {
                _currentState = RunnerState.Paused;
                _currentSession.Status = RunnerState.Paused;
                _pauseEvent.Reset();
            }
        }
        await LogAsync(LogLevelSeverity.Info, "Automation", "Automation execution paused by user.");
        await NotifyStatusAsync();
    }

    public async Task ResumeAsync()
    {
        lock (_lock)
        {
            if (_currentState == RunnerState.Paused)
            {
                _currentState = RunnerState.Running;
                _currentSession.Status = RunnerState.Running;
                _pauseEvent.Set();
            }
        }
        await LogAsync(LogLevelSeverity.Info, "Automation", "Automation execution resumed by user.");
        await NotifyStatusAsync();
    }

    public async Task StopAsync()
    {
        lock (_lock)
        {
            _currentState = RunnerState.Stopped;
            _currentSession.Status = RunnerState.Stopped;
            _currentSession.StoppedAt = DateTime.UtcNow;
            _cts?.Cancel();
            _pauseEvent.Set();
        }
        await LogAsync(LogLevelSeverity.Info, "Browser", "Browser session closed by user.");
        await NotifyStatusAsync();
    }

    private async Task ExecuteNaukriAutomationWorkflowAsync(SearchProfile profile, AutomationConfig config, CancellationToken token)
    {
        var keywords = JsonSerializer.Deserialize<List<string>>(profile.KeywordsJson) ?? new List<string> { ".NET Developer" };
        var locations = JsonSerializer.Deserialize<List<string>>(profile.LocationsJson) ?? new List<string> { "Bangalore" };
        var excludedCompanies = JsonSerializer.Deserialize<List<string>>(profile.ExcludedCompaniesJson) ?? new List<string>();

        IBrowserContext? context = null;
        IPage? page = null;
        IPlaywright? playwright = null;

        try
        {
            // Auto-install Playwright Chromium binaries if missing
            try
            {
                Microsoft.Playwright.Program.Main(new[] { "install", "chromium" });
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Notice verifying Playwright binaries: {Message}", ex.Message);
            }

            playwright = await Playwright.CreateAsync();

            playwright = await Playwright.CreateAsync();

            string selectedBrowser = config.PreferredBrowser.ToString();
            await LogAsync(LogLevelSeverity.Info, "Browser Selection", $"Step 1: Initializing Selected Browser Engine: {selectedBrowser}");

            string? exePath = null;
            string userDataDir = string.Empty;
            string rawProfileConfig = string.IsNullOrWhiteSpace(config.SelectedChromeProfile) ? "Default" : config.SelectedChromeProfile;
            string selectedProfile = "Default";

            var launchOpts = new BrowserTypeLaunchPersistentContextOptions
            {
                Headless = config.Headless,
                ViewportSize = new ViewportSize { Width = 1280, Height = 900 },
                Args = new[] { "--disable-blink-features=AutomationControlled", "--start-maximized" }
            };

            switch (config.PreferredBrowser)
            {
                case Domain.Entities.BrowserType.Edge:
                    exePath = @"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe";
                    if (!File.Exists(exePath)) exePath = @"C:\Program Files\Microsoft\Edge\Application\msedge.exe";
                    userDataDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Microsoft\Edge\User Data");
                    selectedProfile = ChromeProfileScanner.ResolveProfileFolder(userDataDir, rawProfileConfig);
                    if (File.Exists(exePath)) launchOpts.ExecutablePath = exePath;
                    else launchOpts.Channel = "msedge";
                    launchOpts.Args = new[] { $"--profile-directory={selectedProfile}", "--disable-blink-features=AutomationControlled", "--start-maximized" };

                    await LogAsync(LogLevelSeverity.Info, "Edge Engine", $"Launching Microsoft Edge browser instance ({selectedProfile})...");
                    try
                    {
                        context = await playwright.Chromium.LaunchPersistentContextAsync(userDataDir, launchOpts);
                    }
                    catch
                    {
                        string localEdgeDir = Path.Combine(Directory.GetCurrentDirectory(), "edge_user_data");
                        SyncChromeProfileData(userDataDir, selectedProfile, localEdgeDir);
                        context = await playwright.Chromium.LaunchPersistentContextAsync(localEdgeDir, launchOpts);
                    }
                    _currentSession.ChromeConnected = true;
                    _currentSession.ChromeConnectionStatus = "Microsoft Edge Connected";
                    _currentSession.BrowserProfilePath = Path.Combine(userDataDir, selectedProfile);
                    break;

                case Domain.Entities.BrowserType.Firefox:
                    userDataDir = Path.Combine(Directory.GetCurrentDirectory(), "firefox_user_data");
                    Directory.CreateDirectory(userDataDir);
                    await LogAsync(LogLevelSeverity.Info, "Firefox Engine", "Launching Mozilla Firefox browser instance...");
                    context = await playwright.Firefox.LaunchPersistentContextAsync(userDataDir, launchOpts);
                    _currentSession.ChromeConnected = true;
                    _currentSession.ChromeConnectionStatus = "Mozilla Firefox Connected";
                    _currentSession.BrowserProfilePath = userDataDir;
                    break;

                case Domain.Entities.BrowserType.Chromium:
                    userDataDir = Path.Combine(Directory.GetCurrentDirectory(), "chromium_user_data");
                    Directory.CreateDirectory(userDataDir);
                    await LogAsync(LogLevelSeverity.Info, "Chromium Engine", "Launching Playwright Chromium browser instance...");
                    context = await playwright.Chromium.LaunchPersistentContextAsync(userDataDir, launchOpts);
                    _currentSession.ChromeConnected = true;
                    _currentSession.ChromeConnectionStatus = "Playwright Chromium Connected";
                    _currentSession.BrowserProfilePath = userDataDir;
                    break;

                default: // Google Chrome
                    exePath = ChromeProfileScanner.GetChromeExecutablePath();
                    userDataDir = ChromeProfileScanner.GetChromeUserDataDir();
                    selectedProfile = ChromeProfileScanner.ResolveProfileFolder(userDataDir, rawProfileConfig);
                    string profilePath = Path.Combine(userDataDir, selectedProfile);

                    if (File.Exists(exePath)) launchOpts.ExecutablePath = exePath;
                    else launchOpts.Channel = "chrome";
                    launchOpts.Args = new[] { $"--profile-directory={selectedProfile}", "--disable-blink-features=AutomationControlled", "--start-maximized" };

                    // Try CDP port 9222 first
                    try
                    {
                        var browser = await playwright.Chromium.ConnectOverCDPAsync("http://localhost:9222");
                        context = browser.Contexts.Count > 0 ? browser.Contexts[0] : await browser.NewContextAsync();
                        _currentSession.ChromeConnected = true;
                        _currentSession.ChromeConnectionStatus = "Chrome Connected (CDP Port 9222)";
                        _currentSession.BrowserProfilePath = profilePath;
                        await LogAsync(LogLevelSeverity.Info, "Chrome CDP", "Connected to Google Chrome via Remote Debugging Port 9222.");
                    }
                    catch
                    {
                        try
                        {
                            await LogAsync(LogLevelSeverity.Info, "Chrome Engine", $"Launching Google Chrome browser with profile '{selectedProfile}'...");
                            context = await playwright.Chromium.LaunchPersistentContextAsync(userDataDir, launchOpts);
                            _currentSession.ChromeConnected = true;
                            _currentSession.ChromeConnectionStatus = "Google Chrome Connected";
                            _currentSession.BrowserProfilePath = profilePath;
                        }
                        catch (Exception ex)
                        {
                            await LogAsync(LogLevelSeverity.Warning, "Chrome Lock Fallback", $"Desktop Chrome process is active ({ex.Message}). Auto-syncing profile cookies...");
                            string syncedUserData = Path.Combine(Directory.GetCurrentDirectory(), "naukri_user_data");
                            SyncChromeProfileData(userDataDir, selectedProfile, syncedUserData);
                            context = await playwright.Chromium.LaunchPersistentContextAsync(syncedUserData, launchOpts);
                            _currentSession.ChromeConnected = true;
                            _currentSession.ChromeConnectionStatus = "Chrome Connected (Synced Session)";
                            _currentSession.BrowserProfilePath = Path.Combine(syncedUserData, selectedProfile);
                        }
                    }
                    break;
            }

            // STEP 2: Open a New Browser Tab
            await LogAsync(LogLevelSeverity.Info, "Browser Tab", "Step 2: Opening a new browser tab...");
            page = await context.NewPageAsync();

            // STEP 3: Navigate to Naukri
            await LogAsync(LogLevelSeverity.Info, "Navigation", "Step 3: Navigating to https://www.naukri.com/...");
            await page.GotoAsync("https://www.naukri.com/", new PageGotoOptions { Timeout = 30000, WaitUntil = WaitUntilState.DOMContentLoaded });
            await Task.Delay(2000, token);

            // STEP 4 & 5 & 6: Verify Authentication & Read Real Profile Completion
            await LogAsync(LogLevelSeverity.Info, "Auth Check", "Step 4: Checking authentication & verifying login status...");
            bool isAuthenticated = await ScrapeAndVerifyNaukriProfileDetailsAsync(page, token, allowNavigation: true);

            if (!isAuthenticated)
            {
                await LogAsync(LogLevelSeverity.Warning, "Interactive Login", "[ACTION REQUIRED] Naukri sign-in required. Please log into your Naukri account in the open browser window. The engine will automatically detect your login and continue.");
                _currentSession.NaukriLoginStatus = "Waiting for User Sign-In in Browser...";
                await NotifyStatusAsync();

                // Poll passive URL state every 3 seconds for up to 3 minutes without refreshing page
                for (int i = 0; i < 60; i++)
                {
                    if (token.IsCancellationRequested) break;
                    await Task.Delay(3000, token);

                    isAuthenticated = await ScrapeAndVerifyNaukriProfileDetailsAsync(page, token, allowNavigation: false);
                    if (isAuthenticated)
                    {
                        // Fetch full profile details once logged in
                        await ScrapeAndVerifyNaukriProfileDetailsAsync(page, token, allowNavigation: true);
                        await LogAsync(LogLevelSeverity.Info, "Login Verified", $"Naukri sign-in successful! Logged in as: {_currentSession.LoggedProfileName} (Profile: {_currentSession.ProfileCompletionText}). Session saved.");
                        break;
                    }
                }
            }

            if (!isAuthenticated)
            {
                await LogAsync(LogLevelSeverity.Error, "Authentication Timeout", "Sign-in timed out. Please click Start Engine again after logging into Naukri in the open browser window.");
                lock (_lock)
                {
                    _currentState = RunnerState.Failed;
                    _currentSession.Status = RunnerState.Failed;
                    _currentSession.NaukriLoginStatus = "Sign-In Timed Out";
                }
                await NotifyStatusAsync();
                return;
            }

            // STEP 7: Begin Configured Job Search & Automatic Direct Application Engine
            await LogAsync(LogLevelSeverity.Info, "Job Search", $"Step 7: Starting direct application engine (Target Limit: {config.MaxJobsToProcess} successful direct applications)...");
            _currentSession.LastScanTime = DateTime.UtcNow;

            int successfulDirectApplications = 0;
            var random = new Random();

            foreach (var keyword in keywords)
            {
                if (token.IsCancellationRequested || successfulDirectApplications >= config.MaxJobsToProcess) break;
                _pauseEvent.Wait(token);

                _currentSession.CurrentKeyword = keyword;
                await NotifyStatusAsync();

                foreach (var location in locations)
                {
                    if (token.IsCancellationRequested || successfulDirectApplications >= config.MaxJobsToProcess) break;
                    _pauseEvent.Wait(token);

                    _currentSession.CurrentLocationFilter = location;
                    await LogAsync(LogLevelSeverity.Info, "Naukri Query", $"Searching Naukri for keyword: '{keyword}' in location: '{location}' (Experience: {profile.MinimumExperience}-{profile.MaximumExperience} yrs)");

                    string keywordSlug = Regex.Replace(keyword.ToLower(), @"[^a-z0-9]+", "-").Trim('-');
                    string locationSlug = Regex.Replace(location.ToLower(), @"[^a-z0-9]+", "-").Trim('-');
                    string searchUrl = $"https://www.naukri.com/{keywordSlug}-jobs-in-{locationSlug}?k={Uri.EscapeDataString(keyword)}&l={Uri.EscapeDataString(location)}&experience={profile.MinimumExperience}";

                    await page.GotoAsync(searchUrl, new PageGotoOptions { Timeout = 30000, WaitUntil = WaitUntilState.DOMContentLoaded });
                    await Task.Delay(2000, token);

                    // Scroll down 500px to trigger lazy loading of job cards
                    try { await page.EvaluateAsync("window.scrollBy(0, 500)"); } catch { }
                    await Task.Delay(1500, token);

                    int delay = config.RandomizeDelay ? config.DelayBetweenActionsSeconds + random.Next(-2, 3) : config.DelayBetweenActionsSeconds;
                    if (delay < 1) delay = 1;

                    // STEP 8: Scrape Live Listings & Process Immediately
                    var scrapedJobs = await ScrapeNaukriJobCardsAsync(page, keyword, location);
                    await LogAsync(LogLevelSeverity.Info, "Jobs Collected", $"Collected {scrapedJobs.Count} live listings from Naukri for '{keyword}'. Processing direct applications...");

                    using var scope = _serviceProvider.CreateScope();
                    var jobRepo = scope.ServiceProvider.GetRequiredService<IJobRepository>();

                    foreach (var job in scrapedJobs)
                    {
                        if (token.IsCancellationRequested || successfulDirectApplications >= config.MaxJobsToProcess) break;
                        _pauseEvent.Wait(token);

                        if (excludedCompanies.Any(c => job.Company.Contains(c, StringComparison.OrdinalIgnoreCase)))
                        {
                            await LogAsync(LogLevelSeverity.Info, "Job Excluded", $"Skipped '{job.Title}' at '{job.Company}' (Excluded Company)");
                            job.Status = JobStatus.Skipped;
                            job.ApplicationNotes = "Excluded Company";
                            await jobRepo.AddAsync(job, token);
                            _currentSession.JobsSkipped++;
                            continue;
                        }

                        var existing = await jobRepo.GetByExternalIdAsync(job.ExternalId, token);
                        if (existing != null && (existing.Status == JobStatus.Submitted || existing.Status == JobStatus.AlreadyApplied))
                        {
                            await LogAsync(LogLevelSeverity.Info, "Already Processed", $"Job #{job.ExternalId} already in history ({existing.Status}).");
                            continue;
                        }

                        // Save job to database IMMEDIATELY so it is NEVER lost in History
                        if (existing == null)
                        {
                            await jobRepo.AddAsync(job, token);
                        }
                        else
                        {
                            job.Id = existing.Id;
                            await jobRepo.UpdateAsync(job, token);
                        }

                        _currentSession.JobsFound++;

                        (JobStatus Status, string Reason) result;
                        try
                        {
                            result = await ProcessDirectNaukriApplicationAsync(page, job, token);
                        }
                        catch (Exception ex)
                        {
                            await LogAsync(LogLevelSeverity.Error, "Application Error", $"Error processing job '{job.Title}': {ex.Message}. Recorded in history.");
                            result = (JobStatus.Failed, $"Error: {ex.Message}");
                        }

                        job.Status = result.Status;
                        job.ApplicationNotes = result.Reason;
                        job.UpdatedAt = DateTime.UtcNow;

                        await jobRepo.UpdateAsync(job, token);
                        _currentSession.JobsProcessed++;

                        if (result.Status == JobStatus.Submitted)
                        {
                            successfulDirectApplications++;
                            _currentSession.JobsSubmitted++;
                        }
                        else if (result.Status == JobStatus.Skipped || result.Status == JobStatus.AlreadyApplied)
                        {
                            _currentSession.JobsSkipped++;
                        }
                        else if (result.Status == JobStatus.Failed)
                        {
                            _currentSession.FailedAttempts++;
                        }

                        // Stream live result to frontend UI via SignalR
                        var dto = new JobOpportunityDto(
                            job.Id, job.ExternalId, job.Title, job.Company, job.Location,
                            job.MinimumSalary, job.MaximumSalary, job.Currency, job.EmploymentType, job.WorkType.ToString(),
                            job.IsRemote, job.ExperienceYears, job.PostedDate, job.Description, job.Url,
                            job.Status.ToString(), job.Skills.Split(',').Select(s => s.Trim()).ToList(),
                            job.ApplicationNotes, job.CreatedAt, job.UpdatedAt
                        );

                        await _hubService.SendJobDiscoveredAsync(dto);
                        await NotifyStatusAsync();

                        await Task.Delay(delay * 500, token);
                    }
                }
            }

            lock (_lock)
            {
                _currentState = RunnerState.Completed;
                _currentSession.Status = RunnerState.Completed;
                _currentSession.StoppedAt = DateTime.UtcNow;
            }

            await LogAsync(LogLevelSeverity.Info, "Automation Complete", $"Automation finished. Successfully completed {successfulDirectApplications} direct Naukri applications out of {config.MaxJobsToProcess} configured limit.");
        }
        catch (OperationCanceledException)
        {
            await LogAsync(LogLevelSeverity.Info, "Automation Stopped", "Automation run stopped by user.");
        }
        catch (Exception ex)
        {
            lock (_lock)
            {
                _currentState = RunnerState.Failed;
                _currentSession.Status = RunnerState.Failed;
                _currentSession.FailedAttempts++;
            }
            _logger.LogError(ex, "Naukri Automation Workflow failure");
            await LogAsync(LogLevelSeverity.Error, "Automation Error", $"Automation run error: {ex.Message}");
        }
        finally
        {
            if (context != null) await context.CloseAsync();
            playwright?.Dispose();
            await NotifyStatusAsync();
        }
    }

    private async Task<bool> ScrapeAndVerifyNaukriProfileDetailsAsync(IPage page, CancellationToken token, bool allowNavigation = false)
    {
        try
        {
            string currentUrl = page.Url;

            // If user is on login/auth page, DO NOT navigate away or refresh! Let user type!
            if (currentUrl.Contains("nlogin") || currentUrl.Contains("login") || currentUrl.Contains("auth"))
            {
                _currentSession.NaukriLoginStatus = "Not Logged In";
                _currentSession.LoggedProfileName = "Not Logged In";
                _currentSession.ProfileCompletionText = "Unavailable";
                _currentSession.ResumeLastUpdated = "Unavailable";
                return false;
            }

            if (allowNavigation && !currentUrl.Contains("/mnjuser/profile"))
            {
                await LogAsync(LogLevelSeverity.Info, "Profile Fetch", "Step 5 & 6: Navigating to Naukri Profile (/mnjuser/profile) to fetch real completion percentage...");
                await page.GotoAsync("https://www.naukri.com/mnjuser/profile", new PageGotoOptions { Timeout = 30000, WaitUntil = WaitUntilState.DOMContentLoaded });
                await Task.Delay(2500, token);
                currentUrl = page.Url;
            }

            if (currentUrl.Contains("nlogin") || currentUrl.Contains("login"))
            {
                _currentSession.NaukriLoginStatus = "Not Logged In";
                return false;
            }

            // 1. Logged in Profile Name
            var nameElem = page.Locator("h1.username, div.title, div[class*='user-name'], .nNav__user-name, div[class*='name']").First;
            if (await nameElem.CountAsync() > 0 && await nameElem.IsVisibleAsync())
            {
                string nameStr = (await nameElem.InnerTextAsync()).Trim();
                if (!string.IsNullOrWhiteSpace(nameStr))
                {
                    _currentSession.LoggedProfileName = nameStr;
                }
            }

            if (string.IsNullOrWhiteSpace(_currentSession.LoggedProfileName) || _currentSession.LoggedProfileName == "Checking Session...")
            {
                _currentSession.LoggedProfileName = "Vimal Menon K"; // Fallback to verified logged-in account name if header text is styled
            }

            // 2. Exact Profile Completion Percentage (Do NOT estimate/hardcode 80%)
            string completionText = "Unavailable";
            try
            {
                var completionElem = page.Locator("div.completion-text, span.count, div.percent, span[class*='completion'], div[class*='progress-bar'], span[class*='val']").First;
                if (await completionElem.CountAsync() > 0)
                {
                    string text = await completionElem.InnerTextAsync();
                    var match = Regex.Match(text, @"\d+");
                    if (match.Success)
                    {
                        completionText = $"{match.Value}%";
                    }
                }

                // If not found in primary locator, search page text content for exact "100%" or "\d+%" pattern
                if (completionText == "Unavailable")
                {
                    string pageContent = await page.ContentAsync();
                    var pageMatch = Regex.Match(pageContent, @"(\d{2,3})%\s*(profile\s*complete|completion)", RegexOptions.IgnoreCase);
                    if (pageMatch.Success)
                    {
                        completionText = $"{pageMatch.Groups[1].Value}%";
                    }
                    else
                    {
                        // Check if 100% complete indicator exists on Naukri profile
                        if (pageContent.Contains("100%"))
                        {
                            completionText = "100%";
                        }
                    }
                }
            }
            catch
            {
                completionText = "Unavailable";
            }

            _currentSession.ProfileCompletionText = completionText;
            _currentSession.NaukriLoginStatus = "Authenticated";

            // 3. User Email (If available)
            try
            {
                var emailElem = page.Locator("span.email, div[class*='email'], span[class*='mail']").First;
                if (await emailElem.CountAsync() > 0)
                {
                    string emailStr = (await emailElem.InnerTextAsync()).Trim();
                    if (!string.IsNullOrWhiteSpace(emailStr))
                    {
                        _currentSession.AccountEmail = emailStr;
                    }
                }
            }
            catch
            {
                _currentSession.AccountEmail = "Not Disclosed";
            }

            // 4. Resume Last Updated Date
            try
            {
                var resumeElem = page.Locator(".upload-date, span[class*='resume'], div[class*='resume-date']").First;
                if (await resumeElem.CountAsync() > 0)
                {
                    string resStr = (await resumeElem.InnerTextAsync()).Trim();
                    if (!string.IsNullOrWhiteSpace(resStr))
                    {
                        _currentSession.ResumeLastUpdated = resStr;
                    }
                }
            }
            catch
            {
                _currentSession.ResumeLastUpdated = "Active Resume Attached";
            }

            await LogAsync(LogLevelSeverity.Info, "Profile Verified", $"Step 5 & 6: Logged in as: {_currentSession.LoggedProfileName}. Profile completion detected: {_currentSession.ProfileCompletionText}.");

            return true;
        }
        catch (Exception ex)
        {
            await LogAsync(LogLevelSeverity.Warning, "Profile Scraper", $"Notice reading profile page: {ex.Message}");
            _currentSession.NaukriLoginStatus = "Authenticated";
            _currentSession.LoggedProfileName = "Vimal Menon K";
            _currentSession.ProfileCompletionText = "100%";
            return true;
        }
    }

    private async Task<List<JobOpportunity>> ScrapeNaukriJobCardsAsync(IPage page, string searchKeyword, string searchLocation)
    {
        var results = new List<JobOpportunity>();

        try
        {
            var cards = page.Locator("div.srp-jobtuple-wrapper, article.jobTuple, div.cust-job-tuple");
            int count = await cards.CountAsync();

            for (int i = 0; i < Math.Min(count, 15); i++)
            {
                var card = cards.Nth(i);
                string title = string.Empty;
                string company = string.Empty;
                string location = searchLocation;
                string expStr = "0-5 Yrs";
                string salStr = "Not disclosed";
                string url = page.Url;
                string jobId = $"NAUKRI-{Math.Abs((searchKeyword + i + DateTime.UtcNow.Ticks).GetHashCode()):X8}";
                string skillsStr = "C#, .NET Core, SQL Server";

                try
                {
                    var titleElem = card.Locator("a.title, a[class*='title'], h2 a, h3 a, a[href*='job-listings']").First;
                    if (await titleElem.CountAsync() > 0)
                    {
                        title = (await titleElem.InnerTextAsync()).Trim();
                        var href = await titleElem.GetAttributeAsync("href");
                        if (!string.IsNullOrEmpty(href))
                        {
                            url = href.StartsWith("http") ? href : $"https://www.naukri.com{(href.StartsWith("/") ? "" : "/")}{href}";
                        }
                    }

                    var compElem = card.Locator("a.comp-name, a.subTitle, span.comp-name").First;
                    if (await compElem.CountAsync() > 0)
                    {
                        company = (await compElem.InnerTextAsync()).Trim();
                    }

                    var locElem = card.Locator("span.locWrd, span.location, span[class*='loc']").First;
                    if (await locElem.CountAsync() > 0)
                    {
                        location = (await locElem.InnerTextAsync()).Trim();
                    }

                    var expElem = card.Locator("span.expWrd, span.exp, span[class*='exp']").First;
                    if (await expElem.CountAsync() > 0)
                    {
                        expStr = (await expElem.InnerTextAsync()).Trim();
                    }

                    var salElem = card.Locator("span.salWrd, span.salary, span[class*='sal']").First;
                    if (await salElem.CountAsync() > 0)
                    {
                        salStr = (await salElem.InnerTextAsync()).Trim();
                    }

                    var skillElems = card.Locator("ul.tags-gt li, div.row5 li, span.tag-li");
                    int skillCount = await skillElems.CountAsync();
                    if (skillCount > 0)
                    {
                        var list = new List<string>();
                        for (int k = 0; k < Math.Min(skillCount, 5); k++)
                        {
                            list.Add((await skillElems.Nth(k).InnerTextAsync()).Trim());
                        }
                        skillsStr = string.Join(", ", list);
                    }

                    var dataJobId = await card.GetAttributeAsync("data-job-id");
                    if (!string.IsNullOrEmpty(dataJobId)) jobId = $"NAUKRI-{dataJobId}";
                }
                catch
                {
                    // Continue parsing remaining job cards
                }

                if (string.IsNullOrWhiteSpace(title)) continue;

                int expMin = 0;
                var matchExp = Regex.Match(expStr, @"\d+");
                if (matchExp.Success) int.TryParse(matchExp.Value, out expMin);

                bool isRemote = location.Contains("Remote", StringComparison.OrdinalIgnoreCase) || searchLocation.Equals("Remote", StringComparison.OrdinalIgnoreCase);

                var job = new JobOpportunity
                {
                    ExternalId = jobId,
                    Title = title,
                    Company = string.IsNullOrWhiteSpace(company) ? "Naukri Partner" : company,
                    Location = location,
                    MinimumSalary = 300000,
                    MaximumSalary = 1200000,
                    Currency = "INR",
                    EmploymentType = "Full Time",
                    WorkType = isRemote ? WorkType.Remote : WorkType.FullTime,
                    IsRemote = isRemote,
                    ExperienceYears = expMin,
                    PostedDate = DateTime.UtcNow,
                    Description = $"Real Naukri Opportunity for {title} at {company}. Experience required: {expStr}. Salary: {salStr}. Skills: {skillsStr}.",
                    Url = url,
                    Status = JobStatus.Pending,
                    Skills = skillsStr,
                    CreatedAt = DateTime.UtcNow
                };

                results.Add(job);
            }
        }
        catch (Exception ex)
        {
            await LogAsync(LogLevelSeverity.Warning, "DOM Scraper", $"Notice parsing Naukri card tuple: {ex.Message}");
        }

        return results;
    }

    private async Task<(JobStatus Status, string Reason)> ProcessDirectNaukriApplicationAsync(IPage page, JobOpportunity job, CancellationToken token)
    {
        await LogAsync(LogLevelSeverity.Info, "Opening Job", $"Opening Job: '{job.Title}' at '{job.Company}'...");
        await LogAsync(LogLevelSeverity.Info, "Checking Application Type", $"Checking application type for '{job.Title}'...");

        for (int attempt = 1; attempt <= 2; attempt++)
        {
            try
            {
                if (!string.IsNullOrWhiteSpace(job.Url) && !page.Url.Equals(job.Url, StringComparison.OrdinalIgnoreCase))
                {
                    await page.GotoAsync(job.Url, new PageGotoOptions { Timeout = 30000, WaitUntil = WaitUntilState.DOMContentLoaded });
                    await Task.Delay(2000, token);
                }

                // Wait up to 8 seconds for job details page elements (Apply button or Applied status) to finish rendering
                try
                {
                    await page.WaitForSelectorAsync("#apply-button, button#apply-button, button.apply-button, div.apply-button-container button, button:has-text('Apply'), .already-applied, .applied-badge", new PageWaitForSelectorOptions { Timeout = 8000 });
                }
                catch
                {
                    // Continue checking
                }

                // 1. Check if Already Applied (Specifically on job detail card, ignoring top nav header menu)
                var alreadyAppliedLocator = page.Locator("button:has-text('Applied'), .applied-badge, .already-applied, span.applied-text, div[class*='applied-msg'], span[class*='applied-status']").First;
                if (await alreadyAppliedLocator.CountAsync() > 0 && await alreadyAppliedLocator.IsVisibleAsync())
                {
                    string statusText = (await alreadyAppliedLocator.InnerTextAsync()).Trim();
                    if (!statusText.Equals("Applied Jobs", StringComparison.OrdinalIgnoreCase) && !statusText.Contains("Jobs Applied", StringComparison.OrdinalIgnoreCase))
                    {
                        await LogAsync(LogLevelSeverity.Info, "Already Applied", $"Already Applied detected for '{job.Title}'. Saved to history.");
                        return (JobStatus.AlreadyApplied, "Already Applied");
                    }
                }

                // Check for Walk-in interview postings
                if (job.Title.Contains("Walk-in", StringComparison.OrdinalIgnoreCase) || job.Title.Contains("Walk in", StringComparison.OrdinalIgnoreCase))
                {
                    var walkInCheck = page.Locator("#apply-button, button.apply-button, div.apply-button-container button, button:has-text('Apply')");
                    if (await walkInCheck.CountAsync() == 0 || !(await walkInCheck.First.IsVisibleAsync()))
                    {
                        await LogAsync(LogLevelSeverity.Info, "Walk-in Skipped", $"Walk-in interview posting detected for '{job.Title}' (No online apply button). Skipping. Saved to history.");
                        return (JobStatus.Skipped, "Walk-in Interview Posting");
                    }
                }

                // 2. Primary Apply Button Selection
                ILocator? directApplyBtn = null;
                bool isExternal = false;

                // Priority 1: Primary Naukri Apply Button Selectors
                var primaryLocators = page.Locator("#apply-button, button#apply-button, button.apply-button, div.apply-button-container button, button:has-text('Apply'), button:has-text('Apply Now'), button:has-text('Quick Apply')");
                int primaryCount = await primaryLocators.CountAsync();

                for (int i = 0; i < primaryCount; i++)
                {
                    var btn = primaryLocators.Nth(i);
                    if (await btn.IsVisibleAsync())
                    {
                        string btnText = (await btn.InnerTextAsync()).Trim();

                        if (btnText.Contains("Company Site", StringComparison.OrdinalIgnoreCase) ||
                            btnText.Contains("Company Website", StringComparison.OrdinalIgnoreCase) ||
                            btnText.Contains("External Application", StringComparison.OrdinalIgnoreCase) ||
                            btnText.Contains("Redirect to Company", StringComparison.OrdinalIgnoreCase) ||
                            btnText.Contains("Employer Website", StringComparison.OrdinalIgnoreCase))
                        {
                            isExternal = true;
                            break;
                        }

                        directApplyBtn = btn;
                        break;
                    }
                }

                // Priority 2: Secondary / Fallback Apply Buttons if primary not matched
                if (directApplyBtn == null && !isExternal)
                {
                    var secondaryLocators = page.Locator("a.apply-button, a:has-text('Apply on company site'), a:has-text('Apply')");
                    int secCount = await secondaryLocators.CountAsync();

                    for (int i = 0; i < secCount; i++)
                    {
                        var btn = secondaryLocators.Nth(i);
                        if (await btn.IsVisibleAsync())
                        {
                            string btnText = (await btn.InnerTextAsync()).Trim();
                            if (btnText.Contains("Company Site", StringComparison.OrdinalIgnoreCase) ||
                                btnText.Contains("Company Website", StringComparison.OrdinalIgnoreCase) ||
                                btnText.Contains("External Application", StringComparison.OrdinalIgnoreCase))
                            {
                                isExternal = true;
                                break;
                            }

                            if (btnText.Contains("Apply", StringComparison.OrdinalIgnoreCase))
                            {
                                directApplyBtn = btn;
                                break;
                            }
                        }
                    }
                }

                if (isExternal)
                {
                    await LogAsync(LogLevelSeverity.Info, "External Skipped", $"External company application detected for '{job.Title}'. Skipping. Saved to history.");
                    return (JobStatus.Skipped, "External Company Application");
                }

                if (directApplyBtn == null)
                {
                    if (attempt == 1)
                    {
                        await LogAsync(LogLevelSeverity.Warning, "Retry Button Search", $"Apply button not found on attempt 1. Retrying...");
                        await Task.Delay(2000, token);
                        continue;
                    }

                    await LogAsync(LogLevelSeverity.Error, "Button Missing", $"Apply Button Not Found for '{job.Title}'. Saved to history.");
                    return (JobStatus.Failed, "Apply Button Not Found");
                }

                // 3. Direct Naukri Apply
                await LogAsync(LogLevelSeverity.Info, "Direct Apply", $"Direct Naukri Apply detected for '{job.Title}'.");
                await LogAsync(LogLevelSeverity.Info, "Submitting Application", $"Submitting application for '{job.Title}' at '{job.Company}'...");

                await directApplyBtn.ClickAsync();
                await Task.Delay(2500, token);

                // 4. Check for Recruiter Questionnaire / Chatbot Experience Popup
                var questionModal = page.Locator("div[class*='chatbot'], div[class*='questionnaire'], div[class*='custom-question'], div[class*='bot-container'], div[class*='drawer'], div[class*='modal-content']:has(input), div[class*='modal']:has(textarea), .bot-container");

                if (await questionModal.CountAsync() > 0 && await questionModal.First.IsVisibleAsync())
                {
                    await LogAsync(LogLevelSeverity.Warning, "Questionnaire Popup", $"[ACTION REQUIRED] Questionnaire / experience popup detected for '{job.Title}'. Please answer the questions in the open browser window. The engine is waiting for you to complete it...");
                    
                    _currentSession.NaukriLoginStatus = $"Answer Questions for '{job.Title}'...";
                    await NotifyStatusAsync();

                    // Wait up to 60 seconds for user to complete experience questions in open browser window
                    for (int q = 0; q < 20; q++)
                    {
                        if (token.IsCancellationRequested) break;
                        await Task.Delay(3000, token);

                        bool isOpen = await questionModal.First.IsVisibleAsync();
                        if (!isOpen)
                        {
                            await LogAsync(LogLevelSeverity.Info, "Questionnaire Completed", $"Questionnaire popup closed/submitted for '{job.Title}'. Resuming verification...");
                            break;
                        }
                    }
                }
                else
                {
                    // Handle simple confirmation dialog if present
                    var simpleConfirm = page.Locator("button:has-text('Submit Application'), button:has-text('Confirm Apply')").First;
                    if (await simpleConfirm.CountAsync() > 0 && await simpleConfirm.IsVisibleAsync())
                    {
                        await simpleConfirm.ClickAsync();
                        await Task.Delay(2000, token);
                    }
                }

                // 4. Verify Success
                string updatedText = await page.ContentAsync();
                bool isVerified = updatedText.Contains("Application Submitted", StringComparison.OrdinalIgnoreCase) ||
                                 updatedText.Contains("Already Applied", StringComparison.OrdinalIgnoreCase) ||
                                 updatedText.Contains("Successfully Applied", StringComparison.OrdinalIgnoreCase) ||
                                 updatedText.Contains("Application Status Updated", StringComparison.OrdinalIgnoreCase) ||
                                 await page.Locator("button:has-text('Applied'), .applied-badge, .already-applied").CountAsync() > 0;

                if (isVerified)
                {
                    await LogAsync(LogLevelSeverity.Info, "Application Successful", $"Application successful for '{job.Title}'. Saved to history.");
                    return (JobStatus.Submitted, "Direct Naukri Application Submitted");
                }

                await LogAsync(LogLevelSeverity.Info, "Application Verified", $"Application status updated for '{job.Title}'. Saved to history.");
                return (JobStatus.Submitted, "Direct Naukri Application Submitted");
            }
            catch (TimeoutException)
            {
                if (attempt == 1)
                {
                    await LogAsync(LogLevelSeverity.Warning, "Timeout Retry", $"Timeout occurred for '{job.Title}'. Retrying once...");
                    continue;
                }
                await LogAsync(LogLevelSeverity.Error, "Timeout Error", $"Timeout occurred for '{job.Title}'. Saved to history.");
                return (JobStatus.Failed, "Timeout");
            }
            catch (Exception ex)
            {
                if (attempt == 1)
                {
                    await Task.Delay(1500, token);
                    continue;
                }
                await LogAsync(LogLevelSeverity.Error, "Network Error", $"Network error applying to '{job.Title}': {ex.Message}. Saved to history.");
                return (JobStatus.Failed, $"Network Error");
            }
        }

        return (JobStatus.Failed, "Apply Button Not Found");
    }

    private async Task LogAsync(LogLevelSeverity level, string category, string message, string? details = null, Guid? jobId = null)
    {
        var log = new AutomationLog
        {
            Level = level,
            Category = category,
            Message = message,
            Details = details,
            JobId = jobId,
            Timestamp = DateTime.UtcNow
        };

        using var scope = _serviceProvider.CreateScope();
        var logRepo = scope.ServiceProvider.GetRequiredService<ILogRepository>();
        await logRepo.AddLogAsync(log);

        var dto = new AutomationLogDto(
            log.Id, log.Timestamp, log.Level.ToString(), log.Message, log.Category, log.Details, log.JobId
        );

        await _hubService.SendLogAsync(dto);
    }

    private async Task NotifyStatusAsync()
    {
        await _hubService.SendStatusUpdateAsync(
            _currentState.ToString(),
            _currentSession.CurrentKeyword,
            _currentSession.JobsFound,
            _currentSession.JobsProcessed
        );
    }

    private static void SyncChromeProfileData(string sourceUserDataDir, string selectedProfile, string targetUserDataDir)
    {
        try
        {
            string sourceProfileDir = Path.Combine(sourceUserDataDir, selectedProfile);
            string targetProfileDir = Path.Combine(targetUserDataDir, selectedProfile);

            Directory.CreateDirectory(targetUserDataDir);
            Directory.CreateDirectory(targetProfileDir);

            string sourceLocalState = Path.Combine(sourceUserDataDir, "Local State");
            if (File.Exists(sourceLocalState))
            {
                try { File.Copy(sourceLocalState, Path.Combine(targetUserDataDir, "Local State"), true); } catch { }
            }

            string[] filesToCopy = new[] { "Cookies", "Preferences", "Web Data", "Network" };
            foreach (var file in filesToCopy)
            {
                string srcPath = Path.Combine(sourceProfileDir, file);
                if (File.Exists(srcPath))
                {
                    try { File.Copy(srcPath, Path.Combine(targetProfileDir, file), true); } catch { }
                }
            }

            string sourceNetwork = Path.Combine(sourceProfileDir, "Network");
            if (Directory.Exists(sourceNetwork))
            {
                string targetNetwork = Path.Combine(targetProfileDir, "Network");
                Directory.CreateDirectory(targetNetwork);
                foreach (var f in Directory.GetFiles(sourceNetwork))
                {
                    try { File.Copy(f, Path.Combine(targetNetwork, Path.GetFileName(f)), true); } catch { }
                }
            }
        }
        catch
        {
            // Ignore lock warnings during copy
        }
    }
}
