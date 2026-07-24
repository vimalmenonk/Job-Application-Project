using JobPilot.Application.DTOs;
using JobPilot.Application.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace JobPilot.Infrastructure.Services;

public class SignalRNotificationService : INotificationHubService
{
    private readonly IHubContext<JobPilotHub> _hubContext;

    public SignalRNotificationService(IHubContext<JobPilotHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task SendLogAsync(AutomationLogDto log)
    {
        await _hubContext.Clients.All.SendAsync("ReceiveLog", log);
    }

    public async Task SendStatusUpdateAsync(string runnerState, string currentKeyword, int jobsFound, int jobsProcessed)
    {
        await _hubContext.Clients.All.SendAsync("ReceiveStatusUpdate", new
        {
            RunnerState = runnerState,
            CurrentKeyword = currentKeyword,
            JobsFound = jobsFound,
            JobsProcessed = jobsProcessed
        });
    }

    public async Task SendJobDiscoveredAsync(JobOpportunityDto job)
    {
        await _hubContext.Clients.All.SendAsync("ReceiveJobDiscovered", job);
    }
}

// Marker class for HubContext binding across assemblies
public class JobPilotHub : Hub
{
}
