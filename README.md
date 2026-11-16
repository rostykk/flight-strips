# Flight Strips, a mod for Airside

A native **.NET 10 WPF + WebView2** electronic flight strip bay for **Airside ATC Simulator for MSFS 2024**, built strictly on Airside's official read-only **Mods for Airside** HTTP API (`GET http://127.0.0.1:24774/traffic`).

> **Note:** This mod is 100% read-only. It does not read encrypted/internal Airside files, logs, or memory, and it does not send commands back to Airside. All strip checkmarks and scratchpad notes are stored locally in WebView2 / browser `localStorage`.

## Features

- **Resizable Desktop Window:** Freely resizable borderless WPF window with **Pin** (Always on Top), **LAN** toggle (for tablets/second screens), **Browser** pop-out, and **Reload**.
- **Live ATIS & Weather Bar:** Airport ICAO, ATIS letter, active runways, wind/gusts, QNH, and visibility.
- **Calling / Waiting Queue:** Highlights aircraft waiting on you (`calling` + `waiting_s`) with an optional Web Audio chime.
- **4-Bay or 3-Bay Strip Board:** Switch between **4-Bay** (`Clearance / Stand`, `Ground / Taxi`, `Tower / Runway`, `Arrival / Departure`) and **3-Bay** (`Departures`, `Runway / Final`, `Arrivals`).
- **Position Filters & Search:** Filter by `ALL`, `MINE` (`yours`), `DEL`, `GND`, `TWR`, `DEP`, or search by callsign, type, stand, runway, SID/STAR, or squawk.
- **Desk Sync & Strip Cocking:** Highlights the `selected` aircraft from Airside's desk, lets you click strips to cock/uncock them, toggle local clearance checkmarks (`CLX`, `PB`, `TXI`, `T/O` / `ARR`, `LDG`, `STD`), and jot short notes.
- **Demo Mode:** Click **Demo** (or open `http://127.0.0.1:24775/?demo=1`) to preview the strip bay when Airside is closed.
- **Forward Compatible:** Works with Airside `0.8.0.6+` and lights up all `0.8.0.9+` fields automatically, ignoring unknown fields or words.

## Requirements

- Windows 10 / 11 with WebView2 Runtime (built into Windows 11)
- **.NET 10 SDK** (to build/run from source) or **.NET 10 Windows Desktop Runtime** (for published `.exe`)
- **Airside ATC Simulator** (`0.8.0.6` or newer; `0.8.0.9+` recommended for full strip fields)

## Setup & Usage

1. In Airside, enable the official mod API:
   **Settings -> Mods for Airside -> On -> Turn on -> Save**
2. Run `start.bat` or `dotnet run --project FlightStrips.csproj` (or build with `dotnet build -c Release`).
3. Click **Demo** if you want to preview the board before starting a shift.

### Using on a second device (tablet / phone on your LAN)

Click **LAN: Off** -> **LAN: On** in the titlebar, then open `http://<your-PC-IP>:24775/` from your tablet on the same local network.

## What It Reads

Only `GET http://127.0.0.1:24774/traffic` at 1 Hz (read-only).

### Notes on API Scope

- **No timetable / scheduled times:** By design, Airside's Mods for Airside feed carries only what the controller desk shows about active aircraft on the field (no timetable). Arrivals on approach show live `distance_nm`.
- **AI-worked positions (`yours: false`):** When Airside works a position (or in Spotter mode), `can` is empty, so `CLD` / `CTL` clearance badges only light up when `yours` is `true`.

## License

MIT
