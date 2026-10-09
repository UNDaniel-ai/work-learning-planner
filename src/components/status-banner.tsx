import { Settings2, WifiOff } from "lucide-react";

export function StatusBanner() {
  return (
    <div
      className="mx-auto flex max-w-6xl items-center justify-between gap-4 py-3"
      role="status"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700">
          <WifiOff aria-hidden="true" size={16} strokeWidth={1.8} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-stone-800">
            Vikunja
          </p>
          <p className="truncate text-xs text-stone-500">Not connected</p>
        </div>
      </div>
      <a
        href="/settings"
        aria-label="Manage connection"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 transition hover:border-stone-300 hover:text-stone-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
        title="Manage connection"
      >
        <Settings2 aria-hidden="true" size={17} strokeWidth={1.8} />
      </a>
    </div>
  );
}
