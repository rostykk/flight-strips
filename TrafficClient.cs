using System.Net.Http;
using System.Text.Json;

namespace FlightStrips;

/// <summary>
/// Read-only client for Airside's official Mods for Airside HTTP endpoint.
/// Reads only GET http://127.0.0.1:24774/traffic and caches responses briefly
/// so multiple UI clients (WPF + OBS + Tablet) still poll Airside at ~1 Hz.
/// </summary>
public sealed class TrafficClient : IDisposable
{
    public const string AirsideTrafficUrl = "http://127.0.0.1:24774/traffic";
    private static readonly TimeSpan CacheTtl = TimeSpan.FromMilliseconds(750);

    private readonly HttpClient _http = new()
    {
        Timeout = TimeSpan.FromMilliseconds(1500),
    };
    private readonly SemaphoreSlim _gate = new(1, 1);
    private DateTime _lastFetchUtc = DateTime.MinValue;
    private (bool Ok, string? Json, string? Error) _lastResult;

    public async Task<(bool Ok, string? Json, string? Error)> FetchRawAsync(CancellationToken ct = default)
    {
        if (DateTime.UtcNow - _lastFetchUtc < CacheTtl)
            return _lastResult;

        await _gate.WaitAsync(ct);
        try
        {
            if (DateTime.UtcNow - _lastFetchUtc < CacheTtl)
                return _lastResult;

            try
            {
                using var req = new HttpRequestMessage(HttpMethod.Get, AirsideTrafficUrl);
                req.Headers.Accept.ParseAdd("application/json");
                using var res = await _http.SendAsync(req, ct);
                if (!res.IsSuccessStatusCode)
                {
                    _lastResult = (false, null, $"Airside API returned HTTP {(int)res.StatusCode}");
                }
                else
                {
                    string body = await res.Content.ReadAsStringAsync(ct);
                    _lastResult = (true, body, null);
                }
            }
            catch (Exception ex)
            {
                _lastResult = (false, null, ex.Message);
            }

            _lastFetchUtc = DateTime.UtcNow;
            return _lastResult;
        }
        finally
        {
            _gate.Release();
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

    public void Dispose()
    {
        _http.Dispose();
        _gate.Dispose();
    }
}
