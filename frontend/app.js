/* ============================================================
   DELTA CLOUD SCANNER V3
   FINAL PROFESSIONAL FRONTEND
   ------------------------------------------------------------
   IMPORTANT:
   This file DOES NOT change scanner calculations.
   It only handles:
   - Settings
   - Rendering
   - Search
   - BUY / SELL / NEUTRAL filters
   - WebSocket updates
   - UI formatting
   ============================================================ */


/* ============================================================
   BASIC HELPERS
   ============================================================ */

const $ = id => document.getElementById(id);


/* ============================================================
   GLOBAL FILTER STATE
   ============================================================ */

let activeFilter = "ALL";
let searchText = "";
let latestData = null;
let socket = null;
let reconnectTimer = null;
let telegramEnabled = false;
let telegramConfigured = false;
let telegramBusy = false;


/* ============================================================
   TIMEFRAMES
   ============================================================ */

const TF = [
  "1m",
  "3m",
  "5m",
  "15m",
  "30m",
  "1h",
  "2h",
  "4h",
  "6h",
  "12h",
  "1d",
  "1w",
  "1M"
];


/* ============================================================
   SETTINGS DEFINITIONS
   ============================================================ */

const defs = [

  ["wave_tf", "Wave TF", "select"],
  ["tide_tf", "Tide TF", "select"],

  ["we1", "Wave EMA 1", "number"],
  ["we2", "Wave EMA 2", "number"],
  ["we3", "Wave EMA 3", "number"],

  ["te1", "Tide EMA 1", "number"],
  ["te2", "Tide EMA 2", "number"],
  ["te3", "Tide EMA 3", "number"],

  ["fe1", "Tide Filter EMA 1", "number"],
  ["fe2", "Tide Filter EMA 2", "number"],

  ["rp", "RSI Period", "number"],
  ["rb", "RSI BUY", "number"],
  ["rs", "RSI SELL", "number"],

  ["mf", "MACD Fast", "number"],
  ["ms", "MACD Slow", "number"],
  ["mg", "MACD Signal", "number"],

  ["sp", "Stoch Period", "number"],
  ["sk", "Stoch K Smooth", "number"],
  ["sd", "Stoch D Smooth", "number"],

  ["vs", "Volume SMA", "number"],

  ["bs", "BUY Score", "number"],
  ["ss", "SELL Score", "number"],

  ["srl", "S/R Lookback", "number"],
  ["srp", "S/R Pivot", "number"],

  ["rr", "Minimum R:R", "number"],
  ["slb", "SL Buffer %", "number"],

  ["mvr", "Min Volume Ratio", "number"],
  ["mc", "Min Confirmations", "number"]

];


/* ============================================================
   BUILD SETTINGS FORM
   ============================================================ */

for (const d of defs) {

  const label = document.createElement("label");
  label.textContent = d[1];

  const input = document.createElement(
    d[2] === "select" ? "select" : "input"
  );

  input.id = d[0];

  if (d[2] === "number") {
    input.type = "number";
  }

  if (d[0] === "rr") {
    input.step = ".1";
  }

  if (d[0] === "slb") {
    input.step = ".05";
  }

  if (d[0] === "mvr") {
    input.step = ".1";
  }

  if (d[2] === "select") {

    TF.forEach(t => {

      const option =
        document.createElement("option");

      option.value = t;
      option.textContent = t;

      input.appendChild(option);

    });

  }

  label.appendChild(input);

  $("settings").appendChild(label);
}


/* ============================================================
   PROFESSIONAL UI
   ============================================================ */

