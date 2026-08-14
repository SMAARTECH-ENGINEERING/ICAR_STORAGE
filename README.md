# ICAR Storage

Dynamic multi-room IoT environmental monitoring and relay-control system.

```
├── server/   Node.js + Express + MongoDB + MQTT + Socket.IO backend (API, docs: server/README.md)
└── client/   React + Tailwind CSS dashboard (docs: client/README.md)
```

## Quick Start

```bash
# 1. Backend
cd server
cp .env.example .env   # fill in MONGODB_URI, MQTT_BROKER_URL, JWT secrets, etc.
npm install
npm run dev             # http://localhost:5000

# 2. Frontend (separate terminal)
cd client
npm install
npm run dev             # http://localhost:5173
```

Open `http://localhost:5173`, register an account, and start creating rooms and devices. See [server/README.md](server/README.md) for the API reference and [client/README.md](client/README.md) for the dashboard's own docs.
