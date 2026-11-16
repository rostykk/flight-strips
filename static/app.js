(() => {
  "use strict";

  const STAGES = [
    { id: "PRE", label: "PRE (Servicing)" },
    { id: "CLR", label: "CLR (Clearance)" },
    { id: "PUSH", label: "PUSH (Pushback)" },
    { id: "GND", label: "GND (Taxi Out)" },
    { id: "HP", label: "HP (Holding Pt)" },
    { id: "SEQ", label: "SEQ (Lineup/T.O.)" },
    { id: "HDO", label: "HDO (Handover)" },
    { id: "FINAL", label: "FINAL (Inbound)" },
    { id: "TAXI_IN", label: "TAXI IN (Stand)" },
  ];

  const BAY_COLORS = [
    ["clearance", "Blue (CLR)"],
    ["pushback", "Gold (PUSH)"],
    ["ground", "Yellow (GND)"],
    ["hp", "Green (HP)"],
    ["seq", "Purple (SEQ)"],
    ["hdo", "Silver (HDO)"],
    ["final", "Teal (FINAL)"],
    ["taxiin", "Slate (TAXI IN)"],
    ["orange", "Airside Orange"],
  ];

  const OVERLAY_STAGE_PRIORITY = {
    SEQ: 0, HP: 1, FINAL: 2, GND: 3, PUSH: 4, CLR: 5, TAXI_IN: 6, HDO: 7, PRE: 8,
  };

  const DEFAULT_LAYOUTS = [
    {
      id: "all",
      name: "All Traffic (4 Col)",
      columns: 4,
      bays: [
        { id: "CLEARANCE", title: "CLEARANCE", color: "clearance", col: 0, stages: ["PRE", "CLR"], runway: "", compact: false, hidden: false },
        { id: "PUSHBACK", title: "PUSHBACK", color: "pushback", col: 0, stages: ["PUSH"], runway: "", compact: true, hidden: false },
        { id: "GROUND", title: "GROUND MOVEMENT", color: "ground", col: 1, stages: ["GND"], runway: "", compact: false, hidden: false },
        { id: "HOLDING_POINT", title: "HP RWY {RWY}", color: "hp", col: 1, stages: ["HP"], runway: "", compact: false, hidden: false },
        { id: "SEQUENCE", title: "SEQUENCE RWY {RWY}", color: "seq", col: 2, stages: ["SEQ"], runway: "", compact: false, hidden: false },
        { id: "HANDOVER", title: "HANDOVER", color: "hdo", col: 2, stages: ["HDO"], runway: "", compact: true, hidden: false },
        { id: "FINAL", title: "FINAL RWY {RWY}", color: "final", col: 3, stages: ["FINAL"], runway: "", compact: false, hidden: false },
        { id: "TAXI_IN", title: "TAXI IN / STAND", color: "taxiin", col: 3, stages: ["TAXI_IN"], runway: "", compact: false, hidden: false },
      ],
    },
    {
      id: "dep",
      name: "Departures Bay (3 Col)",
      columns: 3,
      bays: [
        { id: "CLEARANCE", title: "CLEARANCE", color: "clearance", col: 0, stages: ["PRE", "CLR"], runway: "", compact: false, hidden: false },
        { id: "PUSHBACK", title: "PUSHBACK", color: "pushback", col: 0, stages: ["PUSH"], runway: "", compact: true, hidden: false },
        { id: "GROUND", title: "GROUND MOVEMENT", color: "ground", col: 1, stages: ["GND"], runway: "", compact: false, hidden: false },
        { id: "HOLDING_POINT", title: "HP RWY {RWY}", color: "hp", col: 1, stages: ["HP"], runway: "", compact: false, hidden: false },
        { id: "SEQUENCE", title: "SEQUENCE RWY {RWY}", color: "seq", col: 2, stages: ["SEQ"], runway: "", compact: false, hidden: false },
        { id: "HANDOVER", title: "HANDOVER", color: "hdo", col: 2, stages: ["HDO"], runway: "", compact: true, hidden: false },
      ],
    },
    {
      id: "gnd_hp",
      name: "Combined GND + HP (3 Col)",
      columns: 3,
      bays: [
        { id: "DEL_PUSH", title: "CLEARANCE & PUSH", color: "clearance", col: 0, stages: ["PRE", "CLR", "PUSH"], runway: "", compact: false, hidden: false },
        { id: "GND_HP", title: "GROUND + HP RWY {RWY}", color: "ground", col: 1, stages: ["GND", "HP"], runway: "", compact: false, hidden: false },
        { id: "SEQUENCE", title: "SEQUENCE RWY {RWY}", color: "seq", col: 2, stages: ["SEQ"], runway: "", compact: false, hidden: false },
        { id: "FINAL", title: "ARRIVALS RWY {RWY}", color: "final", col: 2, stages: ["FINAL", "TAXI_IN"], runway: "", compact: false, hidden: false },
      ],
    },
    {
      id: "twr_compact",
      name: "Compact Tower (2 Col)",
      columns: 2,
      bays: [
        { id: "DEL_GND", title: "DEL / PUSH / GND", color: "pushback", col: 0, stages: ["CLR", "PUSH", "GND"], runway: "", compact: false, hidden: false },
        { id: "TWR_RWY", title: "TWR HP / SEQ / FINAL", color: "seq", col: 1, stages: ["HP", "SEQ", "FINAL"], runway: "", compact: false, hidden: false },
      ],
    },
    {
      id: "efps_twr",
      name: "EFPS Combined TWR (3 Col)",
      columns: 3,
      bays: [
        { id: "CLEARANCE", title: "CLEARANCE (DEL)", color: "clearance", col: 0, stages: ["PRE", "CLR"], runway: "", compact: false, hidden: false },
        { id: "PUSHBACK", title: "PUSH / START (GMC)", color: "pushback", col: 0, stages: ["PUSH"], runway: "", compact: true, hidden: false },
        { id: "GROUND", title: "TAXI OUT (GMC)", color: "ground", col: 1, stages: ["GND"], runway: "", compact: false, hidden: false },
        { id: "HOLDING_POINT", title: "HP RWY {RWY}", color: "hp", col: 1, stages: ["HP"], runway: "", compact: false, hidden: false },
        { id: "FINAL", title: "FINAL / APP", color: "final", col: 2, stages: ["FINAL"], runway: "", compact: false, hidden: false },
        { id: "SEQUENCE", title: "RWY {RWY} / SEQ", color: "seq", col: 2, stages: ["SEQ"], runway: "", compact: false, hidden: false },
        { id: "TAXI_IN", title: "VACATED / HDO", color: "taxiin", col: 2, stages: ["TAXI_IN", "HDO"], runway: "", compact: false, hidden: false },
      ],
    },
    {
      id: "air_twr",
      name: "AIR / Tower Control (3 Col)",
      columns: 3,
      bays: [
        { id: "HOLDING_POINT", title: "HOLDING POINT {RWY}", color: "hp", col: 0, stages: ["HP"], runway: "", compact: false, hidden: false },
        { id: "GND_FEED", title: "DELIVERY / GND FEED", color: "ground", col: 0, stages: ["CLR", "PUSH", "GND"], runway: "", compact: false, hidden: false },
        { id: "SEQUENCE", title: "RUNWAY {RWY}", color: "seq", col: 1, stages: ["SEQ"], runway: "", compact: false, hidden: false },
        { id: "HANDOVER", title: "AIRBORNE / HANDOVER", color: "hdo", col: 1, stages: ["HDO"], runway: "", compact: true, hidden: false },
        { id: "FINAL", title: "FINAL APPROACH", color: "final", col: 2, stages: ["FINAL"], runway: "", compact: false, hidden: false },
        { id: "TAXI_IN", title: "VACATED / TAXI IN", color: "taxiin", col: 2, stages: ["TAXI_IN"], runway: "", compact: false, hidden: false },
      ],
    },
    {
      id: "gmc_gnd",
      name: "GMC / Ground Control (3 Col)",
      columns: 3,
      bays: [
        { id: "CLEARANCE", title: "CLEARANCE (DEL)", color: "clearance", col: 0, stages: ["PRE", "CLR"], runway: "", compact: false, hidden: false },
        { id: "PUSHBACK", title: "PUSHBACK", color: "pushback", col: 0, stages: ["PUSH"], runway: "", compact: true, hidden: false },
        { id: "GROUND", title: "TAXI OUT (GMC)", color: "ground", col: 1, stages: ["GND"], runway: "", compact: false, hidden: false },
        { id: "HOLDING_POINT", title: "HP RWY {RWY} (TO AIR)", color: "hp", col: 2, stages: ["HP"], runway: "", compact: false, hidden: false },
        { id: "TAXI_IN", title: "TAXI IN / STAND", color: "taxiin", col: 2, stages: ["TAXI_IN"], runway: "", compact: false, hidden: false },
      ],
    },
    {
      id: "dual_rwy",
      name: "Dual Runway TWR (4 Col)",
      columns: 4,
      bays: [
        { id: "CLEARANCE", title: "CLEARANCE (DEL)", color: "clearance", col: 0, stages: ["PRE", "CLR"], runway: "", compact: false, hidden: false },
        { id: "PUSHBACK", title: "PUSH / START (GMC)", color: "pushback", col: 0, stages: ["PUSH"], runway: "", compact: true, hidden: false },
        { id: "GROUND", title: "TAXI OUT (GMC)", color: "ground", col: 1, stages: ["GND"], runway: "", compact: false, hidden: false },
        { id: "TAXI_IN", title: "TAXI IN / STAND", color: "taxiin", col: 1, stages: ["TAXI_IN"], runway: "", compact: false, hidden: false },
        { id: "HANDOVER", title: "AIRBORNE / HDO", color: "hdo", col: 1, stages: ["HDO"], runway: "", compact: true, hidden: false },
        { id: "FINAL_RWY1", title: "FINAL {RWY1}", color: "final", col: 2, stages: ["FINAL"], runway: "RWY1", compact: false, hidden: false },
        { id: "SEQ_RWY1", title: "RWY {RWY1} / SEQ", color: "seq", col: 2, stages: ["SEQ"], runway: "RWY1", compact: false, hidden: false },
        { id: "HP_RWY1", title: "HP RWY {RWY1}", color: "hp", col: 2, stages: ["HP"], runway: "RWY1", compact: false, hidden: false },
        { id: "FINAL_RWY2", title: "FINAL {RWY2}", color: "final", col: 3, stages: ["FINAL"], runway: "RWY2", compact: false, hidden: false },
        { id: "SEQ_RWY2", title: "RWY {RWY2} / SEQ", color: "seq", col: 3, stages: ["SEQ"], runway: "RWY2", compact: false, hidden: false },
        { id: "HP_RWY2", title: "HP RWY {RWY2}", color: "hp", col: 3, stages: ["HP"], runway: "RWY2", compact: false, hidden: false },
      ],
    },
  ];

  const DEMO_TRAFFIC = {
    version: 1,
    airport: "UKLL",
    weather: { wind_dir: 150, wind_kt: 10, gust_kt: 0, qnh_hpa: 1018, visibility_m: 10000 },
    atis: { letter: "A", runways: "13" },
    selected: "AUI237",
    aircraft: [
      {
        callsign: "AEW5667", type: "B738", wake: "M", telephony: "Aerosvit 5667",
        doing: "at stand", stand: "A3", runway: "13", calling: "clearance", waiting_s: 28,
        destination: "UKBB", sid: "", star: "", squawk: "", distance_nm: null,
        position: "delivery", yours: true, handoff: "", initial_alt_ft: 0, can: ["clearance", "hold"],
      },
      {
        callsign: "WZZ924", type: "A320", wake: "M", telephony: "Wizzair 924",
        doing: "pushing back", stand: "A6", runway: "13", calling: "", waiting_s: 0,
        destination: "EPWA", sid: "OLERA1D", star: "", squawk: "2415", distance_nm: null,
        position: "ground", yours: true, handoff: "", initial_alt_ft: 6000, can: ["taxi", "hold", "handoff"],
      },
      {
        callsign: "LOT764", type: "E190", wake: "M", telephony: "LOT 764",
        doing: "holding short", stand: "", runway: "13", calling: "takeoff", waiting_s: 14,
        destination: "EPWA", sid: "OLERA1D", star: "", squawk: "2411", distance_nm: null,
        position: "tower", yours: true, handoff: "", initial_alt_ft: 6000, can: ["line up", "takeoff", "hold"],
      },
      {
        callsign: "AUI237", type: "B738", wake: "M", telephony: "Ukraine International 237",
        doing: "taxiing in", stand: "A7B", runway: "13", calling: "", waiting_s: 0,
        destination: "", sid: "", star: "KIL13", squawk: "4102", distance_nm: null,
        position: "ground", yours: true, handoff: "", initial_alt_ft: 0, can: ["taxi route", "hold", "stand"],
      },
      {
        callsign: "SQP445", type: "B738", wake: "M", telephony: "SkyUp 445",
        doing: "on final", stand: "A7A", runway: "13", calling: "landing", waiting_s: 9,
        destination: "", sid: "", star: "KIL13", squawk: "4117", distance_nm: 4.6,
        position: "tower", yours: true, handoff: "", initial_alt_ft: 0, can: ["landing", "go around", "minimum approach speed"],
      },
      {
        callsign: "UR-LVV", type: "C172", wake: "L", telephony: "UR-LVV",
        doing: "arriving", stand: "14", runway: "13", calling: "", waiting_s: 0,
        destination: "", sid: "", star: "", squawk: "7000", distance_nm: 9.2,
        position: "tower", yours: false, handoff: "TWR 118.500", initial_alt_ft: 0, can: ["join circuit", "hold outside"],
      },
      {
        callsign: "RYR4108", type: "B738", wake: "M", telephony: "Ryanair 4108",
        doing: "departed", stand: "", runway: "13", calling: "", waiting_s: 0,
        destination: "EDDM", sid: "AMERO1D", star: "", squawk: "2407", distance_nm: null,
        position: "departure", yours: false, handoff: "DEP 124.300", initial_alt_ft: 7000, can: ["handoff"],
      },
    ],
  };

  const STORE_CFG_KEY = "flight_strips_cfg_v2";
  const STORE_OVERRIDES_KEY = "flight_strips_overrides_v1";

  const urlParams = new URLSearchParams(window.location.search);
  const obsTransparent = urlParams.get("overlay") === "1" || urlParams.get("obs") === "1";
  const isDockBar = obsTransparent && urlParams.get("dock") === "1";
  const obsMax = Math.max(1, Math.min(12, Number(urlParams.get("max") || 6)));
  const obsSingleRow = obsTransparent && urlParams.get("wrap") !== "1" && urlParams.get("rows") !== "0";
  const obsBayFilter = (urlParams.get("bay") || "").toUpperCase().split(",").filter(Boolean);
  let demoMode = urlParams.get("demo") === "1";
  const urlPreset = urlParams.get("preset") || "";
  const urlEfps = urlParams.get("efps");

  let cfg = loadCfg();
  if (urlPreset && cfg.layouts.some((l) => l.id === urlPreset)) {
    cfg.activeLayoutId = urlPreset;
  }
  if (urlEfps === "0") {
    cfg.efpsColors = false;
  }
  let overrides = loadOverrides();
  let rawTraffic = null;
  let apiOnline = false;
  let streamerMode = false;
  let overlayPreview = obsTransparent;
  let draggingCs = null;
  let editingCs = null;
  let inlineEditingCs = null;
  let draftLayout = null;
  let boardSig = "";
  let baySigs = {};
  let lastDockSentH = 0;
  const hdoSeenAt = {};

  if (obsTransparent) {
    document.documentElement.classList.add("obs-transparent");
    document.body.classList.add("obs-transparent", "overlay-active");
    if (isDockBar) {
      document.documentElement.classList.add("dock-bar");
      document.body.classList.add("dock-bar");
    }
  }

  const $ = (id) => document.getElementById(id);

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function loadCfg() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_CFG_KEY) || "null");
      if (saved && Array.isArray(saved.layouts) && saved.layouts.length) return saved;
    } catch { }
    return {
      activeLayoutId: DEFAULT_LAYOUTS[0].id,
      showPre: true,
      efpsColors: true,
      bottomUpRwy: true,
      layouts: clone(DEFAULT_LAYOUTS),
    };
  }

  function saveCfg() {
    try { localStorage.setItem(STORE_CFG_KEY, JSON.stringify(cfg)); } catch { }
  }

  function loadOverrides() {
    try {
      return JSON.parse(localStorage.getItem(STORE_OVERRIDES_KEY) || "{}") || {};
    } catch {
      return {};
    }
  }

  function saveOverrides() {
    try { localStorage.setItem(STORE_OVERRIDES_KEY, JSON.stringify(overrides)); } catch { }
  }

  function getOv(cs) {
    if (!overrides[cs]) overrides[cs] = {};
    return overrides[cs];
  }

  function esc(str) {
    return String(str ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  function activeLayout() {
    return cfg.layouts.find((l) => l.id === cfg.activeLayoutId) || cfg.layouts[0];
  }

  function mapStage(ac) {
    const doing = (ac.doing || "").toLowerCase();
    const calling = (ac.calling || "").toLowerCase();
    if (doing === "at stand") {
      if (calling === "pushback" || calling === "start") return "PUSH";
      if (calling === "clearance" || ac.sid || ac.squawk) return "CLR";
      return "PRE";
    }
    if (doing === "pushing back") return "PUSH";
    if (doing === "taxiing out") return "GND";
    if (doing === "holding short") return "HP";
    if (doing === "lining up" || doing === "taking off") return "SEQ";
    if (doing === "departed") return "HDO";
    if (doing === "arriving" || doing === "on final" || doing === "landed") return "FINAL";
    if (doing === "taxiing in" || doing === "parked") return "TAXI_IN";
    return ac.destination || ac.sid ? "CLR" : "FINAL";
  }

  function isDeparture(ac) {
    if (ac.destination || ac.sid) return true;
    if (ac.star || (ac.distance_nm !== null && ac.distance_nm !== undefined)) return false;
    const st = mapStage(ac);
    return st !== "FINAL" && st !== "TAXI_IN";
  }

  function buildStrip(ac, apiIndex) {
    const cs = ac.callsign || "UNKNOWN";
    const ov = overrides[cs] || {};
    const stage = mapStage(ac);
    const dep = isDeparture(ac);
    const doing = (ac.doing || "").toLowerCase();

    // Auto-clear departed HDO strips instead of keeping them for ~7 min in /traffic
    if (stage === "HDO") {
      if (!hdoSeenAt[cs]) hdoSeenAt[cs] = Date.now();
      const elapsedMs = Date.now() - hdoSeenAt[cs];
      const alreadyOnDep = (ac.position || "").toLowerCase() === "departure" && ac.yours === false && !ac.calling;
      if (elapsedMs > (alreadyOnDep ? 15000 : 45000)) {
        return null;
      }
    } else {
      delete hdoSeenAt[cs];
      if (ov.hdoDismissed) {
        delete ov.hdoDismissed;
        saveOverrides();
      }
    }
    if (ov.hdoDismissed && stage === "HDO") return null;
    const altVal = ov.alt ?? (ac.initial_alt_ft ? `${ac.initial_alt_ft}ft` : "");
    const sidVal = ov.sid ?? (dep ? (ac.sid || ac.destination || "") : (ac.star || ""));
    const rwyVal = ov.runway ?? (ac.runway || "");
    const sqkVal = ov.squawk ?? (ac.squawk || "");

    const routeParts = [];
    if (dep) {
      if (ac.stand) routeParts.push(`Stand ${ac.stand}`);
      if (ac.destination) routeParts.push(`To ${ac.destination}`);
      if (ac.sid) routeParts.push(`SID ${ac.sid}`);
    } else {
      if (ac.distance_nm !== null && ac.distance_nm !== undefined) routeParts.push(`${Number(ac.distance_nm).toFixed(1)} NM`);
      if (ac.star) routeParts.push(`STAR ${ac.star}`);
      if (ac.stand) routeParts.push(`Stand ${ac.stand}`);
    }
    if (ac.handoff) routeParts.push(`HO ${ac.handoff}`);
    if (!routeParts.length && ac.doing) routeParts.push(ac.doing);

    const airport = rawTraffic?.airport || (demoMode ? "UKLL" : "");
    const originTxt = dep
      ? (ac.stand ? `${airport ? `${airport} ` : ""}St ${ac.stand}` : (ac.position || "").toUpperCase())
      : (ac.stand ? `${airport ? `${airport} ` : ""}St ${ac.stand}` : (ac.star || "ARR"));

    const canList = Array.isArray(ac.can) ? ac.can : [];
    const canSet = new Set(canList.map((c) => String(c).toLowerCase()));
    const isTkoPhase = doing === "holding short" || doing === "lining up" || doing === "taking off";
    if (doing === "taking off" || (isTkoPhase && (canSet.has("cancel takeoff") || canSet.has("reject takeoff")))) {
      getOv(cs).takeoffCleared = true;
    } else if (!isTkoPhase && ov.takeoffCleared) {
      delete ov.takeoffCleared;
      saveOverrides();
    }
    const takeoffCleared = Boolean((overrides[cs] || ov).takeoffCleared);

    const isFinalPhase = doing === "on final" || doing === "arriving";
    if (isFinalPhase && ac.yours === true && !canSet.has("landing") && !canSet.has("approach")) {
      getOv(cs).landingCleared = true;
    } else if (!isFinalPhase && ov.landingCleared) {
      delete ov.landingCleared;
      saveOverrides();
    }
    const landingCleared = Boolean((overrides[cs] || ov).landingCleared);

    return {
      callsign: cs,
      telephony: ac.telephony || "",
      origin: originTxt,
      type: ac.type || "",
      wake: ac.wake || "",
      runway: rwyVal,
      squawk: sqkVal,
      dest: ac.destination || "",
      sid: sidVal,
      alt: ac.initial_alt_ft ? String(ac.initial_alt_ft) : (ov.alt || ""),
      distanceNm: ac.distance_nm,
      schedTime: ac.scheduled_time || ac.sched_time || ac.time || "",
      direction: dep ? "DEP" : "ARR",
      stage,
      doing: ac.doing || "",
      calling: ac.calling || "",
      waitingS: ac.waiting_s || 0,
      yours: ac.yours,
      handoff: ac.handoff || "",
      selected: rawTraffic?.selected === cs,
      takeoffCleared,
      landingCleared,
      can: canList,
      routeText: routeParts.join(" · "),
      rmk: ov.rmk || "",
      cocked: Boolean(ov.cocked),
      pinBay: ov.pinBay || "",
      order: ov.order ?? 9999,
      apiIndex: apiIndex ?? 0,
      hidden: Boolean(ov.hidden),
      held: doing === "holding short" || Boolean(ac.calling),
    };
  }

  function activeRunwaysList(data) {
    const rwys = data?.atis?.runways || "";
    if (!rwys) return [];
    return String(rwys)
      .split(/[\s,\/]+/)
      .map((r) => r.trim().toUpperCase())
      .filter((r) => r && r !== "AND" && r !== "&");
  }

  function resolveBayRunwayFilter(bay, rwys) {
    const raw = (bay?.runway || "").trim().toUpperCase();
    if (!raw) return "";
    if (raw === "RWY1") return rwys[0] || "__NONE__";
    if (raw === "RWY2") return rwys[1] || "__NONE__";
    if (raw === "RWY3") return rwys[2] || "__NONE__";
    return raw;
  }

  function formatBayTitle(bay, rwys) {
    const resolved = resolveBayRunwayFilter(bay, rwys);
    const singleOrAll = resolved === "__NONE__" ? "--" : (resolved || (rwys.length ? rwys.join(" / ") : "--"));
    return (bay?.title || bay?.id || "")
      .replaceAll("{RWY1}", rwys[0] || "--")
      .replaceAll("{RWY2}", rwys[1] || "--")
      .replaceAll("{RWY3}", rwys[2] || "--")
      .replaceAll("{RWY}", singleOrAll)
      .trim();
  }

  const STAGE_RANK = {
    PRE: 0, CLR: 1, PUSH: 2, GND: 3, HP: 4, SEQ: 5, HDO: 6,
    FINAL: 0, TAXI_IN: 1,
  };

  function resolveStripBay(s, visibleBays, rwys) {
    if (s.pinBay) {
      const pinnedBay = visibleBays.find((b) => b.id === s.pinBay);
      if (pinnedBay) {
        const bayMaxRank = Math.max(...(pinnedBay.stages || []).map((st) => STAGE_RANK[st] ?? -1), -1);
        const liveRank = STAGE_RANK[s.stage] ?? -1;
        // Auto-clear pin once live telemetry catches up to or passes the pinned bay
        if (liveRank >= 0 && bayMaxRank >= 0 && liveRank >= bayMaxRank && (pinnedBay.stages || []).includes(s.stage)) {
          delete getOv(s.callsign).pinBay;
          delete getOv(s.callsign).order;
          s.pinBay = "";
          saveOverrides();
        } else {
          return s.pinBay;
        }
      }
    }
    const normRwy = (s.runway || "").trim().toUpperCase();
    const matchingStage = visibleBays.filter((b) => (b.stages || []).includes(s.stage));
    if (!matchingStage.length) return null;
    if (normRwy) {
      const exact = matchingStage.find((b) => resolveBayRunwayFilter(b, rwys) === normRwy);
      if (exact) return exact.id;
    }
    const unfiltered = matchingStage.find((b) => !resolveBayRunwayFilter(b, rwys));
    return (unfiltered || matchingStage[0]).id;
  }

  function nextBayId(curBayId, visibleBays, strip, rwys) {
    const idx = visibleBays.findIndex((b) => b.id === curBayId);
    if (idx < 0) return null;
    const normRwy = (strip?.runway || "").trim().toUpperCase();
    for (let i = idx + 1; i < visibleBays.length; i++) {
      const filter = resolveBayRunwayFilter(visibleBays[i], rwys);
      if (!filter || (normRwy && filter === normRwy)) return visibleBays[i].id;
    }
    return idx + 1 < visibleBays.length ? visibleBays[idx + 1].id : null;
  }

  function accentClass(s) {
    if (s.stage === "PRE") return "acc-servicing";
    if (s.stage === "CLR") return "acc-clearance";
    if (s.stage === "PUSH") return "acc-push";
    if (s.stage === "GND") return "acc-taxi";
    if (s.stage === "HP") return "acc-hold";
    if (s.stage === "SEQ") return "acc-runway";
    if (s.stage === "HDO") return "acc-handover";
    if (s.stage === "FINAL") return "acc-inbound";
    if (s.stage === "TAXI_IN") return (s.doing || "").toLowerCase() === "parked" ? "acc-servicing" : "acc-inbound";
    return "acc-taxi";
  }

  function stripActionLabel(s) {
    const doing = (s.doing || "").toLowerCase();
    const calling = (s.calling || "").toLowerCase();
    if (s.stage === "PRE") return "PRE";
    if (s.stage === "CLR") return "CLR";
    if (s.stage === "PUSH") return calling === "taxi" ? "TXI" : "CPB";
    if (s.stage === "GND") return "TXI";
    if (s.stage === "HP") return s.takeoffCleared ? "CTL" : (calling === "takeoff" || calling === "line up" ? "RDY" : "HP");
    if (s.stage === "SEQ") return s.takeoffCleared ? "CTL" : "LUW";
    if (s.stage === "HDO") return "HDO";
    if (s.stage === "FINAL") {
      if (doing === "landed") return "VAC";
      if (s.landingCleared) return "CLD";
      if (calling === "landing") return "LND";
      return "APP";
    }
    if (s.stage === "TAXI_IN") return doing === "parked" ? "GATE" : "PRK";
    return "CLR";
  }

  function clearDragIndicators() {
    document.querySelectorAll(".drag-target-top,.drag-target-bot").forEach((n) => {
      n.classList.remove("drag-target-top", "drag-target-bot");
    });
  }

  function startInlineRmk(el, s) {
    const wrap = el.querySelector(".s-rmk-wrap");
    if (!wrap || wrap.querySelector("input")) return;
    inlineEditingCs = s.callsign;
    const inp = document.createElement("input");
    inp.className = "s-rmk-input";
    inp.type = "text";
    inp.value = s.rmk || "";
    inp.placeholder = "Add note / remark...";
    wrap.innerHTML = `<span class="s-rmk-lbl">Rmk:</span>`;
    wrap.appendChild(inp);
    inp.focus();
    inp.select();

    let done = false;
    const finish = (save) => {
      if (done) return;
      done = true;
      inlineEditingCs = null;
      if (save) {
        getOv(s.callsign).rmk = inp.value.trim();
        saveOverrides();
      }
      render();
    };
    inp.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") { ev.preventDefault(); finish(true); }
      else if (ev.key === "Escape") { ev.preventDefault(); finish(false); }
    });
    inp.addEventListener("blur", () => finish(true));
  }

  function openEditModal(s) {
    editingCs = s.callsign;
    $("editTitle").textContent = `Edit Strip — ${s.callsign}`;
    $("edRmk").value = s.rmk || "";
    $("edRwy").value = s.runway || "";
    $("edAlt").value = s.alt || "";
    $("edSid").value = s.sid || "";
    $("edSqk").value = s.squawk || "";
    $("editModal").classList.remove("hidden");
  }

  function makeStripEl(s, bayId, visibleBays, rwys) {
    const el = document.createElement("div");
    const dirCls = s.direction === "DEP" ? "dir-dep" : "dir-arr";
    const callCls = s.calling ? "has-call" : "";
    const heldCls = s.selected ? "is-held" : "";
    el.className = `strip ${dirCls} ${s.cocked ? "cocked" : ""} ${callCls} ${heldCls}`;
    el.dataset.cs = s.callsign;
    el.draggable = true;

    const callTag = s.calling ? `<span class="call-badge">${esc(s.calling.toUpperCase())} ${s.waitingS}s</span>` : "";
    const rmkHtml = s.rmk
      ? `<span class="s-rmk">${esc(s.rmk)}</span>`
      : `<span class="s-rmk empty">${s.selected ? "Selected on desk" : "Click to add note..."}</span>`;
    const typeWake = [s.type, s.wake].filter(Boolean).join("/");
    const actCls = s.calling ? "act-ready" : (s.takeoffCleared ? "act-ctl" : (s.landingCleared ? "act-cld" : ""));
    const nextId = nextBayId(bayId, visibleBays, s, rwys);

    el.innerHTML = `
      <div class="s-accent ${accentClass(s)}" title="Click to cock/uncock strip"></div>
      <div class="s-block">
        <div class="s-cs">${esc(s.callsign)}${s.pinBay ? `<span class="pin-tag" title="Pinned to bay">📌</span>` : ""}</div>
        <div class="s-tele" title="${esc(s.telephony)}">${esc(s.telephony)}</div>
        <div class="s-orig"><span>${esc(s.origin)}</span>${callTag}</div>
      </div>
      <div class="s-block">
        <div class="s-topmeta">
          <span>${esc(s.alt || "----")}</span>
          <span>${esc(s.squawk || "----")}</span>
          <span class="s-dest">${esc(s.dest || "----")}</span>
          ${s.schedTime ? `<span>${esc(s.schedTime)}</span>` : ""}
          <span>I</span>
        </div>
        <div class="s-route" title="${esc(s.routeText)}">${esc(s.routeText)}</div>
        <div class="s-rmk-wrap" title="Click to edit strip remark">
          <span class="s-rmk-lbl">Rmk:</span>${rmkHtml}
        </div>
      </div>
      <div class="s-rwybox">
        <div class="s-type">${esc(typeWake)}</div>
        <div class="s-rwy">${esc(s.runway || "--")}</div>
        <div class="s-spd">${esc(s.distanceNm != null && s.distanceNm > 0.5 ? `${Number(s.distanceNm).toFixed(1)}nm` : (s.yours === true ? "YOU" : s.yours === false ? "AI" : ""))}</div>
      </div>
      <button class="s-act ${actCls}" title="${nextId ? "Click to move to next bay" : "Edit strip"}">${esc(stripActionLabel(s))}</button>
    `;

    el.querySelector(".s-accent").addEventListener("click", (e) => {
      e.stopPropagation();
      const ov = getOv(s.callsign);
      ov.cocked = !s.cocked;
      saveOverrides();
      render();
    });

    el.querySelector(".s-rmk-wrap").addEventListener("click", (e) => {
      e.stopPropagation();
      startInlineRmk(el, s);
    });

    el.querySelector(".s-act").addEventListener("click", (e) => {
      e.stopPropagation();
      if (s.stage === "HDO") {
        getOv(s.callsign).hdoDismissed = true;
        saveOverrides();
        render();
      } else if (nextId) {
        getOv(s.callsign).pinBay = nextId;
        saveOverrides();
        render();
      } else {
        openEditModal(s);
      }
    });

    el.addEventListener("dblclick", () => openEditModal(s));

    el.addEventListener("dragstart", (e) => {
      draggingCs = s.callsign;
      e.dataTransfer.setData("text/plain", s.callsign);
    });

    el.addEventListener("dragend", () => {
      draggingCs = null;
      clearDragIndicators();
    });

    el.addEventListener("dragover", (e) => {
      if (!draggingCs || draggingCs === s.callsign) return;
      e.preventDefault();
      clearDragIndicators();
      const rect = el.getBoundingClientRect();
      const before = (e.clientY - rect.top) < rect.height / 2;
      el.classList.add(before ? "drag-target-top" : "drag-target-bot");
    });

    el.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      clearDragIndicators();
      const cs = e.dataTransfer.getData("text/plain") || draggingCs;
      if (!cs || cs === s.callsign) return;
      const ov = getOv(cs);
      ov.pinBay = bayId;
      const rect = el.getBoundingClientRect();
      const before = (e.clientY - rect.top) < rect.height / 2;
      ov.order = before ? (s.order - 0.5) : (s.order + 0.5);
      saveOverrides();
      render();
    });

    return el;
  }

  function renderHeader(data, strips) {
    const dot = $("statusDot");
    const ovDot = $("ovDot");
    const statusCls = demoMode ? "demo" : (apiOnline ? "live" : "idle");
    dot.className = `dot ${statusCls}`;
    if (ovDot) ovDot.className = `dot ${statusCls}`;

    const icao = data?.airport || "----";
    $("icaoBadge").textContent = icao;
    $("airportName").textContent = demoMode
      ? "Demo Mode (Sample UKLL Traffic)"
      : (apiOnline ? "Connected via Mods for Airside (1 Hz)" : "Waiting for Airside Mods API (127.0.0.1:24774)...");

    const wx = data?.weather;
    const windTxt = !wx
      ? "WIND ---/--KT"
      : (wx.wind_dir == null ? (wx.wind_kt ? `WIND VRB/${wx.wind_kt}KT` : "WIND CALM")
        : `WIND ${String(wx.wind_dir).padStart(3, "0")}/${wx.wind_kt ?? 0}${wx.gust_kt ? `G${wx.gust_kt}` : ""}KT`);
    const qnhTxt = wx?.qnh_hpa ? `QNH ${wx.qnh_hpa}` : "QNH ----";
    const visTxt = wx?.visibility_m != null
      ? (wx.visibility_m >= 10000 ? "VIS 10KM+" : `VIS ${wx.visibility_m}M`)
      : "VIS --";

    const bar = $("metarBar");
    bar.children[0].textContent = windTxt;
    bar.children[1].textContent = qnhTxt;
    bar.children[2].textContent = visTxt;
    $("atisPill").textContent = `ATIS ${data?.atis?.letter || "-"}`;
    $("rwyPill").textContent = `RWY ${data?.atis?.runways || "--"}`;

    $("cntCalls").textContent = String(strips.filter((s) => Boolean(s.calling)).length);
    $("cntDep").textContent = String(strips.filter((s) => s.direction === "DEP").length);
    $("cntArr").textContent = String(strips.filter((s) => s.direction === "ARR").length);

    const callingFirst = strips.find((s) => Boolean(s.calling));
    $("radioTicker").textContent = callingFirst
      ? `${callingFirst.callsign} calling for ${callingFirst.calling} (${callingFirst.waitingS}s)`
      : (apiOnline ? `Airside v${data?.version ?? 1} · ${strips.length} active aircraft · Selected: ${data?.selected || "none"}`
        : "Enable Settings → Mods for Airside → On in Airside, or click Demo.");
    $("serverFooterUrl").textContent = streamerMode ? "Streamer Mode (IP Hidden)" : window.location.origin;

    // Sync presets dropdown
    const sel = $("presetSelect");
    const wantOpts = cfg.layouts.map((l) => l.id).join("|");
    if (sel.dataset.opts !== wantOpts) {
      sel.dataset.opts = wantOpts;
      sel.innerHTML = cfg.layouts.map((l) => `<option value="${esc(l.id)}">${esc(l.name)}</option>`).join("");
    }
    sel.value = activeLayout().id;

    $("showPreChk").checked = cfg.showPre !== false;
    $("efpsColorsChk").checked = cfg.efpsColors !== false;
    $("bottomUpRwyChk").checked = cfg.bottomUpRwy !== false;
    document.body.classList.toggle("efps-colors", cfg.efpsColors !== false);
    $("btnDemo").classList.toggle("active", demoMode);
  }

  function renderOverlay(strips, data, rwys) {
    const dock = $("overlayDock");
    if (!overlayPreview && !obsTransparent) {
      dock.classList.add("hidden");
      return;
    }
    dock.classList.remove("hidden");
    $("ovIcao").textContent = data?.airport || "----";
    $("ovRwy").textContent = `RWY ${rwys.join(" / ") || "--"}`;
    $("ovWx").textContent = `${$("metarBar").children[0].textContent} · ${$("metarBar").children[1].textContent}`;
    $("ovRadio").textContent = $("radioTicker").textContent;

    const host = $("overlayStrips");
    host.innerHTML = "";
    let list = strips.filter((s) => !s.hidden && (cfg.showPre || s.stage !== "PRE"));
    if (obsBayFilter.length) {
      list = list.filter((s) => obsBayFilter.includes(s.stage));
    }
    list.sort((a, b) => {
      const ca = a.calling ? 0 : 1;
      const cb = b.calling ? 0 : 1;
      if (ca !== cb) return ca - cb;
      const pa = OVERLAY_STAGE_PRIORITY[a.stage] ?? 9;
      const pb = OVERLAY_STAGE_PRIORITY[b.stage] ?? 9;
      if (pa !== pb) return pa - pb;
      return a.order - b.order;
    });
    const shown = list.slice(0, obsMax);
    if (!shown.length) {
      host.innerHTML = `<div class="ov-empty">No active traffic</div>`;
    } else {
      const layout = activeLayout();
      const visibleBays = layout.bays.filter((b) => !b.hidden);
      for (const s of shown) {
        host.appendChild(makeStripEl(s, resolveStripBay(s, visibleBays, rwys), visibleBays, rwys));
      }
    }

    if (obsSingleRow) {
      host.style.gridTemplateColumns = `repeat(${Math.max(1, shown.length)}, minmax(220px, 1fr))`;
    }

    if (isDockBar && window.chrome?.webview?.postMessage) {
      const h = dock.getBoundingClientRect().height;
      if (h > 10 && Math.abs(h - lastDockSentH) >= 2) {
        lastDockSentH = h;
        window.chrome.webview.postMessage({ type: "dockHeight", height: h });
      }
    }
  }

  function render() {
    if (inlineEditingCs) return;
    const data = demoMode ? DEMO_TRAFFIC : rawTraffic;
    const acList = Array.isArray(data?.aircraft) ? data.aircraft : [];
    const strips = acList.map((ac, idx) => buildStrip(ac, idx)).filter(Boolean);
    const rwys = activeRunwaysList(data);

    renderHeader(data, strips);
    renderOverlay(strips, data, rwys);

    if (overlayPreview || obsTransparent) return;

    const layout = activeLayout();
    const cols = Math.max(1, Math.min(5, layout.columns || 4));
    const visibleBays = layout.bays.filter((b) => !b.hidden);
    const board = $("bayBoard");
    board.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;

    const structSig = `${layout.id}:${cols}:${visibleBays.map((b) => `${b.id}:${b.col}:${b.color}:${formatBayTitle(b, rwys)}:${b.compact}`).join("|")}`;
    if (boardSig !== structSig) {
      boardSig = structSig;
      baySigs = {};
      board.innerHTML = "";

      const colEls = [];
      for (let c = 0; c < cols; c++) {
        const colEl = document.createElement("div");
        colEl.className = "bay-col";
        board.appendChild(colEl);
        colEls.push(colEl);
      }

      for (const b of visibleBays) {
        const colIdx = Math.max(0, Math.min(cols - 1, b.col || 0));
        const bayEl = document.createElement("section");
        bayEl.className = `bay ${b.compact ? "bay-compact" : ""}`;
        bayEl.dataset.bay = b.id;
        bayEl.innerHTML = `
          <div class="bay-hdr hdr-${esc(b.color || "ground")}">
            <span>${esc(formatBayTitle(b, rwys))}</span>
            <div class="bay-hdr-right">
              <span class="rwy-status hidden"></span>
              <span class="bay-cnt">0</span>
            </div>
          </div>
          <div class="bay-list"></div>
        `;

        bayEl.addEventListener("dragover", (e) => {
          if (!draggingCs) return;
          e.preventDefault();
          bayEl.classList.add("drag-over");
        });
        bayEl.addEventListener("dragleave", () => bayEl.classList.remove("drag-over"));
        bayEl.addEventListener("drop", (e) => {
          e.preventDefault();
          bayEl.classList.remove("drag-over");
          clearDragIndicators();
          const cs = e.dataTransfer.getData("text/plain") || draggingCs;
          if (!cs) return;
          const ov = getOv(cs);
          ov.pinBay = b.id;
          ov.order = Date.now() / 1000;
          saveOverrides();
          render();
        });

        colEls[colIdx].appendChild(bayEl);
      }
    }

    const grouped = Object.fromEntries(visibleBays.map((b) => [b.id, []]));
    for (const s of strips) {
      if (s.hidden) continue;
      if (!cfg.showPre && s.stage === "PRE" && !s.pinBay) continue;
      const bId = resolveStripBay(s, visibleBays, rwys);
      if (bId && grouped[bId]) grouped[bId].push(s);
    }

    for (const b of visibleBays) {
      const bayEl = board.querySelector(`.bay[data-bay="${CSS.escape(b.id)}"]`);
      if (!bayEl) continue;
      const isFinalBay = (b.stages || []).includes("FINAL");
      const items = grouped[b.id].sort((a, b2) => {
        if (a.order !== b2.order) return a.order - b2.order;
        const aw = a.calling ? (a.waitingS || 0) : -1;
        const bw = b2.calling ? (b2.waitingS || 0) : -1;
        if (aw !== bw) return bw - aw;
        if (isFinalBay) {
          const ad = a.distanceNm != null ? Number(a.distanceNm) : 9999;
          const bd = b2.distanceNm != null ? Number(b2.distanceNm) : 9999;
          if (ad !== bd) return ad - bd;
        }
        return a.apiIndex - b2.apiIndex;
      });

      const listEl = bayEl.querySelector(".bay-list");
      const isRwyBay = (b.stages || []).some((st) => st === "HP" || st === "SEQ" || st === "FINAL");
      listEl.classList.toggle("bottom-up", cfg.bottomUpRwy && isRwyBay);

      bayEl.querySelector(".bay-cnt").textContent = String(items.length);

      const rwyStatusEl = bayEl.querySelector(".rwy-status");
      if ((b.stages || []).includes("SEQ")) {
        const bayFilter = resolveBayRunwayFilter(b, rwys);
        const occStrips = strips.filter((s) =>
          (s.doing === "lining up" || s.doing === "taking off" || s.doing === "landed") &&
          (!bayFilter || bayFilter === "__NONE__" || (s.runway || "").toUpperCase() === bayFilter));
        rwyStatusEl.classList.remove("hidden");
        rwyStatusEl.className = `rwy-status ${occStrips.length ? "occ" : "clr"}`;
        rwyStatusEl.textContent = occStrips.length ? `OCC · ${occStrips.map((x) => x.callsign).join(", ")}` : "CLEAR";
      } else {
        rwyStatusEl.classList.add("hidden");
      }

      const sig = JSON.stringify(items);
      if (baySigs[b.id] === sig) continue;
      baySigs[b.id] = sig;

      listEl.innerHTML = "";
      for (const s of items) {
        listEl.appendChild(makeStripEl(s, b.id, visibleBays, rwys));
      }
    }
  }

  // Layout Editor Modal
  function renderLayoutEditor() {
    $("leName").value = draftLayout.name || "";
    $("leCols").value = String(draftLayout.columns || 4);
    const cols = Math.max(1, Math.min(5, Number(draftLayout.columns || 4)));

    $("leBaysList").innerHTML = draftLayout.bays
      .map((b, idx) => `
        <div class="le-bay-row" data-idx="${idx}">
          <div class="le-bay-top">
            <input type="text" class="le-b-title" value="${esc(b.title)}" placeholder="Bay Title" />
            <select class="le-b-col">
              ${Array.from({ length: cols }, (_, c) => `<option value="${c}" ${Number(b.col) === c ? "selected" : ""}>Col ${c + 1}</option>`).join("")}
            </select>
            <select class="le-b-color">
              ${BAY_COLORS.map(([k, lbl]) => `<option value="${k}" ${b.color === k ? "selected" : ""}>${lbl}</option>`).join("")}
            </select>
            <input type="text" class="le-b-rwy" style="width:76px" value="${esc(b.runway || "")}" placeholder="RWY1 / 13" title="Optional runway filter" />
            <label style="flex-direction:row;align-items:center;gap:4px"><input type="checkbox" class="le-b-compact" ${b.compact ? "checked" : ""} /> Compact</label>
            <label style="flex-direction:row;align-items:center;gap:4px"><input type="checkbox" class="le-b-hidden" ${b.hidden ? "checked" : ""} /> Hide</label>
            <button class="btn le-b-del" type="button">✕</button>
          </div>
          <div class="le-stages">
            ${STAGES.map((st) => `<span class="stage-chip ${(b.stages || []).includes(st.id) ? "on" : ""}" data-stage="${st.id}">${st.id}</span>`).join("")}
          </div>
        </div>
      `)
      .join("");
  }

  function syncDraftFromDom() {
    draftLayout.name = $("leName").value.trim() || "Custom Layout";
    draftLayout.columns = Number($("leCols").value || 4);
    $("leBaysList").querySelectorAll(".le-bay-row").forEach((row) => {
      const idx = Number(row.dataset.idx);
      const b = draftLayout.bays[idx];
      if (!b) return;
      b.title = row.querySelector(".le-b-title").value;
      b.col = Number(row.querySelector(".le-b-col").value);
      b.color = row.querySelector(".le-b-color").value;
      b.runway = row.querySelector(".le-b-rwy").value.trim();
      b.compact = row.querySelector(".le-b-compact").checked;
      b.hidden = row.querySelector(".le-b-hidden").checked;
    });
  }

  // Poll Airside's official Mods API at 1 Hz
  async function pollTraffic() {
    if (demoMode) {
      apiOnline = false;
      render();
      return;
    }
    try {
      const [res, hRes] = await Promise.all([
        fetch("/api/traffic", { cache: "no-store" }),
        fetch("/api/health", { cache: "no-store" }).catch(() => null),
      ]);
      if (hRes && hRes.ok) {
        const h = await hRes.json();
        streamerMode = Boolean(h.streamerMode);
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.offline) throw new Error(data.error || "Offline");
      rawTraffic = data;
      apiOnline = true;
    } catch {
      apiOnline = false;
    }
    render();
  }

  // Event wiring
  $("presetSelect").addEventListener("change", () => {
    cfg.activeLayoutId = $("presetSelect").value;
    saveCfg();
    boardSig = "";
    render();
  });

  $("showPreChk").addEventListener("change", () => {
    cfg.showPre = $("showPreChk").checked;
    saveCfg();
    render();
  });

  $("efpsColorsChk").addEventListener("change", () => {
    cfg.efpsColors = $("efpsColorsChk").checked;
    saveCfg();
    render();
  });

  $("bottomUpRwyChk").addEventListener("change", () => {
    cfg.bottomUpRwy = $("bottomUpRwyChk").checked;
    saveCfg();
    render();
  });

  $("btnDemo").addEventListener("click", () => {
    demoMode = !demoMode;
    render();
  });

  $("btnOverlayMode").addEventListener("click", () => {
    overlayPreview = !overlayPreview;
    document.body.classList.toggle("overlay-active", overlayPreview);
    $("btnOverlayMode").classList.toggle("active", overlayPreview);
    if (!overlayPreview) boardSig = "";
    render();
  });

  $("btnExitOverlay").addEventListener("click", () => {
    overlayPreview = false;
    document.body.classList.remove("overlay-active");
    $("btnOverlayMode").classList.remove("active");
    boardSig = "";
    render();
  });

  $("btnCopyObs").addEventListener("click", async () => {
    const url = `${window.location.origin}/?overlay=1&max=6`;
    try { await navigator.clipboard.writeText(url); } catch { }
    $("radioTicker").textContent = `Copied OBS Browser Source URL: ${url}`;
  });

  // Edit Strip Modal
  $("editClose").addEventListener("click", () => $("editModal").classList.add("hidden"));
  $("edSave").addEventListener("click", () => {
    if (!editingCs) return;
    const ov = getOv(editingCs);
    ov.rmk = $("edRmk").value.trim();
    ov.runway = $("edRwy").value.trim() || undefined;
    ov.alt = $("edAlt").value.trim() || undefined;
    ov.sid = $("edSid").value.trim() || undefined;
    ov.squawk = $("edSqk").value.trim() || undefined;
    saveOverrides();
    $("editModal").classList.add("hidden");
    render();
  });
  $("edUnpin").addEventListener("click", () => {
    if (!editingCs) return;
    delete getOv(editingCs).pinBay;
    delete getOv(editingCs).order;
    saveOverrides();
    $("editModal").classList.add("hidden");
    render();
  });
  $("edHide").addEventListener("click", () => {
    if (!editingCs) return;
    getOv(editingCs).hidden = true;
    saveOverrides();
    $("editModal").classList.add("hidden");
    render();
  });

  // Layout Editor Modal
  $("btnLayoutEditor").addEventListener("click", () => {
    draftLayout = clone(activeLayout());
    renderLayoutEditor();
    $("layoutModal").classList.remove("hidden");
  });
  $("leClose").addEventListener("click", () => $("layoutModal").classList.add("hidden"));
  $("leCancel").addEventListener("click", () => $("layoutModal").classList.add("hidden"));
  $("leCols").addEventListener("change", () => { syncDraftFromDom(); renderLayoutEditor(); });
  $("leAddBay").addEventListener("click", () => {
    syncDraftFromDom();
    draftLayout.bays.push({ id: `bay_${Date.now()}`, title: "New Bay", color: "orange", col: 0, stages: [], runway: "", compact: false, hidden: false });
    renderLayoutEditor();
  });
  $("leBaysList").addEventListener("click", (e) => {
    const chip = e.target.closest(".stage-chip");
    if (chip) {
      syncDraftFromDom();
      const idx = Number(chip.closest(".le-bay-row").dataset.idx);
      const st = chip.dataset.stage;
      const arr = draftLayout.bays[idx].stages || [];
      const pos = arr.indexOf(st);
      if (pos >= 0) arr.splice(pos, 1); else arr.push(st);
      draftLayout.bays[idx].stages = arr;
      renderLayoutEditor();
      return;
    }
    const del = e.target.closest(".le-b-del");
    if (del) {
      syncDraftFromDom();
      const idx = Number(del.closest(".le-bay-row").dataset.idx);
      draftLayout.bays.splice(idx, 1);
      renderLayoutEditor();
    }
  });
  $("leSave").addEventListener("click", () => {
    syncDraftFromDom();
    const idx = cfg.layouts.findIndex((l) => l.id === draftLayout.id);
    if (idx >= 0) cfg.layouts[idx] = draftLayout;
    else cfg.layouts.push(draftLayout);
    cfg.activeLayoutId = draftLayout.id;
    saveCfg();
    $("layoutModal").classList.add("hidden");
    boardSig = "";
    render();
  });
  $("leClonePreset").addEventListener("click", () => {
    syncDraftFromDom();
    const copy = clone(draftLayout);
    copy.id = `custom_${Date.now()}`;
    copy.name = `${copy.name} (Copy)`;
    cfg.layouts.push(copy);
    cfg.activeLayoutId = copy.id;
    saveCfg();
    $("layoutModal").classList.add("hidden");
    boardSig = "";
    render();
  });
  $("leDeletePreset").addEventListener("click", () => {
    if (cfg.layouts.length <= 1) return;
    cfg.layouts = cfg.layouts.filter((l) => l.id !== draftLayout.id);
    cfg.activeLayoutId = cfg.layouts[0].id;
    saveCfg();
    $("layoutModal").classList.add("hidden");
    boardSig = "";
    render();
  });
  $("leResetDefaults").addEventListener("click", () => {
    cfg.layouts = clone(DEFAULT_LAYOUTS);
    cfg.activeLayoutId = DEFAULT_LAYOUTS[0].id;
    saveCfg();
    draftLayout = clone(activeLayout());
    renderLayoutEditor();
    boardSig = "";
    render();
  });

  pollTraffic();
  setInterval(pollTraffic, 1000);
})();
