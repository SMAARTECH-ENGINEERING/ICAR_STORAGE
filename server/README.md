# ICAR Storage Backend

A dynamic, multi-room IoT environmental monitoring and relay-control backend. Rooms and devices are entirely database-driven — no room, device, or relay identifiers are hardcoded anywhere in the source code. The system scales from 1 room to any number of rooms/devices without code changes.

## 1. Project Overview

The backend models the following relationship, all stored in MongoDB and resolved dynamically at request/telemetry time:

```
Room -> Device -> Sensor Data -> Relay -> Automation -> Alerts
```

- A **Room** can contain any number of **Devices**.
- A **Device** belongs to exactly one Room at a time (`Device.roomId`).
- A **Device** sends telemetry containing arbitrary named sensor zones (e.g. `upper`, `middle`, `lower`, `co2`) and any number of named **Relays** (`relay_1`, `relay_2`, ...).
- Relays can run in `manual` or `auto` mode. Auto mode is driven by a database-stored `AutomationRule` (per device + relay) with hysteresis, not hardcoded thresholds.
- Sensor readings that breach configurable thresholds raise de-duplicated **Alerts**.
- Every state change is broadcast in real time over Socket.IO, scoped to `room:{roomId}` and `device:{deviceId}` channels.

## 2. Tech Stack

- **Node.js** + **Express.js** — HTTP API, including all device communication (telemetry ingestion and relay-command delivery — no MQTT broker required)
- **MongoDB** + **Mongoose** — persistence
- **Socket.IO** — real-time push to dashboards/UIs
- **JWT** (`jsonwebtoken`) — user authentication
- **RBAC** — dynamic, database-backed roles & permissions (not hardcoded); ships seeded with `SUPER_ADMIN`, `ADMIN`, `VIEWER`
- **Joi** — request/payload validation
- **Winston** — structured logging
- **node-cron** — scheduled jobs (device offline sweep, sensor data retention cleanup)
- **bcryptjs** — password hashing
- Plain **JavaScript** (CommonJS), no TypeScript

## 3. Installation

```bash
npm install
```

## 4. Environment Setup

Copy the example file and fill in real values:

```bash
cp .env.example .env
```

See [`.env.example`](.env.example) for the full list of variables — every one of them is read in [`src/config/env.js`](src/config/env.js). Never commit a real `.env` file (already covered by `.gitignore`).

## 5. Run Commands

```bash
npm start     # production
npm run dev   # nodemon, auto-restart on change
```

On startup the server (`src/server.js`):
1. Connects to MongoDB (`connectDB()`).
2. Initializes Socket.IO on the HTTP server.
3. Starts the device-offline sweep job and the sensor-data retention cleanup job.
4. Listens on `PORT` (default `5000`).

Health check: `GET /api/v1/health` → `{ "success": true, "message": "OK", "timestamp": "..." }`

## 6. API Endpoints

All endpoints are mounted under `/api/v1`. All JSON responses use the envelope:

```json
{ "success": true, "message": "optional", "data": { } }
```

Errors (from `src/middleware/errorHandler.js`):

