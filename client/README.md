# ICAR Storage Client

A React + Tailwind CSS dashboard for the ICAR Storage IoT backend (`../server`). Everything is fetched dynamically from the API — no room IDs, device IDs, sensor zone names, or relay counts are hardcoded anywhere in this app. Point it at any backend instance and it renders whatever rooms/devices/sensors/relays exist there.

## Tech Stack

- **React 19** (Vite, plain JS — no TypeScript)
- **Tailwind CSS v4** (via `@tailwindcss/vite`, no config file needed)
- **React Router v7** for client-side routing
- **TanStack Table v8** for sortable/filterable/paginated data tables
- **Axios** for HTTP calls to the backend's REST API
- **Socket.IO client** for live updates (telemetry, relay state, alerts)

## Installation

```bash
npm install
```

## Configuration

Two ways to point this app at your backend, both optional (there's a working default):

1. **Build-time default** — copy `.env.example` to `.env` and set `VITE_API_BASE_URL` (defaults to `http://localhost:5000/api/v1`, matching the backend's default `PORT`).
2. **Runtime override** — click **⚙ Settings** in the app (or the "API Settings" panel on the login screen) to point at a different backend without rebuilding, and to set the **Device API Key** used by the telemetry simulator. Both are stored in `localStorage`.

Socket.IO connects to the same origin as the API base URL (the `/api/v1` suffix is stripped automatically), since the backend mounts Socket.IO on the same HTTP server as the REST API.

## Run Commands

```bash
npm run dev       # start the Vite dev server (http://localhost:5173)
npm run build     # production build to dist/
npm run preview   # preview the production build locally
npm run lint      # oxlint
```

Run the backend (`../server`) first — see `../server/README.md`.

## What's in the app

Admin-panel layout: a persistent sidebar (Dashboard / Devices / Reports / Alerts / Settings) plus a full-width content area — nothing is boxed into a narrow centered column.

- **Register / Login** — the backend doesn't restrict self-registration by role, so the register form lets you pick `SUPER_ADMIN`, `ADMIN`, or `VIEWER` directly (useful for testing RBAC). Split-screen animated layout (`AuthLayout.jsx`) that swaps sides between the two.
- **Dashboard** (`/`) — stat cards (room/device/online/active-alert counts, computed client-side from `GET /rooms`, `GET /devices`, `GET /alerts?status=active`) above a sortable, searchable, paginated **data table** of every room, with a "New Room" button for `ADMIN`/`SUPER_ADMIN`.
- **Devices** (`/devices`) — a global data table of every device across every room (room name resolved client-side), with search/sort and an "Add Device" flow that includes a room picker.
- **Reports** (`/reports`) — historical sensor readings across every room via `GET /reports/sensor-history`. A filter form (Room, Device — narrowed to the selected room, From/To date) plus the same searchable/sortable/paginated data table used elsewhere. The "To" date is treated as inclusive of that whole day client-side (a bare `YYYY-MM-DD` parses to that day's UTC midnight, which would otherwise exclude the day's own readings).
- **Alerts** (`/alerts`) — a global, sortable/searchable data table of alerts with an Active/Resolved/All filter.
- **Settings** (`/settings`) — API Base URL and Device API Key, plus your current signed-in identity.
- **Room Detail** (`/rooms/:roomId`) — pulls `GET /rooms/:roomId/current` (room + devices + latest sensor state + relays + active alerts) and re-fetches automatically whenever a relevant Socket.IO event arrives for that room (`device:telemetry`, `device:online`, `device:offline`, `relay:stateChanged`, `relay:command`, `alert:created`, `alert:resolved`). Devices stay as rich cards here (not a table) since each has nested sensor/relay/automation UI:
  - **Sensors** are rendered by looping over whatever zone keys the device actually sent (`upper`/`middle`/`lower`/`co2`/anything else) — the UI has no fixed zone list.
  - **Relays** show mode/state with manual ON/OFF buttons (`ADMIN`+), and an expandable **Automation** panel to configure each relay's threshold-based auto rule (`GET`/`PUT /devices/:deviceId/relays/:relayId/automation`). The backend has no MQTT/push transport — a command sits at `PENDING` until a device polls for it, so clicking ON/OFF alone won't visibly change the relay's state.
  - **Simulate Device (Process Pending Commands)** — stands in for that missing device: polls `GET /commands/pending` and acknowledges everything as successful, so you can watch a relay actually flip to `CONFIRMED` without real firmware.
  - **Send Test Telemetry** — a small JSON editor on each device card that POSTs to `/devices/telemetry` using the configured Device API Key, so you can exercise the whole pipeline (storage → automation → alerts → live UI update) without real hardware.
- Role-gated UI: `VIEWER` sees everything read-only; `ADMIN` can manage rooms/devices/relays/automation; only `SUPER_ADMIN` can delete rooms/devices, matching the backend's RBAC exactly (the UI hides actions the backend would reject, but the backend is still the source of truth).

## Project Structure

```
src/
├── lib/
│   ├── config.js       # API base URL / device key / token, all in localStorage
│   ├── apiClient.js     # axios instance + one function per backend route
│   ├── socket.js         # useRoomSocket() hook
│   └── constants.js       # ROLES, mirrors backend's utils/constants.js
├── context/
│   ├── AuthContext.jsx    # user/token state, login/register/logout
│   └── ToastContext.jsx    # toast notifications
├── components/
│   ├── Sidebar.jsx, Layout.jsx  # admin-panel shell
│   ├── DataTable.jsx              # generic TanStack Table wrapper (sort/search/paginate)
│   ├── StatCard.jsx                # dashboard stat tiles
│   └── ...                          # Badge, Modal, DeviceCard, RelayRow, AutomationForm, ...
├── pages/                  # LoginPage, RegisterPage, DashboardPage, DevicesPage, ReportsPage, AlertsPage, SettingsPage, RoomDetailPage
└── App.jsx                  # routes
```

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| "Network Error" / requests fail immediately | Backend not running, or wrong API Base URL in Settings — check the backend is up at the URL shown in Settings |
| Login works but everything after 401s | Backend restarted with a different `JWT_SECRET`, invalidating the old token — log out and back in |
| Relay ON/OFF buttons don't appear | Logged in as `VIEWER` — relay control requires `ADMIN` or `SUPER_ADMIN` |
| Clicking Turn ON/OFF doesn't change the relay's state | Expected — there's no device to poll and ack the command. Open **Simulate Device (Process Pending Commands)** on that device's card and click **Poll & Acknowledge** |
| "Send Test Telemetry" returns 401 | Device API Key in Settings doesn't match `DEVICE_API_KEY` in the backend's `.env` |
| No live updates without a manual refresh | Socket.IO couldn't connect — check the browser console; it connects to the API base URL's origin (not `/api/v1`) |