function applyProfessionalUI() {
    if (!document.getElementById("telegramControlStyle")) { const st=document.createElement("style"); st.id="telegramControlStyle"; st.textContent=`.telegram-control{margin:14px 0 18px;padding:16px 18px;border:1px solid #dfe5ee;border-radius:14px;background:#fff;box-shadow:0 4px 14px rgba(20,40,80,.06)}.telegram-control-title{font-size:16px;font-weight:700;margin-bottom:10px}.telegram-control-row{display:flex;align-items:center;justify-content:space-between;gap:16px}.telegram-status{font-size:13px;line-height:1.5;padding:8px 10px;border-radius:9px}.telegram-status.on{background:#ecfdf3;color:#087443}.telegram-status.off{background:#f3f4f6;color:#596273}.telegram-status.error{background:#fff1f2;color:#b42318}.telegram-toggle{min-width:115px;border:0;border-radius:10px;padding:10px 15px;font-weight:700;cursor:pointer}.telegram-toggle.on{background:#dcfce7;color:#166534}.telegram-toggle.off{background:#e5e7eb;color:#374151}.telegram-toggle.error{background:#fee2e2;color:#991b1b}.telegram-toggle:disabled{opacity:.6;cursor:wait}@media(max-width:700px){.telegram-control-row{align-items:stretch;flex-direction:column}.telegram-toggle{width:100%}}`;document.head.appendChild(st); }


  if (document.getElementById(
    "professional-scanner-ui"
  )) {
    return;
  }

  const style =
    document.createElement("style");

  style.id =
    "professional-scanner-ui";

  style.textContent = `

    * {
      box-sizing: border-box;
    }

    /* --------------------------------------------------------
       SETTINGS
       -------------------------------------------------------- */

    #settings {

      display:grid;

      grid-template-columns:
        repeat(auto-fit,minmax(145px,1fr));

      gap:10px;

      margin-top:12px;
      margin-bottom:18px;
    }

    #settings label {

      display:flex;

      flex-direction:column;

      gap:6px;

      padding:9px 10px;

      background:
        rgba(255,255,255,.025);

      border:
        1px solid rgba(255,255,255,.055);

      border-radius:10px;

      color:#9caabd;

      font-size:11px;

      font-weight:600;

      transition:.2s ease;
    }

    #settings label:hover {

      border-color:
        rgba(0,220,160,.25);

      background:
        rgba(0,220,160,.035);
    }

    #settings input,
    #settings select {

      width:100%;

      background:#0c131d;

      color:#edf4fb;

      border:
        1px solid rgba(255,255,255,.09);

      border-radius:7px;

      padding:7px 8px;

      outline:none;

      font-size:12px;

      font-weight:600;
    }

    #settings input:focus,
    #settings select:focus {

      border-color:
        rgba(0,220,160,.65);

      box-shadow:
        0 0 0 2px
        rgba(0,220,160,.08);
    }


    /* --------------------------------------------------------
       STATUS
       -------------------------------------------------------- */

    .dot.ok {

      background:#00e6a0 !important;

      box-shadow:
        0 0 10px
        rgba(0,230,160,.8) !important;
    }


    /* --------------------------------------------------------
       TABLE
       -------------------------------------------------------- */

    table {

      font-variant-numeric:
        tabular-nums;
    }

    tbody tr {

      transition:
        background .15s ease;
    }

    tbody tr:hover {

      background:
        rgba(0,230,160,.035);
    }


    /* --------------------------------------------------------
       COIN
       -------------------------------------------------------- */

    .coin-name {

      color:#fff;

      font-weight:900;

      letter-spacing:.2px;
    }


    /* --------------------------------------------------------
       24H CHANGE
       -------------------------------------------------------- */

    .positive {

      color:#00e6a0 !important;

      font-weight:900;
    }

    .negative {

      color:#ff5577 !important;

      font-weight:900;
    }

    .neutral-value {

      color:#9aa8b8 !important;
    }


    /* --------------------------------------------------------
       SIGNAL
       -------------------------------------------------------- */

    .signal-badge {

      display:inline-flex;

      align-items:center;

      justify-content:center;

      min-width:72px;

      padding:5px 9px;

      border-radius:999px;

      font-size:9px;

      font-weight:900;

      letter-spacing:.4px;
    }

    .signal-buy {

      color:#00f0a8;

      background:
        rgba(0,230,160,.11);

      border:
        1px solid
        rgba(0,230,160,.30);
    }

    .signal-sell {

      color:#ff587b;

      background:
        rgba(255,70,105,.11);

      border:
        1px solid
        rgba(255,70,105,.30);
    }

    .signal-neutral {

      color:#a8b4c3;

      background:
        rgba(148,163,184,.08);

      border:
        1px solid
        rgba(148,163,184,.18);
    }


    /* --------------------------------------------------------
       SCORE
       -------------------------------------------------------- */

    .score {

      display:inline-flex;

      align-items:center;

      justify-content:center;

      min-width:42px;

      padding:4px 7px;

      border-radius:6px;

      font-weight:900;
    }

    .score-high {

      color:#00edaa;

      background:
        rgba(0,230,160,.08);
    }

    .score-low {

      color:#ff5b7e;

      background:
        rgba(255,70,105,.08);
    }

    .score-mid {

      color:#f4ca60;

      background:
        rgba(244,202,96,.08);
    }


    /* --------------------------------------------------------
       CONFIRMATION
       -------------------------------------------------------- */

    .confirmation {

      display:inline-flex;

      align-items:center;

      justify-content:center;

      min-width:32px;

      padding:4px 7px;

      border-radius:6px;

      font-size:9px;

      font-weight:900;
    }

    .confirmation-strong {

      color:#00e6a0;

      background:
        rgba(0,230,160,.08);
    }

    .confirmation-medium {

      color:#f4ca60;

      background:
        rgba(244,202,96,.08);
    }

    .confirmation-low {

      color:#ff627f;

      background:
        rgba(255,98,127,.08);
    }


    /* --------------------------------------------------------
       INDICATORS
       -------------------------------------------------------- */

    .indicator-buy {

      color:#00e6a0;

      font-weight:800;
    }

    .indicator-sell {

      color:#ff5577;

      font-weight:800;
    }

    .indicator-neutral {

      color:#9aa8b8;
    }


    /* --------------------------------------------------------
       HEIKIN ASHI
       -------------------------------------------------------- */

    .ha-bull {

      color:#00e6a0;

      font-weight:900;
    }

    .ha-bear {

      color:#ff5577;

      font-weight:900;
    }


    /* --------------------------------------------------------
       S/R
       -------------------------------------------------------- */

    .support {

      color:#73d9bc;

      font-weight:700;
    }

    .resistance {

      color:#ff9aaa;

      font-weight:700;
    }


    /* --------------------------------------------------------
       TRADE PLAN
       -------------------------------------------------------- */

    .entry {

      color:#70b7ff;

      font-weight:900;
    }

    .sl {

      color:#ff587b;

      font-weight:900;
    }

    .tp {

      color:#00e6a0;

      font-weight:900;
    }

    .rr-value {

      color:#f4ca60;

      font-weight:900;
    }


    /* --------------------------------------------------------
       FILTER COUNT
       -------------------------------------------------------- */

    #filterCount {

      display:inline-flex;

      align-items:center;

      margin-left:7px;

      padding:3px 8px;

      border-radius:999px;

      background:
        rgba(255,255,255,.05);

      border:
        1px solid
        rgba(255,255,255,.08);

      color:#8fa3b3;

      font-size:9px;

      font-weight:800;
    }


    /* --------------------------------------------------------
       ACTIVE FILTERS
       -------------------------------------------------------- */

    .filter-btn.active {

      box-shadow:
        0 0 12px
        rgba(70,150,190,.10);
    }


    /* --------------------------------------------------------
       EMPTY RESULT
       -------------------------------------------------------- */

    .filter-empty {

      padding:35px !important;

      text-align:center !important;

      color:#71899a !important;

      font-weight:600;
    }


    /* --------------------------------------------------------
       MOBILE
       -------------------------------------------------------- */

    @media(max-width:900px) {

      #settings {

        grid-template-columns:
          repeat(3,minmax(130px,1fr));
      }

    }

    @media(max-width:600px) {

      #settings {

        grid-template-columns:
          repeat(2,minmax(120px,1fr));
      }

    }

  `;

  document.head.appendChild(style);
}