```json
{ "success": false, "message": "Device not found: xyz", "errorCode": "DEVICE_NOT_FOUND", "details": [] }
```

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| GET  | `/health` | none | — | Liveness check |
| POST | `/auth/register` | none | — | Create a user |
| POST | `/auth/login` | none | — | Log in, get tokens |
| POST | `/auth/refresh` | none | — | Exchange refresh token for a new access token |
| GET  | `/auth/me` | JWT | any | Current user info from the token, including live-resolved `permissions` |
| POST | `/rooms` | JWT | `rooms:create` | Create a room |
| GET  | `/rooms` | JWT | `rooms:read` | List rooms (`?status=`) |
| GET  | `/rooms/:roomId` | JWT | `rooms:read` | Get one room |
| PUT  | `/rooms/:roomId` | JWT | `rooms:update` | Update a room |
| DELETE | `/rooms/:roomId` | JWT | `rooms:delete` | Delete a room (fails if it still has devices) |
| GET  | `/rooms/:roomId/devices` | JWT | `rooms:read` | List devices assigned to a room |
| GET  | `/rooms/:roomId/current` | JWT | `rooms:read` | Room snapshot: devices, latest sensor state, relays, active alerts |
| GET  | `/rooms/:roomId/history` | JWT | `rooms:read` | Historical sensor readings (`?from=&to=&deviceId=&limit=`) |
| POST | `/devices/telemetry` | Device key | — | Ingest telemetry from a device |
| GET  | `/devices/:deviceId/commands/pending` | Device key | — | Device polls for relay commands to execute |
| POST | `/devices/:deviceId/commands/:commandId/ack` | Device key | — | Device reports the result of executing a command |
| POST | `/devices` | JWT | `devices:create` | Register/assign a device to a room |
| GET  | `/devices` | JWT | `devices:read` | List devices (`?roomId=&status=`) |
| GET  | `/devices/:deviceId` | JWT | `devices:read` | Get one device |
| PUT  | `/devices/:deviceId` | JWT | `devices:update` | Update a device (e.g. re-assign `roomId`) |
| DELETE | `/devices/:deviceId` | JWT | `devices:delete` | Delete a device and its related state/relays/commands/readings |
| GET  | `/devices/:deviceId/relays` | JWT | `relays:read` | List relays discovered for a device |
| GET  | `/devices/:deviceId/relays/automation` | JWT | `relays:read` | List automation rules for a device |
| POST | `/devices/:deviceId/relays/:relayId/command` | JWT | `relays:update` | Manually set a relay's mode/state |
| GET  | `/devices/:deviceId/relays/:relayId/commands` | JWT | `relays:read` | Relay command history (`?limit=`) |
| GET  | `/devices/:deviceId/relays/:relayId/automation` | JWT | `relays:read` | Get one relay's automation rule |
| PUT  | `/devices/:deviceId/relays/:relayId/automation` | JWT | `relays:update` | Create/update a relay's automation rule |
| GET  | `/alerts` | JWT | `alerts:read` | List alerts (`?roomId=&deviceId=&status=&limit=`) |
| PATCH | `/alerts/:alertId/resolve` | JWT | `alerts:update` | Manually resolve an active alert (sets `status=resolved`, `resolvedAt`) |
| GET  | `/reports/sensor-history` | JWT | `reports:read` | Historical sensor readings across every room (`?roomId=&deviceId=&from=&to=&limit=`) — global version of `/rooms/:roomId/history` |
| GET  | `/audit-logs` | JWT | `audit-logs:read` | List audit log entries (`?userId=&action=&roomId=&deviceId=&from=&to=&limit=`) |
| GET  | `/roles/permissions` | JWT | `admin:manage` | The full catalog of definable permission keys, grouped by resource |
| GET  | `/roles` | JWT | `admin:manage` | List roles with their permissions |
| POST | `/roles` | JWT | `admin:manage` | Create a role (`{name, description, permissions: []}`) |
| GET  | `/roles/:roleId` | JWT | `admin:manage` | Get one role |
| PUT  | `/roles/:roleId` | JWT | `admin:manage` | Update a role's name/description/permissions |
| DELETE | `/roles/:roleId` | JWT | `admin:manage` | Delete a role (fails if seeded/system, or still assigned to users) |
| GET  | `/users` | JWT | `admin:manage` | List users and their assigned role |
| PUT  | `/users/:userId/role` | JWT | `admin:manage` | Assign a different role to a user (cannot change your own) |

Routes are defined generically (`/:roomId`, `/:deviceId`, `/:relayId`) in [`src/routes/`](src/routes) — there is no per-room or per-device controller/branching anywhere in the codebase. Every gated route calls `authorizePermission(key)` (see [`src/middleware/auth.js`](src/middleware/auth.js)), which resolves the caller's role to its *current* permission set from the `Role` collection on every request — nothing is hardcoded to a fixed role name.

## 7. Authentication

