using System.Diagnostics;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Text.Json;
using System.Windows;
using System.Windows.Media;
using Microsoft.Web.WebView2.Core;

namespace FlightStrips;

public partial class MainWindow : Window
{
    private sealed class WindowConfig
    {
        public int Port { get; set; } = 24775;
        public bool BindAll { get; set; }
        public bool AlwaysOnTop { get; set; }
        public double Opacity { get; set; } = 1.0;
        public bool StreamerMode { get; set; }
    }

    private static readonly string ConfigDir = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "FlightStrips");
    private static readonly string ConfigPath = Path.Combine(ConfigDir, "config.json");

    private readonly TrafficClient _trafficClient = new();
    private readonly WebServer _webServer;
    private WindowConfig _cfg;
    private bool _docked;
    private Rect _restoreBounds = new(120, 80, 1520, 820);
    private Rect? _dockBounds;
    private bool _awaitingDockAutoFit;
    private bool _isAutoFitting;
    private bool _webReady;
    private double _currentOpacity = 1.0;

    public MainWindow()
    {
        _cfg = LoadConfig();
        _webServer = new WebServer(_trafficClient) { StreamerMode = _cfg.StreamerMode };
        InitializeComponent();

        Topmost = _cfg.AlwaysOnTop;
        _currentOpacity = Math.Clamp(_cfg.Opacity, 0.35, 1.0);
        SliderOpacity.Value = _currentOpacity;
        UpdatePinButton();
        ApplyWindowOpacity(_currentOpacity);

        LocationChanged += (_, _) => RecordDockBounds();
        SizeChanged += (_, _) => RecordDockBounds();
        Loaded += MainWindow_Loaded;
        Closing += MainWindow_Closing;
        StateChanged += MainWindow_StateChanged;
    }

    private static WindowConfig LoadConfig()
    {
        try
        {
            if (File.Exists(ConfigPath))
            {
                var cfg = JsonSerializer.Deserialize<WindowConfig>(File.ReadAllText(ConfigPath));
                if (cfg != null) return cfg;
            }
        }
        catch { }
        return new WindowConfig();
    }

    private void SaveConfig()
    {
        try
        {
            Directory.CreateDirectory(ConfigDir);
            File.WriteAllText(ConfigPath, JsonSerializer.Serialize(_cfg, new JsonSerializerOptions { WriteIndented = true }));
        }
        catch { }
    }

    private void RecordDockBounds()
    {
        if (!_docked || _isAutoFitting || WindowState != WindowState.Normal) return;
        _dockBounds = new Rect(Left, Top, Width, Height);
    }

    private void ApplyWindowOpacity(double opacity)
    {
        double clamped = Math.Clamp(opacity, 0.35, 1.0);
        Opacity = clamped;
        if (TxtOpacityPct != null)
            TxtOpacityPct.Text = $"{Math.Round(clamped * 100)}%";
    }

    private static string GetLanIp()
    {
        try
        {
            using var s = new Socket(AddressFamily.InterNetwork, SocketType.Dgram, 0);
            s.Connect("8.8.8.8", 65530);
            if (s.LocalEndPoint is IPEndPoint ep)
                return ep.Address.ToString();
        }
        catch { }
        return "127.0.0.1";
    }

    private void RefreshServerBadge(int port, bool bindAll)
    {
        BtnServerUrl.Content = $"HTTP :{port} ({(bindAll ? "LAN" : "LOCAL")})";
        TxtPort.Text = port.ToString();
        ChkLan.IsChecked = bindAll;
        ChkStreamer.Checked -= ChkStreamer_Changed;
        ChkStreamer.Unchecked -= ChkStreamer_Changed;
        ChkStreamer.IsChecked = _cfg.StreamerMode;
        ChkStreamer.Checked += ChkStreamer_Changed;
        ChkStreamer.Unchecked += ChkStreamer_Changed;

        string lanIp = bindAll ? GetLanIp() : "127.0.0.1";
        TxtUrls.Text = _cfg.StreamerMode
            ? $"OBS: http://localhost:{port}/?overlay=1  |  Tablet: IP Hidden (Streamer Mode)"
            : $"OBS: http://127.0.0.1:{port}/?overlay=1  |  Tablet: http://{lanIp}:{port}/";
    }

    private async void MainWindow_Loaded(object sender, RoutedEventArgs e)
    {
        bool ok = await _webServer.StartOrRestartAsync(_cfg.Port, _cfg.BindAll);
        if (!ok)
        {
            MessageBox.Show(
                $"Failed to start local web server on port {_cfg.Port}:\n{_webServer.LastError}",
                "Flight Strips, a mod for Airside",
                MessageBoxButton.OK,
                MessageBoxImage.Error);
            return;
        }

        RefreshServerBadge(_webServer.Port, _webServer.BindAll);

        try
        {
            string cacheDir = Path.Combine(ConfigDir, "WebView2");
            CoreWebView2Environment env;
            try
            {
                env = await CoreWebView2Environment.CreateAsync(null, cacheDir);
            }
            catch
            {
                string fallbackCacheDir = Path.Combine(Path.GetTempPath(), "FlightStrips_WebView2");
                env = await CoreWebView2Environment.CreateAsync(null, fallbackCacheDir);
            }
            await WebView.EnsureCoreWebView2Async(env);
            WebView.CoreWebView2.Settings.AreDefaultContextMenusEnabled = true;
            WebView.CoreWebView2.WebMessageReceived += CoreWebView2_WebMessageReceived;
            _webReady = true;
            WebView.CoreWebView2.Navigate(_webServer.LocalUrl);
        }
        catch
        {
            TxtFallbackUrl.Text = _webServer.LocalUrl;
            FallbackPane.Visibility = Visibility.Visible;
            WebView.Visibility = Visibility.Collapsed;
        }
    }

    private async void MainWindow_Closing(object? sender, System.ComponentModel.CancelEventArgs e)
    {
        await _webServer.DisposeAsync();
        _trafficClient.Dispose();
    }

    private void MainWindow_StateChanged(object? sender, EventArgs e)
    {
        if (WindowState == WindowState.Maximized)
        {
            RootBorder.CornerRadius = new CornerRadius(0);
            RootBorder.BorderThickness = new Thickness(0);
            BtnMax.Content = "❐";
        }
        else
        {
            RootBorder.CornerRadius = new CornerRadius(6);
            RootBorder.BorderThickness = new Thickness(1);
            BtnMax.Content = "☐";
        }
    }

    private void UpdatePinButton()
    {
        BtnPin.Background = new SolidColorBrush(Topmost ? Color.FromRgb(2, 132, 199) : Color.FromRgb(30, 45, 56));
        BtnPin.Content = Topmost ? "Pinned Top" : "Pin Top";
    }

    private void BtnPin_Click(object sender, RoutedEventArgs e)
    {
        Topmost = !Topmost;
        UpdatePinButton();
        ApplyWindowOpacity(_currentOpacity);
        _cfg.AlwaysOnTop = Topmost;
        SaveConfig();
    }

    private void SliderOpacity_ValueChanged(object sender, RoutedPropertyChangedEventArgs<double> e)
    {
        _currentOpacity = Math.Clamp(e.NewValue, 0.35, 1.0);
        ApplyWindowOpacity(_currentOpacity);
        if (!IsLoaded) return;
        _cfg.Opacity = Math.Round(_currentOpacity, 2);
        SaveConfig();
    }

    private void CoreWebView2_WebMessageReceived(object? sender, CoreWebView2WebMessageReceivedEventArgs e)
    {
        if (!_docked || !_awaitingDockAutoFit) return;
        try
        {
            using var doc = JsonDocument.Parse(e.WebMessageAsJson);
            var root = doc.RootElement;
            if (!root.TryGetProperty("type", out var t) || t.GetString() != "dockHeight") return;
            if (!root.TryGetProperty("height", out var hEl) || !hEl.TryGetDouble(out double webH)) return;

            double chromeH = TitleBarRow.Height.Value + (ServerPanel.Visibility == Visibility.Visible ? ServerPanel.ActualHeight : 0) + 2;
            double targetH = Math.Clamp(Math.Ceiling(chromeH + webH), 104, 180);
            _awaitingDockAutoFit = false;
            if (Math.Abs(Height - targetH) < 2) return;

            var wa = SystemParameters.WorkArea;
            bool anchorTop = Top < wa.Top + (wa.Height * 0.4);
            double prevBottom = Top + Height;

            _isAutoFitting = true;
            Height = targetH;
            if (!anchorTop)
                Top = Math.Max(wa.Top, prevBottom - targetH);
            _isAutoFitting = false;
            RecordDockBounds();
        }
        catch { _isAutoFitting = false; }
    }

    private void BtnDockOverlay_Click(object sender, RoutedEventArgs e)
    {
        _docked = !_docked;
        if (_docked)
        {
            _restoreBounds = new Rect(Left, Top, Width, Height);
            WindowState = WindowState.Normal;
            TitleBarRow.Height = new GridLength(28);
            RootBorder.Background = new SolidColorBrush(Color.FromRgb(12, 20, 27));
            WebView.DefaultBackgroundColor = System.Drawing.Color.FromArgb(255, 12, 20, 27);

            var wa = SystemParameters.WorkArea;
            _isAutoFitting = true;
            if (_dockBounds is Rect saved)
            {
                Left = Math.Clamp(saved.Left, wa.Left, Math.Max(wa.Left, wa.Right - 400));
                Width = Math.Clamp(saved.Width, 540, wa.Width);
                Height = Math.Clamp(saved.Height, 104, 180);
                Top = Math.Clamp(saved.Top, wa.Top, Math.Max(wa.Top, wa.Bottom - Height));
            }
            else
            {
                Left = wa.Left + 24;
                Width = Math.Max(780, wa.Width - 48);
                Height = 124;
                Top = wa.Bottom - Height - 12;
            }
            _isAutoFitting = false;
            _awaitingDockAutoFit = true;

            Topmost = true;
            UpdatePinButton();
            ApplyWindowOpacity(_currentOpacity);
            BtnDockOverlay.Content = "Full Window";
            BtnDockOverlay.Background = new SolidColorBrush(Color.FromRgb(234, 88, 12));
            if (_webReady && WebView.CoreWebView2 != null)
                WebView.CoreWebView2.Navigate($"{_webServer.LocalUrl}?overlay=1&max=6&dock=1");
        }
        else
        {
            _awaitingDockAutoFit = false;
            TitleBarRow.Height = new GridLength(34);
            RootBorder.Background = new SolidColorBrush(Color.FromRgb(15, 23, 29));
            WebView.DefaultBackgroundColor = System.Drawing.Color.FromArgb(255, 22, 33, 41);

            Left = _restoreBounds.Left;
            Top = _restoreBounds.Top;
            Width = _restoreBounds.Width;
            Height = _restoreBounds.Height;
            Topmost = _cfg.AlwaysOnTop;
            UpdatePinButton();
            ApplyWindowOpacity(_currentOpacity);
            BtnDockOverlay.Content = "1-Row Bar";
            BtnDockOverlay.Background = new SolidColorBrush(Color.FromRgb(30, 45, 56));
            if (_webReady && WebView.CoreWebView2 != null)
                WebView.CoreWebView2.Navigate(_webServer.LocalUrl);
        }
    }

    private void BtnPortCfg_Click(object sender, RoutedEventArgs e)
    {
        ServerPanel.Visibility = ServerPanel.Visibility == Visibility.Visible ? Visibility.Collapsed : Visibility.Visible;
    }

    private async void BtnApplyPort_Click(object sender, RoutedEventArgs e)
    {
        if (!int.TryParse(TxtPort.Text.Trim(), out int newPort) || newPort < 1024 || newPort > 65535)
        {
            MessageBox.Show("Enter a valid port between 1024 and 65535.", "Flight Strips", MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        bool bindAll = ChkLan.IsChecked == true;
        _cfg.Port = newPort;
        _cfg.BindAll = bindAll;
        _cfg.StreamerMode = ChkStreamer.IsChecked == true;
        SaveConfig();

        bool ok = await _webServer.StartOrRestartAsync(newPort, bindAll);
        if (!ok)
        {
            MessageBox.Show($"Could not bind port {newPort}: {_webServer.LastError}", "Flight Strips", MessageBoxButton.OK, MessageBoxImage.Error);
            return;
        }

        RefreshServerBadge(_webServer.Port, _webServer.BindAll);
        if (_webReady && WebView.CoreWebView2 != null)
        {
            string suffix = _docked ? "?overlay=1&max=6&dock=1" : "";
            WebView.CoreWebView2.Navigate($"http://127.0.0.1:{newPort}/{suffix}");
        }
    }

    private void ChkStreamer_Changed(object sender, RoutedEventArgs e)
    {
        _cfg.StreamerMode = ChkStreamer.IsChecked == true;
        _webServer.StreamerMode = _cfg.StreamerMode;
        SaveConfig();
        RefreshServerBadge(_webServer.Port, _webServer.BindAll);
    }

    private void BtnCopyLan_Click(object sender, RoutedEventArgs e)
    {
        string lanIp = _webServer.BindAll ? GetLanIp() : "127.0.0.1";
        Clipboard.SetText($"http://{lanIp}:{_webServer.Port}/");
    }

    private async void BtnResetAll_Click(object sender, RoutedEventArgs e)
    {
        var res = MessageBox.Show(
            "Reset all Flight Strips settings, bay layouts, strip notes, and window dock to defaults?",
            "Flight Strips — Reset All",
            MessageBoxButton.YesNo,
            MessageBoxImage.Question);
        if (res != MessageBoxResult.Yes) return;

        _cfg = new WindowConfig();
        SaveConfig();
        _dockBounds = null;
        if (_docked) BtnDockOverlay_Click(this, new RoutedEventArgs());

        Topmost = false;
        UpdatePinButton();
        SliderOpacity.Value = 1.0;
        ApplyWindowOpacity(1.0);

        if (_webReady && WebView.CoreWebView2 != null)
        {
            await WebView.CoreWebView2.ExecuteScriptAsync("localStorage.clear(); location.reload();");
        }
        RefreshServerBadge(_webServer.Port, _webServer.BindAll);
    }

    private void BtnServerUrl_Click(object sender, RoutedEventArgs e)
    {
        Process.Start(new ProcessStartInfo(_webServer.LocalUrl) { UseShellExecute = true });
    }

    private void BtnMin_Click(object sender, RoutedEventArgs e) => WindowState = WindowState.Minimized;

    private void BtnMax_Click(object sender, RoutedEventArgs e) =>
        WindowState = WindowState == WindowState.Maximized ? WindowState.Normal : WindowState.Maximized;

    private void BtnClose_Click(object sender, RoutedEventArgs e) => Close();
}