applyProfessionalUI();


/* ============================================================
   SETTINGS FILL
   ============================================================ */

function fill(s) {

  if (!s) {
    return;
  }

  if ($("wave_tf")) {
    $("wave_tf").value = s.wave_tf;
  }

  if ($("tide_tf")) {
    $("tide_tf").value = s.tide_tf;
  }

  ["we1","we2","we3"].forEach(
    (x,i) => {
      if ($(x) && s.wave_ema) {
        $(x).value = s.wave_ema[i];
      }
    }
  );

  ["te1","te2","te3"].forEach(
    (x,i) => {
      if ($(x) && s.tide_ema) {
        $(x).value = s.tide_ema[i];
      }
    }
  );

  ["fe1","fe2"].forEach(
    (x,i) => {
      if ($(x) && s.tide_filter_ema) {
        $(x).value =
          s.tide_filter_ema[i];
      }
    }
  );

  if ($("rp")) $("rp").value = s.rsi_period;
  if ($("rb")) $("rb").value = s.rsi_buy;
  if ($("rs")) $("rs").value = s.rsi_sell;

  if ($("mf")) $("mf").value = s.macd_fast;
  if ($("ms")) $("ms").value = s.macd_slow;
  if ($("mg")) $("mg").value = s.macd_signal;

  if ($("sp")) $("sp").value = s.stoch_period;
  if ($("sk")) $("sk").value = s.stoch_k;
  if ($("sd")) $("sd").value = s.stoch_d;

  if ($("vs")) $("vs").value = s.volume_sma;

  if ($("bs")) $("bs").value = s.buy_score;
  if ($("ss")) $("ss").value = s.sell_score;

  if ($("srl")) $("srl").value = s.sr_lookback;
  if ($("srp")) $("srp").value = s.sr_pivot;

  if ($("rr")) $("rr").value = s.min_rr;
  if ($("slb")) $("slb").value = s.sl_buffer_pct;

  if ($("mvr")) $("mvr").value = s.min_volume_ratio;
  if ($("mc")) $("mc").value =
    s.min_signal_confirmations;
}


/* ============================================================
   NUMBER HELPER
   ============================================================ */

const n = id =>
  Number($(id).value);


/* ============================================================
   SAVE SETTINGS
   ============================================================ */