JWT-based, implemented in [`src/services/authService.js`](src/services/authService.js) and [`src/middleware/auth.js`](src/middleware/auth.js).

**Register**
```http
POST /api/v1/auth/register
Content-Type: application/json

{ "name": "Admin User", "email": "admin@example.com", "password": "password123", "role": "SUPER_ADMIN" }
```
`role` is optional and defaults to `VIEWER` if omitted. It must name a role that exists in the `Role` collection — a 400 `ROLE_NOT_FOUND` is returned otherwise.

**Login**
```http
POST /api/v1/auth/login
Content-Type: application/json

{ "email": "admin@example.com", "password": "password123" }
```
Both return:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { "userId": "USR-XXXX", "name": "...", "email": "...", "role": "SUPER_ADMIN", "permissions": ["rooms:create", "rooms:read", "..."] },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

Send the access token on protected routes: `Authorization: Bearer <accessToken>`. The JWT itself only carries the role *name* (`payload.role`) — every permission check re-resolves that name's current permission set from the `Role` collection on each request, so editing a role's permissions (via `PUT /roles/:roleId`) takes effect for everyone holding that role immediately, without waiting for their token to expire. Reassigning *which* role a user holds (via `PUT /users/:userId/role`) does require the user to log in again (or use `/auth/refresh`), since that changes the role name embedded in the token.

**Roles & permissions are dynamic** ([`src/models/Role.js`](src/models/Role.js), [`src/services/roleService.js`](src/services/roleService.js)) — not a fixed enum. The full set of definable permission keys lives in [`src/utils/permissions.js`](src/utils/permissions.js) (e.g. `rooms:create`, `devices:delete`, `alerts:update`, `admin:manage`, ...); which roles exist and which keys each one holds is entirely database-driven and managed through the `/roles` and `/users` endpoints (also exposed in the client as **Roles & Permissions** / **Users**, gated behind `admin:manage`).

Three system roles are seeded automatically on server startup if missing (`roleService.ensureDefaultRoles()`), reproducing this app's original fixed-role behavior exactly:
- `SUPER_ADMIN` — every permission, including `admin:manage`.
- `ADMIN` — create/edit rooms, create/assign devices, control relays, configure automation, resolve alerts, view the audit log. No delete rights, no `admin:manage`.
- `VIEWER` — read-only: rooms, devices, relays, alerts, reports.

System roles can't be renamed or deleted, and the API refuses any update that would leave zero roles holding `admin:manage` (`LAST_ADMIN_ROLE`) — both guard against permanently locking every admin out. Custom roles (e.g. "Facility Manager") can be created with any subset of permission keys and assigned to users like any other role; a custom role can't be deleted while any user still holds it (`ROLE_IN_USE`).

## 8. Room Management

Rooms are created with an auto-generated, non-sequential `roomId` (`ROOM-XXXXXXXX`, via `src/utils/idGenerator.js`) — never derived from a name or index.

```http
POST /api/v1/rooms
Authorization: Bearer <token>

{ "name": "Greenhouse A", "location": "North Wing", "description": "..." }
```

`GET /api/v1/rooms/:roomId/current` returns everything needed for a dashboard tile in one call:
```json
{
  "room": { }, "devices": [ ], "sensorData": [ ], "relays": [ ], "alerts": [ ]
}
```

`GET /api/v1/rooms/:roomId/history?from=2026-08-01&to=2026-08-14&deviceId=&limit=500` queries `SensorReading` by `roomId` (+ optional `deviceId`/time range), sorted newest-first.

Deleting a room (`DELETE /api/v1/rooms/:roomId`) is blocked with `409 ROOM_HAS_DEVICES` while any device still references it.

## 9. Device Management

```http
POST /api/v1/devices
Authorization: Bearer <token>

{ "deviceId": "7semi_env_ctrl_01", "roomId": "ROOM-XXXXXXXX", "name": "Env Controller 1", "deviceType": "env_ctrl" }
```

