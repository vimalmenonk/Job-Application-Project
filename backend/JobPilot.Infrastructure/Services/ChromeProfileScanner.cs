using System.Text.Json;

namespace JobPilot.Infrastructure.Services;

public record ChromeProfileInfo(string Id, string Name, string Path);

public static class ChromeProfileScanner
{
    public static string GetChromeUserDataDir()
    {
        return Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Google\Chrome\User Data");
    }

    public static string? GetChromeExecutablePath()
    {
        string p1 = @"C:\Program Files\Google\Chrome\Application\chrome.exe";
        if (File.Exists(p1)) return p1;

        string p2 = @"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe";
        if (File.Exists(p2)) return p2;

        string p3 = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Google\Chrome\Application\chrome.exe");
        if (File.Exists(p3)) return p3;

        return null;
    }

    public static List<ChromeProfileInfo> GetInstalledChromeProfiles()
    {
        var list = new List<ChromeProfileInfo>();
        string userDataDir = GetChromeUserDataDir();

        if (!Directory.Exists(userDataDir))
        {
            return list;
        }

        var profileNames = new Dictionary<string, string>();
        string localStatePath = Path.Combine(userDataDir, "Local State");
        if (File.Exists(localStatePath))
        {
            try
            {
                string json = File.ReadAllText(localStatePath);
                using var doc = JsonDocument.Parse(json);
                if (doc.RootElement.TryGetProperty("profile", out var profileElem) &&
                    profileElem.TryGetProperty("info_cache", out var cacheElem))
                {
                    foreach (var prop in cacheElem.EnumerateObject())
                    {
                        string folderId = prop.Name; // "Default", "Profile 1", etc.
                        string name = folderId;
                        if (prop.Value.TryGetProperty("name", out var nameProp))
                        {
                            string? customName = nameProp.GetString();
                            if (!string.IsNullOrWhiteSpace(customName))
                            {
                                name = customName; // Use clean custom name e.g. "Vimal"
                            }
                        }
                        profileNames[folderId] = name;
                    }
                }
            }
            catch
            {
                // Ignore parse errors
            }
        }

        // Scan all directories inside User Data
        var dirs = Directory.GetDirectories(userDataDir);
        foreach (var dir in dirs)
        {
            string folderName = Path.GetFileName(dir);
            // Check if directory contains Chrome profile files
            if (File.Exists(Path.Combine(dir, "Preferences")) ||
                File.Exists(Path.Combine(dir, "Cookies")) ||
                File.Exists(Path.Combine(dir, "Web Data")) ||
                folderName.Equals("Default", StringComparison.OrdinalIgnoreCase) ||
                folderName.StartsWith("Profile ", StringComparison.OrdinalIgnoreCase))
            {
                if (folderName.Equals("System Profile", StringComparison.OrdinalIgnoreCase) ||
                    folderName.Equals("Guest Profile", StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                string displayName = profileNames.TryGetValue(folderName, out var name) ? name : folderName;
                if (!list.Any(p => p.Id == folderName))
                {
                    list.Add(new ChromeProfileInfo(folderName, displayName, dir));
                }
            }
        }

        if (!list.Any(p => p.Id == "Default") && Directory.Exists(Path.Combine(userDataDir, "Default")))
        {
            list.Insert(0, new ChromeProfileInfo("Default", "Default Profile", Path.Combine(userDataDir, "Default")));
        }

        return list;
    }

    public static string ResolveProfileFolder(string userDataDir, string selectedProfile)
    {
        if (string.IsNullOrWhiteSpace(selectedProfile)) return "Default";

        // Direct folder match
        if (Directory.Exists(Path.Combine(userDataDir, selectedProfile)))
        {
            return selectedProfile;
        }

        // Search profiles list by display name or id
        var profiles = GetInstalledChromeProfiles();
        var match = profiles.FirstOrDefault(p => p.Name.Equals(selectedProfile, StringComparison.OrdinalIgnoreCase) ||
                                                 p.Name.Contains(selectedProfile, StringComparison.OrdinalIgnoreCase) ||
                                                 p.Id.Equals(selectedProfile, StringComparison.OrdinalIgnoreCase));
        if (match != null)
        {
            return match.Id;
        }

        return selectedProfile;
    }
}