async function save() {

  const button =
    $("saveButton");

  if (button) {
    button.disabled = true;
    button.textContent =
      "⏳ Saving...";
  }

  const s = {

    wave_tf:
      $("wave_tf").value,

    tide_tf:
      $("tide_tf").value,

    wave_ema: [
      n("we1"),
      n("we2"),
      n("we3")
    ],

    tide_ema: [
      n("te1"),
      n("te2"),
      n("te3")
    ],

    tide_filter_ema: [
      n("fe1"),
      n("fe2")
    ],

    rsi_period:
      n("rp"),

    rsi_buy:
      n("rb"),

    rsi_sell:
      n("rs"),

    macd_fast:
      n("mf"),

    macd_slow:
      n("ms"),

    macd_signal:
      n("mg"),

    stoch_period:
      n("sp"),

    stoch_k:
      n("sk"),

    stoch_d:
      n("sd"),

    volume_sma:
      n("vs"),

    buy_score:
      n("bs"),

    sell_score:
      n("ss"),

    sr_lookback:
      n("srl"),

    sr_pivot:
      n("srp"),

    min_rr:
      n("rr"),

    sl_buffer_pct:
      n("slb"),

    min_volume_ratio:
      n("mvr"),

    min_signal_confirmations:
      n("mc")
  };

  try {

    const r =
      await fetch(
        "/api/settings",
        {
          method:"PUT",

          headers:{
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify(s)
        }
      );

    if (!r.ok) {

      throw new Error(
        `HTTP ${r.status}`
      );
    }

    const j =
      await r.json();

    if (j.settings) {
      fill(j.settings);
    }

    if ($("msg")) {

      $("msg").textContent =
        "✓ Saved. New scan started.";

      setTimeout(() => {

        $("msg").textContent = "";

      },3000);
    }

  } catch(e) {

    console.error(
      "Settings save error:",
      e
    );

    if ($("msg")) {

      $("msg").textContent =
        "Save failed: " + e.message;
    }

  } finally {

    if (button) {

      button.disabled = false;

      button.textContent =
        "💾 Save & Rescan";
    }
  }
}


/* ============================================================
   GENERAL FORMATTER
   ============================================================ */

function f(x,d=6) {

  if (
    x === null ||
    x === undefined ||
    x === "" ||
    Number.isNaN(Number(x))
  ) {
    return "—";
  }

  return Number(x).toLocaleString(
    undefined,
    {
      maximumFractionDigits:d
    }
  );
}


/* ============================================================
   24H CHANGE
   ============================================================ */

function formatChange(x) {

  if (
    x === null ||
    x === undefined ||
    x === "" ||
    Number.isNaN(Number(x))
  ) {
    return "—";
  }

  const value =
    Number(x);

  if (value > 0) {

    return `
      <span class="positive">
        ▲ ${f(value,2)}%
      </span>
    `;
  }

  if (value < 0) {

    return `
      <span class="negative">
        ▼ ${f(Math.abs(value),2)}%
      </span>
    `;
  }

  return `
    <span class="neutral-value">
      ${f(value,2)}%
    </span>
  `;
}


/* ============================================================
   SIGNAL CLASS
   ============================================================ */

function sigClass(signal) {

  if (signal === "BUY") {
    return "signal-buy";
  }

  if (signal === "SELL") {
    return "signal-sell";
  }

  return "signal-neutral";
}


/* ============================================================
   SIGNAL BADGE
   ============================================================ */

function signalBadge(signal) {

  const s =
    signal || "NEUTRAL";

  let icon = "•";

  if (s === "BUY") {
    icon = "▲";
  }

  if (s === "SELL") {
    icon = "▼";
  }

  return `
    <span class="signal-badge ${sigClass(s)}">
      ${icon}&nbsp;${s}
    </span>
  `;
}


/* ============================================================
   SCORE BADGE
   ============================================================ */

function scoreBadge(score) {

  if (
    score === null ||
    score === undefined ||
    Number.isNaN(Number(score))
  ) {
    return "—";
  }

  const value =
    Number(score);

  let cls =
    "score-mid";

  if (value >= 70) {
    cls = "score-high";
  }

  if (value <= 30) {
    cls = "score-low";
  }

  return `
    <span class="score ${cls}">
      ${f(value,0)}
    </span>
  `;
}


/* ============================================================
   CONFIRMATION BADGE
   ============================================================ */

function confirmationBadge(conf) {

  if (
    conf === null ||
    conf === undefined ||
    Number.isNaN(Number(conf))
  ) {
    return "—";
  }

  const value =
    Number(conf);

  let cls =
    "confirmation-low";

  if (value >= 7) {

    cls =
      "confirmation-strong";

  } else if (value >= 5) {

    cls =
      "confirmation-medium";
  }

  return `
    <span class="confirmation ${cls}">
      ${value}/8
    </span>
  `;
}


/* ============================================================
   RSI
   ============================================================ */

function rsiDisplay(value) {

  if (
    value === null ||
    value === undefined ||
    Number.isNaN(Number(value))
  ) {
    return "—";
  }

  const v =
    Number(value);

  if (v >= 50) {

    return `
      <span class="indicator-buy">
        ${f(v,2)}
      </span>
    `;
  }

  return `
    <span class="indicator-sell">
      ${f(v,2)}
    </span>
  `;
}


/* ============================================================
   MACD
   ------------------------------------------------------------
   IMPORTANT:
   Backend structure:
   x.wave.macd
   x.wave.macd_signal
   ============================================================ */

function macdDisplay(w) {

  const macd =
    w?.macd;

  const signal =
    w?.macd_signal;

  if (
    macd === null ||
    macd === undefined ||
    signal === null ||
    signal === undefined
  ) {
    return "—";
  }

  const cls =
    Number(macd) >= Number(signal)
      ? "indicator-buy"
      : "indicator-sell";

  return `
    <span class="${cls}">
      ${f(macd,6)}
    </span>
  `;
}


/* ============================================================
   STOCHASTIC
   ------------------------------------------------------------
   Backend structure:
   x.wave.stoch_k
   x.wave.stoch_d
   ============================================================ */

function stochDisplay(w) {

  const k =
    w?.stoch_k;

  const d =
    w?.stoch_d;

  if (
    k === null ||
    k === undefined ||
    d === null ||
    d === undefined
  ) {
    return "—";
  }

  const cls =
    Number(k) >= Number(d)
      ? "indicator-buy"
      : "indicator-sell";

  return `
    <span class="${cls}">
      ${f(k,1)} / ${f(d,1)}
    </span>
  `;
}


/* ============================================================
   HEIKIN ASHI
   ============================================================ */

function haDisplay(ha) {

  if (!ha) {
    return "—";
  }

  if (ha.bull) {

    return `
      <span class="ha-bull">
        🟢 Bull
      </span>
    `;
  }

  if (ha.bear) {

    return `
      <span class="ha-bear">
        🔴 Bear
      </span>
    `;
  }

  return "—";
}


/* ============================================================
   SAFE S/R
   ------------------------------------------------------------
   UI ONLY.
   Does NOT change scanner calculations.
   ============================================================ */

function safeSR(value) {

  if (
    value === null ||
    value === undefined ||
    value === "" ||
    Number.isNaN(Number(value)) ||
    Number(value) <= 0
  ) {
    return "—";
  }

  return f(value,8);
}


/* ============================================================
   TRADE PLAN VALUE
   ============================================================ */

function planValue(value, cls) {

  if (
    value === null ||
    value === undefined ||
    value === "" ||
    Number.isNaN(Number(value))
  ) {
    return "—";
  }

  return `
    <span class="${cls}">
      ${f(value,8)}
    </span>
  `;
}


/* ============================================================
   R:R
   ============================================================ */

function rrDisplay(value) {

  if (
    value === null ||
    value === undefined ||
    value === "" ||
    Number.isNaN(Number(value))
  ) {
    return "—";
  }

  return `
    <span class="rr-value">
      1:${f(value,2)}
    </span>
  `;
}


/* ============================================================
   FILTER BUTTON STATE
   ============================================================ */

function updateFilterButtons() {

  const buttons = {

    ALL:
      $("filterAll"),

    BUY:
      $("filterBuy"),

    SELL:
      $("filterSell"),

    NEUTRAL:
      $("filterNeutral")
  };

  Object.entries(buttons).forEach(
    ([key,button]) => {

      if (!button) {
        return;
      }

      button.classList.toggle(
        "active",
        activeFilter === key
      );

    }
  );
}


/* ============================================================
   SET FILTER
   ------------------------------------------------------------
   THIS WAS THE MISSING FUNCTION.
   ============================================================ */

function setFilter(filter) {

  const allowed = [
    "ALL",
    "BUY",
    "SELL",
    "NEUTRAL"
  ];

  if (!allowed.includes(filter)) {
    filter = "ALL";
  }

  activeFilter =
    filter;

  updateFilterButtons();

  renderLatest();
}


/* ============================================================
   SEARCH LISTENER
   ============================================================ */

function setupSearch() {

  const input =
    $("searchInput");

  if (!input) {
    return;
  }

  input.addEventListener(
    "input",
    () => {

      searchText =
        input.value
          .trim()
          .toUpperCase();

      renderLatest();

    }
  );
}


/* ============================================================
   FILTER MARKET DATA
   ------------------------------------------------------------ */

function filterMarkets(markets) {

  return markets.filter(
    market => {

      const symbol =
        String(
          market.symbol || ""
        ).toUpperCase();

      const signal =
        String(
          market.indicators?.signal ||
          "NEUTRAL"
        ).toUpperCase();

      /* ------------------------------------------------------
         SEARCH
         ------------------------------------------------------ */

      const matchesSearch =
        !searchText ||
        symbol.includes(searchText);

      if (!matchesSearch) {
        return false;
      }

      /* ------------------------------------------------------
         SIGNAL FILTER
         ------------------------------------------------------ */

      if (
        activeFilter !== "ALL" &&
        signal !== activeFilter
      ) {
        return false;
      }

      return true;

    }
  );
}


/* ============================================================
   FILTER COUNT
   ------------------------------------------------------------ */

function updateFilterCount(
  total,
  visible
) {

  let count =
    document.getElementById(
      "filterCount"
    );

  if (!count) {

    const title =
      document.querySelector(
        ".scanner-toolbar"
      );

    if (title) {

      count =
        document.createElement(
          "span"
        );

      count.id =
        "filterCount";

      title.appendChild(count);
    }
  }

  if (count) {

    count.textContent =
      `${visible} / ${total}`;
  }
}


/* ============================================================
   RENDER LATEST DATA
   ============================================================ */

function renderLatest() {

  if (!latestData) {
    return;
  }

  render(
    latestData
  );
}


/* ============================================================
   MAIN RENDER
   ============================================================ */

function ensureTelegramControl() {
    if (document.getElementById("telegramControl")) return;
    const settings = document.getElementById("settings");
    if (!settings) return;
    const box = document.createElement("div");
    box.id = "telegramControl"; box.className = "telegram-control";
    box.innerHTML = `<div class="telegram-control-title">📲 Telegram Alerts</div><div class="telegram-control-row"><div id="telegramStatus" class="telegram-status off">Alerts are OFF. Scanner continues normally without Telegram alerts.</div><button id="telegramToggle" class="telegram-toggle off" type="button">⚪ OFF</button></div>`;
    settings.parentNode.insertBefore(box, settings.nextSibling);
    document.getElementById("telegramToggle").addEventListener("click", toggleTelegram);
    updateTelegramUI(telegramEnabled, telegramConfigured);
}
function updateTelegramUI(enabled, configured = telegramConfigured, error = "") {
    telegramEnabled = !!enabled; telegramConfigured = !!configured;
    const button=document.getElementById("telegramToggle"), status=document.getElementById("telegramStatus"); if(!button||!status)return;
    button.classList.remove("on","off","error"); status.classList.remove("on","off","error");
    if(!telegramConfigured){button.classList.add("error");status.classList.add("error");button.textContent="⚠ NOT CONFIGURED";status.textContent=error||"Telegram is not configured. Add TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in Render.";return;}
    if(telegramEnabled){button.classList.add("on");status.classList.add("on");button.textContent="🟢 ON";status.textContent="Alerts are ENABLED. BUY/SELL signals may be sent to Telegram.";}else{button.classList.add("off");status.classList.add("off");button.textContent="⚪ OFF";status.textContent="Alerts are OFF. Scanner continues normally without Telegram alerts.";}
    button.disabled=telegramBusy;
}
async function loadTelegramStatus(){try{const r=await fetch("/api/telegram");const d=await r.json();updateTelegramUI(d.enabled,d.configured,d.error||"");}catch(e){updateTelegramUI(false,false,"Could not read Telegram status. Check the backend connection.");}}
async function toggleTelegram(){if(telegramBusy||!telegramConfigured)return; telegramBusy=true; updateTelegramUI(telegramEnabled,telegramConfigured); try{const next=!telegramEnabled;const r=await fetch("/api/telegram/toggle",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({enabled:next})});const d=await r.json();if(!r.ok||!d.ok)throw new Error(d.error||"Telegram toggle failed");updateTelegramUI(d.enabled,d.configured,d.error||"");}catch(e){updateTelegramUI(telegramEnabled,telegramConfigured,e.message);}finally{telegramBusy=false;updateTelegramUI(telegramEnabled,telegramConfigured);}}