`roomId` is validated against existing rooms (`roomService.assertRoomExists`) — creating/updating a device with an unknown room returns `400 ROOM_NOT_FOUND`. Re-assign a device to a different room at any time via `PUT /api/v1/devices/:deviceId { "roomId": "..." }`.

Deleting a device cascades: `DeviceState`, `Relay`, `AutomationRule`, `RelayCommand`, and `SensorReading` documents for that `deviceId` are removed (`src/services/deviceService.js`).

## 10. Sensor Telemetry

`POST /api/v1/devices/telemetry` is authenticated with a shared device key header, **not** a user JWT:

```http
POST /api/v1/devices/telemetry
Content-Type: application/json
x-device-key: <DEVICE_API_KEY>

{
  "device_id": "7semi_env_ctrl_01",
  "timestamp": "2026-08-14T11:50:00+05:30",
  "sensors": {
    "upper":  { "sensor_model": "SHT20", "temperature_c": 31.6, "humidity_percent": 57.8 },
    "middle": { "sensor_model": "SHT40", "temperature_c": 29.4, "humidity_percent": 60.9 },
    "lower":  { "sensor_model": "BME280", "temperature_c": 28.1, "humidity_percent": 64.2, "pressure_hpa": 1008.3 },
    "co2":    { "sensor_model": "SCD40", "co2_ppm": 875 }
  },
  "relays": {
    "relay_1": { "mode": "auto", "state": "ON", "control_source": "temperature_high", "controlling_zone": "max_of_upper_middle_lower", "highest_temperature_c": 31.6, "threshold_on_c": 30, "threshold_off_c": 28 },
    "relay_2": { "mode": "manual", "state": "OFF" }
  }
}
```

Zone names (`upper`/`middle`/`lower`/`co2`/anything else) and relay names (`relay_1`, `relay_2`, ... any count) are **not** hardcoded — `src/validators/telemetryValidator.js` accepts any key via `Joi.object().pattern(...)` and only range-checks the well-known measurement fields inside each zone (temperature, humidity, CO₂, pressure), using the configurable min/max env vars.

Processing flow (`src/services/telemetryService.js`):
1. Validate payload against `telemetrySchema`.
2. Look up the `Device` by `device_id` → resolve its `roomId` (404 `UNKNOWN_DEVICE` if not registered).
3. Store a `SensorReading` (historical) and upsert `DeviceState` (latest snapshot).
4. Update `Device.lastSeen`/`status = online`; emit `device:online` + resolve any `DEVICE_OFFLINE` alert if it was previously offline.
5. Sync `Relay` documents from the payload's `relays` object.
6. Emit `device:telemetry` over Socket.IO.
7. Run the automation engine for that device and issue relay commands for any relay whose desired state changed.
8. Evaluate sensor alert thresholds (temperature/humidity/CO₂ per zone).

Response: `201` with `{ deviceId, roomId, stored: true, timestamp, state }`.

## 11. Relay Control

Relays are discovered dynamically from telemetry (`relayService.syncRelaysFromTelemetry`) — the `Relay` model has no fixed count or fixed `relayId` set.

