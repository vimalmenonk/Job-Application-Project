using JobPilot.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace JobPilot.Infrastructure.Persistence;

public class JobPilotDbContext : DbContext
{
    public JobPilotDbContext(DbContextOptions<JobPilotDbContext> options) : base(options)
    {
    }

    public DbSet<JobOpportunity> Jobs => Set<JobOpportunity>();
    public DbSet<SearchProfile> SearchProfiles => Set<SearchProfile>();
    public DbSet<AutomationConfig> AutomationConfigs => Set<AutomationConfig>();
    public DbSet<AutomationLog> AutomationLogs => Set<AutomationLog>();
    public DbSet<AutomationSession> AutomationSessions => Set<AutomationSession>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<JobOpportunity>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.ExternalId).IsUnique();
            entity.Property(e => e.Title).IsRequired().HasMaxLength(250);
            entity.Property(e => e.Company).IsRequired().HasMaxLength(250);
        });

        modelBuilder.Entity<SearchProfile>(entity =>
        {
            entity.HasKey(e => e.Id);
        });

        modelBuilder.Entity<AutomationConfig>(entity =>
        {
            entity.HasKey(e => e.Id);
        });

        modelBuilder.Entity<AutomationLog>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Timestamp);
        });
    }
}