function render(j) {
    ensureTelegramControl();
    if (j && j.status && typeof j.status.telegram_enabled === "boolean") updateTelegramUI(j.status.telegram_enabled, telegramConfigured);

  if (!j) {
    return;
  }

  latestData =
    j;

  /* ----------------------------------------------------------
     STATUS
     ---------------------------------------------------------- */

  if (j.status) {

    if ($("coins")) {

      $("coins").textContent =
        j.status.coins ?? "—";
    }

    if ($("scan")) {

      $("scan").textContent =
        j.status.last_scan
          ? new Date(
              j.status.last_scan * 1000
            ).toLocaleTimeString()
          : "—";
    }

    if ($("dot")) {

      $("dot").className =
        "dot " +
        (
          j.status.ws_connected
            ? "ok"
            : ""
        );
    }

    if ($("st")) {

      $("st").textContent =
        j.status.ws_connected
          ? "Delta WS connected"
          : "Reconnecting";
    }
  }


  /* ----------------------------------------------------------
     SETTINGS / TIMEFRAMES
     ---------------------------------------------------------- */

  if (j.settings) {

    if ($("wave")) {

      $("wave").textContent =
        j.settings.wave_tf;
    }

    if ($("tide")) {

      $("tide").textContent =
        j.settings.tide_tf;
    }
  }


  /* ----------------------------------------------------------
     MARKET DATA
     ---------------------------------------------------------- */

  const markets =
    Array.isArray(j.markets)
      ? j.markets
      : [];


  /* ----------------------------------------------------------
     FILTER MARKETS
     ---------------------------------------------------------- */

  const filtered =
    filterMarkets(markets);


  /* ----------------------------------------------------------
     COUNT
     ---------------------------------------------------------- */

  updateFilterCount(
    markets.length,
    filtered.length
  );


  /* ----------------------------------------------------------
     EMPTY
     ---------------------------------------------------------- */

  if (!filtered.length) {

    $("rows").innerHTML = `

      <tr>

        <td
          colspan="28"
          class="filter-empty"
        >

          ${
            markets.length
              ? "🔎 No coins match the current search/filter."
              : "Waiting for scanner data..."
          }

        </td>

      </tr>

    `;

    return;
  }


  /* ----------------------------------------------------------
     SORT
     ----------------------------------------------------------
     SAME SORTING AS ORIGINAL:
     SCORE DESCENDING
     ---------------------------------------------------------- */

  const a =
    [...filtered].sort(
      (x,y) =>
        (y.indicators?.score ?? -1) -
        (x.indicators?.score ?? -1)
    );


  /* ----------------------------------------------------------
     BUILD TABLE
     ---------------------------------------------------------- */

  $("rows").innerHTML =
    a.map(
      (m,i) => {

        const x =
          m.indicators || {};

        const w =
          x.wave || {};

        const ha =
          x.ha || {};

        const sr =
          x.sr || {};

        const p =
          x.plan || {};

        const s =
          x.signal || "NEUTRAL";


        /* ----------------------------------------------------
           CONFIRMATIONS
           ---------------------------------------------------- */

        const conf =
          s === "BUY"

            ? (x.buy_confirmations ?? 0)

            : s === "SELL"

              ? (x.sell_confirmations ?? 0)

              : Math.max(
                  x.buy_confirmations || 0,
                  x.sell_confirmations || 0
                );


        /* ----------------------------------------------------
           SIGNAL-SPECIFIC PLAN
           ---------------------------------------------------- */

        const entry =
          s !== "NEUTRAL"
            ? planValue(
                p.entry,
                "entry"
              )
            : "—";

        const sl =
          s !== "NEUTRAL"
            ? planValue(
                p.sl,
                "sl"
              )
            : "—";

        const tp1 =
          s !== "NEUTRAL"
            ? planValue(
                p.tp1,
                "tp"
              )
            : "—";

        const tp2 =
          s !== "NEUTRAL"
            ? planValue(
                p.tp2,
                "tp"
              )
            : "—";

        const rr =
          s !== "NEUTRAL"
            ? rrDisplay(
                p.rr
              )
            : "—";


        /* ----------------------------------------------------
           RETURN ROW
           ---------------------------------------------------- */

        return `

          <tr>

            <td>
              <strong>${i + 1}</strong>
            </td>


            <td>
              <span class="coin-name">
                ${m.symbol ?? "—"}
              </span>
            </td>


            <td>
              <strong>
                ${f(m.price,10)}
              </strong>
            </td>


            <td>
              ${formatChange(m.change)}
            </td>


            <td>
              ${f(m.volume,0)}
            </td>


            <td>
              ${m.volume_rank ?? "—"}
            </td>


            <td>
              ${f(m.oi,0)}
            </td>


            <td>
              ${j.settings?.wave_tf ?? "—"}
            </td>


            <td>
              ${j.settings?.tide_tf ?? "—"}
            </td>


            <td>
              ${f(x.tide9,8)}
            </td>


            <td>
              ${f(x.tide20,8)}
            </td>


            <td>
              ${rsiDisplay(w.rsi)}
            </td>


            <td>
              ${macdDisplay(w)}
            </td>


            <td>
              ${stochDisplay(w)}
            </td>


            <td>
              ${scoreBadge(x.score)}
            </td>


            <td>
              ${x.score_rank ?? "—"}
            </td>


            <td>
              ${signalBadge(s)}
            </td>


            <td>
              ${confirmationBadge(conf)}
            </td>


            <td>
              ${haDisplay(ha)}
            </td>


            <td>
              <span class="support">
                ${safeSR(sr.s2)}
              </span>
            </td>


            <td>
              <span class="support">
                ${safeSR(sr.s1)}
              </span>
            </td>


            <td>
              <span class="resistance">
                ${safeSR(sr.r1)}
              </span>
            </td>


            <td>
              <span class="resistance">
                ${safeSR(sr.r2)}
              </span>
            </td>


            <td>
              ${entry}
            </td>


            <td>
              ${sl}
            </td>


            <td>
              ${tp1}
            </td>


            <td>
              ${tp2}
            </td>


            <td>
              ${rr}
            </td>

          </tr>

        `;

      }
    ).join("");
}


