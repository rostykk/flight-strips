using System.Net.Http;
using System.Text.Json;

namespace FlightStrips;

/// <summary>
/// Read-only client for Airside's official Mods for Airside HTTP endpoint.
/// Reads only GET http://127.0.0.1:24774/traffic.
/// </summary>
public sealed class TrafficClient : IDisposable
{
    public const string AirsideTrafficUrl = "http://127.0.0.1:24774/traffic";

    private readonly HttpClient _http = new()
    {
        Timeout = TimeSpan.FromMilliseconds(1500),
    };

    public async Task<(bool Ok, string? Json, string? Error)> FetchRawAsync(CancellationToken ct = default)
    {
        try
        {
            using var req = new HttpRequestMessage(HttpMethod.Get, AirsideTrafficUrl);
            req.Headers.Accept.ParseAdd("application/json");
            using var res = await _http.SendAsync(req, ct);
            if (!res.IsSuccessStatusCode)
            {
                return (false, null, $"Airside API returned HTTP {(int)res.StatusCode}");
            }

            string body = await res.Content.ReadAsStringAsync(ct);
            return (true, body, null);
        }
        catch (Exception ex)
        {
            return (false, null, ex.Message);
        }
    }

    public async Task<TrafficSnapshot?> FetchSnapshotAsync(CancellationToken ct = default)
    {
        var (ok, json, _) = await FetchRawAsync(ct);
        if (!ok || string.IsNullOrWhiteSpace(json))
            return null;

        try
        {
            return JsonSerializer.Deserialize<TrafficSnapshot>(json);
        }
        catch
        {
            return null;
        }
    }

    public void Dispose() => _http.Dispose();
}
