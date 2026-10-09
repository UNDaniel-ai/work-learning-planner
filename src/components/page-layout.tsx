import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  action
}: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-5 border-b border-stone-200 pb-7 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-2xl">
        <p className="text-sm font-medium text-teal-700">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold text-stone-950 sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-6 text-stone-600 sm:text-base">
          {description}
        </p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({
  icon,
  title,
  description,
  action
}: EmptyStateProps) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center border border-dashed border-stone-300 bg-white/70 px-6 py-12 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-50 text-teal-700">
        {icon}
      </div>
      <h2 className="mt-4 text-lg font-semibold text-stone-950">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-stone-600">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ActionLink({
  href,
  children,
  icon
}: {
  href: string;
  children: ReactNode;
  icon: ReactNode;
}) {
  return (
    <a
      href={href}
      className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-stone-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
    >
      {icon}
      <span>{children}</span>
    </a>
  );
}

export function MetricBand({
  items
}: {
  items: Array<{ label: string; value: string; accent: string }>;
}) {
  return (
    <div className="grid border-y border-stone-200 bg-white/60 sm:grid-cols-3">
      {items.map((item) => (
        <div
          className="border-b border-stone-200 px-5 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"
          key={item.label}
        >
          <p className="text-xs font-medium text-stone-500">{item.label}</p>
          <p className={`mt-1 text-2xl font-semibold ${item.accent}`}>
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
