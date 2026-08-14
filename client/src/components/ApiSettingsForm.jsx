import { useState } from 'react';
import { getApiBaseUrl, setApiBaseUrl, getDeviceApiKey, setDeviceApiKey } from '../lib/config';

export default function ApiSettingsForm({ onSaved }) {
  const [baseUrl, setBaseUrl] = useState(getApiBaseUrl());
  const [deviceKey, setDeviceKey] = useState(getDeviceApiKey());

  function handleSave(e) {
    e.preventDefault();
    setApiBaseUrl(baseUrl);
    setDeviceApiKey(deviceKey);
    onSaved?.();
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="api-base-url">
          API Base URL
        </label>
        <input
          id="api-base-url"
          type="text"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder="http://localhost:5000/api/v1"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
        />
        <p className="mt-1 text-xs text-slate-500">
          Points the dashboard at your backend's <code>/api/v1</code> URL. Socket.IO connects to the same origin.
        </p>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="device-api-key">
          Device API Key
        </label>
        <input
          id="device-api-key"
          type="text"
          value={deviceKey}
          onChange={(e) => setDeviceKey(e.target.value)}
          placeholder="DEVICE_API_KEY from the backend's .env"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
        />
        <p className="mt-1 text-xs text-slate-500">
          Used only by the "Send Test Telemetry" tool, to authenticate as a device (not your user account).
        </p>
      </div>
      <button
        type="submit"
        className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
      >
        Save Settings
      </button>
    </form>
  );
}
