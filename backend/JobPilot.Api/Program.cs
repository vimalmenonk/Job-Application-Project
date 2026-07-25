using JobPilot.Application.Interfaces;
using JobPilot.Domain.Entities;
using JobPilot.Infrastructure.Persistence;
using JobPilot.Infrastructure.Repositories;
using JobPilot.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Serilog;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls("http://localhost:5000");

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("logs/jobpilot-.log", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSignalR();

// Configure EF Core SQLite
var dbPath = Path.Combine(AppContext.BaseDirectory, "jobpilot.db");
builder.Services.AddDbContext<JobPilotDbContext>(options =>
    options.UseSqlite($"Data Source={dbPath}"));

// Register Repositories
builder.Services.AddScoped<IJobRepository, JobRepository>();
builder.Services.AddScoped<ISearchProfileRepository, SearchProfileRepository>();
builder.Services.AddScoped<IAutomationConfigRepository, AutomationConfigRepository>();
builder.Services.AddScoped<ILogRepository, LogRepository>();

// Register Hub Service & Automation Engine (Singleton)
builder.Services.AddSingleton<INotificationHubService, SignalRNotificationService>();
builder.Services.AddSingleton<IAutomationEngine, PlaywrightAutomationEngine>();

// Configure CORS for React frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Ensure database created and execute schema column migrations
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<JobPilotDbContext>();
    db.Database.EnsureCreated();

    void AddColumnIfMissing(string table, string column, string typeAndDefault)
    {
        try
        {
            var conn = db.Database.GetDbConnection();
            bool wasClosed = conn.State != System.Data.ConnectionState.Open;
            if (wasClosed) conn.Open();

            using var cmd = conn.CreateCommand();
            cmd.CommandText = $"PRAGMA table_info({table});";
            using var reader = cmd.ExecuteReader();
            bool exists = false;
            while (reader.Read())
            {
                if (string.Equals(reader["name"]?.ToString(), column, StringComparison.OrdinalIgnoreCase))
                {
                    exists = true;
                    break;
                }
            }
            if (wasClosed) conn.Close();

            if (!exists)
            {
                db.Database.ExecuteSqlRaw($"ALTER TABLE {table} ADD COLUMN {column} {typeAndDefault};");
            }
        }
        catch
        {
            // Ignore PRAGMA check errors
        }
    }

    AddColumnIfMissing("AutomationConfigs", "SelectedChromeProfile", "TEXT DEFAULT 'Default'");
    AddColumnIfMissing("SearchProfiles", "ExpectedCtcLpa", "REAL DEFAULT 12.0");
    AddColumnIfMissing("Jobs", "EmploymentType", "TEXT DEFAULT 'Full Time'");

    InitializeDefaults(db);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");
app.UseAuthorization();

app.MapControllers();
app.MapHub<JobPilotHub>("/hubs/jobpilot");

app.Run();

static void InitializeDefaults(JobPilotDbContext db)
{
    if (!db.SearchProfiles.Any())
    {
        db.SearchProfiles.Add(new SearchProfile());
    }

    if (!db.AutomationConfigs.Any())
    {
        db.AutomationConfigs.Add(new AutomationConfig());
    }

    db.SaveChanges();
}
