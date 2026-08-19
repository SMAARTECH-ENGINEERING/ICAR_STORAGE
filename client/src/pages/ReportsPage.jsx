import { useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { api } from '../lib/apiClient';
import { useToast } from '../context/ToastContext';
import DataTable from '../components/DataTable';
import { formatDateTime } from '../lib/datetime';

// Compact one-line summaries for the dynamic sensors/relays objects — no
// fixed zone names or relay count assumed, same philosophy as SensorZones.jsx.
function summarizeSensors(sensors) {
  const zoneNames = Object.keys(sensors || {});
  if (zoneNames.length === 0) return null;
  return zoneNames
    .map((zone) => {
      const z = sensors[zone] || {};
      const bits = [];
      if (typeof z.temperature_c === 'number') bits.push(`${z.temperature_c}°C`);
      if (typeof z.humidity_percent === 'number') bits.push(`${z.humidity_percent}%`);
      if (typeof z.co2_ppm === 'number') bits.push(`${z.co2_ppm}ppm`);
      if (typeof z.pressure_hpa === 'number') bits.push(`${z.pressure_hpa}hPa`);
      return `${zone}: ${bits.length ? bits.join(', ') : '-'}`;
    })
    .join(' · ');
}

function summarizeRelays(relays) {
  const relayIds = Object.keys(relays || {});
  if (relayIds.length === 0) return null;
  return relayIds.map((id) => `${id}: ${relays[id]?.state || '?'}`).join(' · ');
}

export default function ReportsPage() {
  const { push } = useToast();

  const [rooms, setRooms] = useState([]);
  const [devices, setDevices] = useState([]);
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [roomId, setRoomId] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    Promise.all([api.listRooms(), api.listDevices()])
      .then(([roomsRes, devicesRes]) => {
        setRooms(roomsRes.data);
        setDevices(devicesRes.data);
      })
      .catch((err) => push(err.message, 'error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runReport(filters) {
    setLoading(true);
    try {
      const params = {};
      if (filters.roomId) params.roomId = filters.roomId;
      if (filters.deviceId) params.deviceId = filters.deviceId;
      if (filters.fromDate) params.from = filters.fromDate;
      if (filters.toDate) {
        // Date-only input parses to 00:00:00 UTC — push to end-of-day so the
        // "to" date's own readings are actually included, not excluded.
        const end = new Date(filters.toDate);
        end.setUTCHours(23, 59, 59, 999);
        params.to = end.toISOString();
      }
      const res = await api.getSensorHistory(params);
      setReadings(res.data);
    } catch (err) {
      push(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  // Initial load: latest readings across every room, no filters applied yet.
  useEffect(() => {
    runReport({ roomId: '', deviceId: '', fromDate: '', toDate: '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    if (fromDate && toDate && fromDate > toDate) {
      push('"From" date must be before "To" date.', 'error');
      return;
    }
    runReport({ roomId, deviceId, fromDate, toDate });
  }

  function handleReset() {
    setRoomId('');
    setDeviceId('');
    setFromDate('');
    setToDate('');
    runReport({ roomId: '', deviceId: '', fromDate: '', toDate: '' });
  }

  const roomNameById = useMemo(() => {
    const map = {};
    rooms.forEach((r) => {
      map[r.roomId] = r.name;
    });
    return map;
  }, [rooms]);

  // The device dropdown narrows to the selected room's devices, resetting
  // deviceId if it no longer belongs to the newly selected room.
  const devicesInScope = useMemo(
    () => (roomId ? devices.filter((d) => d.roomId === roomId) : devices),
    [devices, roomId]
  );

  function handleRoomChange(value) {
    setRoomId(value);
    if (value && deviceId && !devices.find((d) => d.deviceId === deviceId && d.roomId === value)) {
      setDeviceId('');
    }
  }

  const columns = useMemo(
    () => [
      {
        accessorKey: 'timestamp',
        header: 'Timestamp',
        cell: ({ getValue }) => <span className="whitespace-nowrap">{formatDateTime(getValue())}</span>,
      },
      {
        id: 'room',
        header: 'Room',
        accessorFn: (row) => roomNameById[row.roomId] || row.roomId,
      },
      {
        accessorKey: 'deviceId',
        header: 'Device',
        cell: ({ getValue }) => <span className="font-mono text-xs text-slate-500">{getValue()}</span>,
      },
      {
        id: 'sensors',
        header: 'Sensors',
        accessorFn: (row) => JSON.stringify(row.sensors || {}),
        cell: ({ row }) => {
          const summary = summarizeSensors(row.original.sensors);
          return summary ? (
            <span className="text-xs text-slate-600" title={JSON.stringify(row.original.sensors, null, 2)}>
              {summary}
            </span>
          ) : (
            <span className="text-slate-300">-</span>
          );
        },
      },
      {
        id: 'relays',
        header: 'Relays',
        accessorFn: (row) => JSON.stringify(row.relays || {}),
        cell: ({ row }) => {
          const summary = summarizeRelays(row.original.relays);
          return summary ? (
            <span className="text-xs text-slate-600" title={JSON.stringify(row.original.relays, null, 2)}>
              {summary}
            </span>
          ) : (
            <span className="text-slate-300">-</span>
          );
        },
      },
    ],
    [roomNameById]
  );

  return (
    <div>
      <p className="mb-6 text-sm text-slate-500">
        Historical sensor readings across every room. Filter by room, device, and date range, then search/sort/page
        through the results below.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mb-6 grid grid-cols-1 gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:grid-cols-2 lg:grid-cols-5 lg:items-end"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="report-room">
            Room
          </label>
          <select
            id="report-room"
            value={roomId}
            onChange={(e) => handleRoomChange(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          >
            <option value="">All Rooms</option>
            {rooms.map((room) => (
              <option key={room.roomId} value={room.roomId}>
                {room.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="report-device">
            Device
          </label>
          <select
            id="report-device"
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          >
            <option value="">All Devices</option>
            {devicesInScope.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="report-from">
            From
          </label>
          <input
            id="report-from"
            type="date"
            value={fromDate}
            max={toDate || undefined}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="report-to">
            To
          </label>
          <input
            id="report-to"
            type="date"
            value={toDate}
            min={fromDate || undefined}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            <Search size={15} /> {loading ? 'Loading...' : 'Generate Report'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="flex items-center justify-center rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            title="Reset filters"
            aria-label="Reset filters"
          >
            <X size={15} />
          </button>
        </div>
      </form>

      {loading && readings.length === 0 ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : (
        <DataTable
          columns={columns}
          data={readings}
          searchPlaceholder="Search readings..."
          emptyMessage="No sensor readings match these filters."
        />
      )}
    </div>
  );
}