**Manual control**
```http
POST /api/v1/devices/:deviceId/relays/:relayId/command
Authorization: Bearer <token>   (SUPER_ADMIN or ADMIN only)

{ "mode": "manual", "state": "ON" }
```
Creates a `RelayCommand` (`commandId`, auto-generated) with status `PENDING` and returns `202` immediately — delivery to the device happens the next time it polls `GET /devices/:deviceId/commands/pending` (see [§13](#13-device-command-delivery-http-polling)). Command lifecycle status: `PENDING → SENT → ACKNOWLEDGED → CONFIRMED`, or `FAILED`/`TIMEOUT` (`src/services/relayCommandService.js`, ack-wait window controlled by `RELAY_COMMAND_TIMEOUT_MS`, started when the device picks the command up, not when it was created). The relay's confirmed `state` only updates once the device acknowledges via `POST /devices/:deviceId/commands/:commandId/ack`.

**Automation rules** (per device + relay, DB-driven — see [`src/models/AutomationRule.js`](src/models/AutomationRule.js)):
```http
PUT /api/v1/devices/:deviceId/relays/:relayId/automation
Authorization: Bearer <token>   (SUPER_ADMIN or ADMIN only)

{ "zones": ["upper", "middle", "lower"], "thresholdOn": 30, "thresholdOff": 28 }
```
`thresholdOff` must be strictly less than `thresholdOn` (enforced by Joi custom validation). The automation engine (`src/services/automationService.js`) computes the maximum temperature across the configured `zones` and applies hysteresis:
- value ≥ `thresholdOn` → desired state `ON`
- value ≤ `thresholdOff` → desired state `OFF`
- otherwise → **keep the relay's current state** (prevents oscillation)

Automation only evaluates relays currently in `mode: "auto"`, and only issues a command when the desired state differs from the relay's last known state.

## 12. Alerts

`GET /api/v1/alerts?roomId=&deviceId=&status=&limit=` — types (`src/utils/constants.js` → `ALERT_TYPE`): `HIGH_TEMPERATURE`, `HIGH_HUMIDITY`, `HIGH_CO2`, `DEVICE_OFFLINE`, `SENSOR_FAILURE`, `RELAY_FAILURE`.

Thresholds are env-configured, not hardcoded per device: `ALERT_TEMP_HIGH_C`, `ALERT_HUMIDITY_HIGH_PERCENT`, `ALERT_CO2_HIGH_PPM`. Each alert has a `dedupeKey` (`deviceId:type:parameter`) so a condition that stays breached does not create duplicate active alerts (`src/services/alertService.js`); the existing active alert is reused until it resolves.

## 13. Device Command Delivery (HTTP Polling)

There is no MQTT broker (or any other push transport) in this backend — every device interaction is a plain HTTP request the device initiates, authenticated the same way as telemetry (`x-device-key: <DEVICE_API_KEY>`). Since HTTP is inherently client-initiated, the backend can't "push" a relay command to a device the way MQTT could; instead the device **polls** for work:

```
Backend                                      Device
   │                                            │
   │  (user clicks "Turn ON", or automation     │
   │   engine decides a relay must change)      │
   │                                            │
   │  RelayCommand created, status PENDING      │
   │                                            │
   │◄────── GET /devices/:id/commands/pending ──┤  (device polls every few seconds)
   │        [{ commandId, relayId, mode, state }]
   │  status → SENT, ack-timeout clock starts   │
   │                                            │  (device flips the physical relay)
   │◄── POST /devices/:id/commands/:cmdId/ack ──┤
   │        { state: "ON", success: true }      │
   │  status → CONFIRMED, Relay.state updated   │
   │  Socket.IO: relay:stateChanged             │
```

**`GET /api/v1/devices/:deviceId/commands/pending`**
```http
GET /api/v1/devices/7semi_env_ctrl_01/commands/pending
x-device-key: <DEVICE_API_KEY>
```
Returns every command still in `PENDING` or `SENT` status for that device, oldest first. Any `PENDING` command returned this way is immediately marked `SENT` and its ack-timeout clock starts (`src/services/relayCommandService.js` → `listPendingCommands`) — so devices should poll on a short interval (a few seconds) relative to `RELAY_COMMAND_TIMEOUT_MS`.

**`POST /api/v1/devices/:deviceId/commands/:commandId/ack`**
```http
POST /api/v1/devices/7semi_env_ctrl_01/commands/CMD-XXXXXXXX/ack
Content-Type: application/json
x-device-key: <DEVICE_API_KEY>

{ "state": "ON", "success": true }
```
Reports the result of executing a command. On success the `Relay.state` is updated and `relay:stateChanged` is emitted over Socket.IO; on failure (`success: false`, optionally with an `error` string) the command is marked `FAILED`. A command that's never acknowledged within `RELAY_COMMAND_TIMEOUT_MS` of being delivered is marked `TIMEOUT` by the same in-memory timer mechanism that previously handled MQTT publish timeouts.

Telemetry ingestion was already plain HTTP (`POST /devices/telemetry`, §10) even before this change, so removing MQTT only affected the command-delivery direction.

## 14. Socket.IO

Initialized in [`src/sockets/index.js`](src/sockets/index.js), attached to the same HTTP server. Clients join dynamic rooms:

```js
socket.emit('subscribe:room', roomId);
socket.emit('subscribe:device', deviceId);
```

Server-emitted events, all broadcast to both `room:{roomId}` and `device:{deviceId}`:

| Event | Emitted when |
|---|---|
| `device:telemetry` | New telemetry stored |
| `device:online` | Device transitions offline → online (via new telemetry) |
| `device:offline` | Device transitions online → offline (offline-sweep job) |
| `relay:command` | A relay command is created/sent/acknowledged/failed/times out |
| `relay:stateChanged` | A relay's confirmed state changes after device acknowledgement |
| `alert:created` | A new (non-duplicate) alert is raised |
| `alert:resolved` | An active alert's condition clears |

An optional `token` (JWT) can be passed via `socket.handshake.auth.token` to attach `socket.user`; unauthenticated sockets can still connect and subscribe.

## 15. Multiple-Room Architecture

There is exactly one generic implementation for rooms, devices, and relays — no per-room or per-device functions/controllers exist anywhere in `src/`. Every lookup goes through Mongoose queries keyed by the dynamic `roomId`/`deviceId`/`relayId` values found in the request or the resolved `Device` document:

- `Room` documents get an auto-generated `roomId`, never a fixed value.
- `Device.roomId` is the only link between a device and its room; changing it (via `PUT /devices/:deviceId`) re-assigns the device instantly.
- `GET /rooms/:roomId/devices`, `/current`, and `/history` all filter strictly by `roomId`, so N rooms with any number of devices each are supported without limit.
- Relay/automation/sensor collections are all keyed by `deviceId`, which is itself scoped to a room through the `Device` document — so relay counts and sensor zone names can differ per device with no code changes.

## 16. Basic Troubleshooting

| Symptom | Likely cause | Check |
|---|---|---|
| Server exits immediately on start | MongoDB unreachable | `MONGODB_URI` in `.env`; Mongo logs (`MongoDB connection error` in stdout) |
| `401 AUTH_TOKEN_MISSING` / `AUTH_TOKEN_INVALID` | Missing/expired `Authorization: Bearer <token>` | Re-login via `/auth/login` or `/auth/refresh` |
| `401 DEVICE_AUTH_FAILED` on telemetry | Wrong/missing `x-device-key` header | Must equal `DEVICE_API_KEY` from `.env` |
| `404 UNKNOWN_DEVICE` on telemetry | `device_id` in payload not registered | Create the device first via `POST /devices` |
| `400 ROOM_NOT_FOUND` creating/updating a device | `roomId` doesn't exist | Create the room first via `POST /rooms` |
| `409 ROOM_HAS_DEVICES` deleting a room | Devices still assigned | Delete/reassign devices first |
| `403 FORBIDDEN` | Logged in as `VIEWER` calling a write/relay-command/automation endpoint | Use an `ADMIN`/`SUPER_ADMIN` account |
| Relay command stuck at `PENDING` | Device hasn't polled `GET /devices/:deviceId/commands/pending` yet | Confirm device firmware is actually polling, and using the right `x-device-key` |
| Relay command stuck at `TIMEOUT` | Device polled (status went to `SENT`) but never called the `/ack` endpoint within `RELAY_COMMAND_TIMEOUT_MS` | Confirm device firmware POSTs to `/commands/:commandId/ack` right after actuating the relay |
| Device never shows `offline` | Sweep job hasn't run yet | Runs every `DEVICE_STATUS_SWEEP_INTERVAL_SECONDS`; offline threshold is `DEVICE_OFFLINE_TIMEOUT_SECONDS` |
| Old sensor data not being purged | Retention job schedule | Controlled by `RETENTION_CLEANUP_CRON` / `SENSOR_DATA_RETENTION_DAYS` |
