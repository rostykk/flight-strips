using System.IO;
using System.Net;
using System.Reflection;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace FlightStrips;

public sealed class WebServer : IAsyncDisposable
{
    private readonly TrafficClient _client;
    private readonly string _staticDir;
    private readonly SemaphoreSlim _gate = new(1, 1);
    private WebApplication? _app;

    public int Port { get; private set; }
    public bool BindAll { get; private set; }
    public bool StreamerMode { get; set; }
    public string LocalUrl => $"http://127.0.0.1:{Port}/";
    public string? LastError { get; private set; }

    public WebServer(TrafficClient client, string? staticDir = null)
    {
        _client = client;
        _staticDir = staticDir ?? Path.Combine(AppContext.BaseDirectory, "static");
        if (!Directory.Exists(_staticDir))
            _staticDir = Path.Combine(Directory.GetCurrentDirectory(), "static");
    }

    public async Task<bool> StartOrRestartAsync(int port, bool bindAll)
    {
        await _gate.WaitAsync();
        try
        {
            if (_app != null)
            {
                try { await _app.StopAsync(); } catch { }
                try { await _app.DisposeAsync(); } catch { }
                _app = null;
            }

            LastError = null;
            var builder = WebApplication.CreateSlimBuilder();
            builder.Logging.ClearProviders();
            builder.WebHost.ConfigureKestrel(k =>
            {
                if (bindAll) k.ListenAnyIP(port);
                else k.Listen(IPAddress.Loopback, port);
            });

            var app = builder.Build();

            app.MapGet("/api/health", () =>
                Results.Json(new { ok = true, mod = "Flight Strips, a mod for Airside", streamerMode = StreamerMode }));

            app.MapGet("/api/traffic", async (CancellationToken ct) =>
            {
                var (ok, json, err) = await _client.FetchRawAsync(ct);
                if (ok && json != null)
                {
                    return Results.Text(json, "application/json; charset=utf-8");
                }

                string offlineJson = JsonSerializer.Serialize(new
                {
                    offline = true,
                    error = err ?? $"Airside Mods API unreachable at {TrafficClient.AirsideTrafficUrl}",
                });
                return Results.Text(offlineJson, "application/json; charset=utf-8", statusCode: StatusCodes.Status503ServiceUnavailable);
            });

            app.MapGet("/", (HttpContext ctx) => ServeStaticAsync(ctx, "index.html"));
            app.MapGet("/{*file}", (HttpContext ctx, string file) => ServeStaticAsync(ctx, file));

            await app.StartAsync();
            _app = app;
            Port = port;
            BindAll = bindAll;
            return true;
        }
        catch (Exception ex)
        {
            LastError = ex.Message;
            return false;
        }
        finally
        {
            _gate.Release();
        }
    }

    private async Task ServeStaticAsync(HttpContext ctx, string file)
    {
        string safeFile = file.Replace('\\', '/').TrimStart('/');
        if (safeFile.StartsWith("static/", StringComparison.OrdinalIgnoreCase))
            safeFile = safeFile["static/".Length..];
        if (string.IsNullOrEmpty(safeFile)) safeFile = "index.html";
        if (safeFile.Contains(".."))
        {
            ctx.Response.StatusCode = StatusCodes.Status400BadRequest;
            return;
        }

        string diskPath = Path.Combine(_staticDir, safeFile.Replace('/', Path.DirectorySeparatorChar));
        byte[]? bytes = null;
        if (File.Exists(diskPath))
        {
            bytes = await File.ReadAllBytesAsync(diskPath);
        }
        else
        {
            var asm = Assembly.GetExecutingAssembly();
            string resName = $"static/{safeFile}";
            using var stream = asm.GetManifestResourceStream(resName);
            if (stream != null)
            {
                using var ms = new MemoryStream();
                await stream.CopyToAsync(ms);
                bytes = ms.ToArray();
            }
        }

        if (bytes == null)
        {
            ctx.Response.StatusCode = StatusCodes.Status404NotFound;
            return;
        }

        ctx.Response.ContentType = GetContentType(safeFile);
        ctx.Response.Headers.CacheControl = "no-store";
        await ctx.Response.Body.WriteAsync(bytes);
    }

    private static string GetContentType(string file) => Path.GetExtension(file).ToLowerInvariant() switch
    {
        ".html" => "text/html; charset=utf-8",
        ".css" => "text/css; charset=utf-8",
        ".js" => "application/javascript; charset=utf-8",
        ".json" => "application/json; charset=utf-8",
        ".svg" => "image/svg+xml",
        ".png" => "image/png",
        ".ico" => "image/x-icon",
        _ => "application/octet-stream",
    };

    public async ValueTask DisposeAsync()
    {
        if (_app != null)
        {
            try { await _app.StopAsync(); } catch { }
            try { await _app.DisposeAsync(); } catch { }
            _app = null;
        }
    }
}
