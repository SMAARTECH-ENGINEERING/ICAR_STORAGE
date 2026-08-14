export default function StatCard({ label, value, icon: Icon, accent = 'text-slate-900' }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <Icon size={18} className="text-slate-400" />
      </div>
      <p className={`mt-1 text-2xl font-semibold ${accent}`}>{value}</p>
    </div>
  );
}