/* ============================================================
   INITIAL API LOAD
   ============================================================ */

async function loadInitial() {
    ensureTelegramControl();
    await loadTelegramStatus();

  try {

    const response =
      await fetch(
        "/api/status"
      );

    if (!response.ok) {

      throw new Error(
        `HTTP ${response.status}`
      );
    }

    const data =
      await response.json();

    latestData =
      data;

    if (data.settings) {

      fill(
        data.settings
      );
    }

    render(
      data
    );

  } catch(e) {

    console.error(
      "Initial API load failed:",
      e
    );

    if ($("st")) {

      $("st").textContent =
        "API connection failed";
    }
  }
}


/* ============================================================
   WEBSOCKET
   ============================================================ */

function connect() {

  try {

    const protocol =
      location.protocol === "https:"
        ? "wss"
        : "ws";

    const url =
      protocol +
      "://" +
      location.host +
      "/ws";

    socket =
      new WebSocket(
        url
      );


    /* --------------------------------------------------------
       CONNECTED
       -------------------------------------------------------- */

    socket.onopen = () => {

      console.log(
        "Delta Cloud Scanner WebSocket connected"
      );

      if ($("st")) {

        $("st").textContent =
          "Delta WS connected";
      }

      if ($("dot")) {

        $("dot").className =
          "dot ok";
      }
    };


    /* --------------------------------------------------------
       MESSAGE
       -------------------------------------------------------- */

    socket.onmessage =
      event => {

        try {

          const data =
            JSON.parse(
              event.data
            );

          /*
           * V4 bandwidth protocol:
           * The server sends one full snapshot initially, then compact
           * market patches. Merge patches into the existing client state.
           */
          if (data && data.type === "delta") {

            if (!latestData) {
              // A rare race: recover with the normal REST snapshot.
              return;
            }

            if (data.status) {
              latestData.status = {
                ...(latestData.status || {}),
                ...data.status
              };
            }

            if (data.settings) {
              latestData.settings = data.settings;
              fill(data.settings);
            }

            if (!Array.isArray(latestData.markets)) {
              latestData.markets = [];
            }

            const bySymbol = new Map(
              latestData.markets.map(m => [
                String(m.symbol),
                m
              ])
            );

            if (Array.isArray(data.markets)) {
              data.markets.forEach(patch => {
                const symbol = String(patch.symbol || "");
                if (!symbol) return;

                const existing = bySymbol.get(symbol);

                if (!existing) {
                  latestData.markets.push(patch);
                  bySymbol.set(symbol, patch);
                  return;
                }

                Object.keys(patch).forEach(key => {
                  if (key === "indicators" &&
                      patch.indicators &&
                      typeof patch.indicators === "object") {
                    existing.indicators = patch.indicators;
                  } else {
                    existing[key] = patch[key];
                  }
                });
              });
            }

            if (Array.isArray(data.removed) && data.removed.length) {
              const removeSet = new Set(
                data.removed.map(String)
              );

              latestData.markets =
                latestData.markets.filter(
                  m => !removeSet.has(String(m.symbol))
                );
            }

            render(latestData);

          } else {
            // V3/full snapshot compatibility.
            render(data);
          }

        } catch(e) {

          console.error(
            "WebSocket JSON error:",
            e
          );
        }
      };


    /* --------------------------------------------------------
       ERROR
       -------------------------------------------------------- */

    socket.onerror =
      error => {

        console.error(
          "WebSocket error:",
          error
        );

        if (socket) {
          socket.close();
        }
      };


    /* --------------------------------------------------------
       CLOSED
       -------------------------------------------------------- */

    socket.onclose =
      () => {

        console.warn(
          "WebSocket disconnected. Reconnecting..."
        );

        if ($("st")) {

          $("st").textContent =
            "Reconnecting...";
        }

        if ($("dot")) {

          $("dot").className =
            "dot";
        }

        if (reconnectTimer) {

          clearTimeout(
            reconnectTimer
          );
        }

        reconnectTimer =
          setTimeout(
            connect,
            3000
          );
      };


  } catch(e) {

    console.error(
      "WebSocket connection failed:",
      e
    );

    reconnectTimer =
      setTimeout(
        connect,
        3000
      );
  }
}


/* ============================================================
   INITIALIZE FILTERS
   ============================================================ */

updateFilterButtons();

setupSearch();


/* ============================================================
   INITIAL LOAD
   ============================================================ */

loadInitial();


/* ============================================================
   START WEBSOCKET
   ============================================================ */

connect();


/* ============================================================
   GLOBAL FUNCTIONS
   ------------------------------------------------------------
   Required by index.html:
   onclick="save()"
   onclick="setFilter('BUY')"
   etc.
   ============================================================ */

window.save =
  save;

window.setFilter =
  setFilter;


/* ============================================================
   CONSOLE
   ============================================================ */

console.log(
  "%cDelta Cloud Scanner V4 - Bandwidth Optimized",
  "color:#00e6a0;font-size:16px;font-weight:800"
);

console.log(
  "%cProfessional frontend + Search + Signal Filters loaded",
  "color:#8fa0b5;font-size:12px"
);
