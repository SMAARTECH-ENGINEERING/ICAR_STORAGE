// Every timestamp in the app is shown in Indian Standard Time regardless of
// the viewer's own device/browser timezone, since the deployment and its
// users are India-based — a UTC timestamp rendered via a bare
// `toLocaleString()` would otherwise silently follow whatever timezone the
// viewing device happens to be set to.
const IST_TIME_ZONE = 'Asia/Kolkata';

export function formatDateTime(value, fallback = '-') {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  const formatted = date.toLocaleString('en-IN', {
    timeZone: IST_TIME_ZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
  return `${formatted} IST`;
}

export function formatDate(value, fallback = '-') {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString('en-IN', {
    timeZone: IST_TIME_ZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
