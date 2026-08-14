export default function Tooltip({ label, children }) {
  return (
    <span className="group/tooltip relative inline-flex">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute -top-8 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/tooltip:opacity-100"
      >
        {label}
      </span>
    </span>
  );
}
