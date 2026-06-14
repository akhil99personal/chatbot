export default function Logo({ size = 32, withWord = false }) {
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 64 64" className="drop-shadow-sm">
        <defs>
          <linearGradient id="lg" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#232761" />
            <stop offset="100%" stopColor="#525d9f" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="14" fill="url(#lg)" />
        <path d="M14 46V20l10 14 8-11 8 11 10-14v26h-6V32l-8 11-4-6-4 6-8-11v14z" fill="#fff" />
      </svg>
      {withWord && (
        <span className="font-display font-bold text-brand-700 text-lg tracking-tight">
          Milestono
        </span>
      )}
    </div>
  );
}