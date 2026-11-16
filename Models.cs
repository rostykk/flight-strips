using System.Text.Json;
using System.Text.Json.Serialization;

namespace FlightStrips;

public sealed class TrafficSnapshot
{
    [JsonPropertyName("version")]
    public int Version { get; set; }

    [JsonPropertyName("airport")]
    public string? Airport { get; set; }

    [JsonPropertyName("aircraft")]
    public List<AircraftStrip>? Aircraft { get; set; }

    [JsonPropertyName("weather")]
    public WeatherInfo? Weather { get; set; }

    [JsonPropertyName("atis")]
    public AtisInfo? Atis { get; set; }

    [JsonPropertyName("selected")]
    public string? Selected { get; set; }

    [JsonExtensionData]
    public Dictionary<string, JsonElement>? Extra { get; set; }
}

public sealed class AircraftStrip
{
    [JsonPropertyName("callsign")]
    public string? Callsign { get; set; }

    [JsonPropertyName("type")]
    public string? Type { get; set; }

    [JsonPropertyName("doing")]
    public string? Doing { get; set; }

    [JsonPropertyName("stand")]
    public string? Stand { get; set; }

    [JsonPropertyName("runway")]
    public string? Runway { get; set; }

    [JsonPropertyName("calling")]
    public string? Calling { get; set; }

    [JsonPropertyName("waiting_s")]
    public int? WaitingS { get; set; }

    [JsonPropertyName("destination")]
    public string? Destination { get; set; }

    [JsonPropertyName("sid")]
    public string? Sid { get; set; }

    [JsonPropertyName("star")]
    public string? Star { get; set; }

    [JsonPropertyName("squawk")]
    public string? Squawk { get; set; }

    [JsonPropertyName("distance_nm")]
    public double? DistanceNm { get; set; }

    [JsonPropertyName("position")]
    public string? Position { get; set; }

    [JsonPropertyName("yours")]
    public bool? Yours { get; set; }

    [JsonPropertyName("handoff")]
    public string? Handoff { get; set; }

    [JsonPropertyName("initial_alt_ft")]
    public int? InitialAltFt { get; set; }

    [JsonPropertyName("wake")]
    public string? Wake { get; set; }

    [JsonPropertyName("telephony")]
    public string? Telephony { get; set; }

    [JsonPropertyName("can")]
    public List<string>? Can { get; set; }

    [JsonExtensionData]
    public Dictionary<string, JsonElement>? Extra { get; set; }
}

public sealed class WeatherInfo
{
    [JsonPropertyName("wind_dir")]
    public int? WindDir { get; set; }

    [JsonPropertyName("wind_kt")]
    public int? WindKt { get; set; }

    [JsonPropertyName("gust_kt")]
    public int? GustKt { get; set; }

    [JsonPropertyName("qnh_hpa")]
    public int? QnhHpa { get; set; }

    [JsonPropertyName("visibility_m")]
    public int? VisibilityM { get; set; }

    [JsonExtensionData]
    public Dictionary<string, JsonElement>? Extra { get; set; }
}

public sealed class AtisInfo
{
    [JsonPropertyName("letter")]
    public string? Letter { get; set; }

    [JsonPropertyName("runways")]
    public string? Runways { get; set; }

    [JsonExtensionData]
    public Dictionary<string, JsonElement>? Extra { get; set; }
}
