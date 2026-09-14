# Delta Cloud Scanner V4 — Bandwidth Optimized

V4 is based on the existing V3 project. It keeps the live Delta ticker feed, all perpetual markets, indicator scanner, dashboard, and Telegram signal logic.

## Main bandwidth changes
- Browser WebSocket broadcasts are throttled to 5 seconds by default (configurable with `WS_BROADCAST_SECONDS`).
- The first REST/WebSocket load remains a full snapshot.
- Subsequent browser WebSocket messages use a compact `delta` protocol.
- Only changed market fields are sent.
- Price/change/volume/OI/live volume/rank are sent as small flat patches.
- The large `indicators` object is sent only when the scanner result changes.
- Removed markets are sent as a symbol list.
- Existing Telegram duplicate-signal protection is preserved.
- Existing Delta upstream WebSocket stays live; this optimization targets Render outbound WebSocket responses.

## Deploy as a separate Render service
Use a separate Render workspace/account for testing if desired. Import this repository/project and deploy the included `render.yaml`.

Required secrets remain:
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

Do not delete or modify the existing V3 service until V4 has been tested.
