import { ArrowRight, Download, PlugZap, ShieldCheck } from "lucide-react";
import { ActionLink, PageHeader } from "../../components/page-layout";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        description="Keep the task connection, local data, and backup path understandable."
        eyebrow="System"
        title="Settings"
      />

      <section aria-labelledby="connection-heading" className="border border-stone-200 bg-white/60">
        <div className="flex flex-col gap-4 border-b border-stone-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <PlugZap aria-hidden="true" className="mt-0.5 text-amber-700" size={20} />
            <div>
              <h2
                className="font-semibold text-stone-950"
                id="connection-heading"
              >
                Vikunja connection
              </h2>
              <p className="mt-1 text-sm leading-6 text-stone-600">
                Connection details stay on the server side.
              </p>
            </div>
          </div>
          <ActionLink href="/api/vikunja/test-connection" icon={<ArrowRight size={16} />}>
            Test connection
          </ActionLink>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-stone-500">Base URL</p>
            <p className="mt-1 text-sm text-stone-800">Not configured</p>
          </div>
          <div>
            <p className="text-xs font-medium text-stone-500">API token</p>
            <p className="mt-1 text-sm text-stone-800">Stored in environment</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="data-heading" className="border border-stone-200 bg-white/60">
        <div className="flex items-start gap-3 border-b border-stone-200 p-5">
          <ShieldCheck aria-hidden="true" className="mt-0.5 text-teal-700" size={20} />
          <div>
            <h2 className="font-semibold text-stone-950" id="data-heading">
              Local planning data
            </h2>
            <p className="mt-1 text-sm leading-6 text-stone-600">
              Goals, time blocks, and reviews are stored in the local SQLite database.
            </p>
          </div>
        </div>
        <div className="p-5">
          <ActionLink href="/api/export" icon={<Download size={16} />}>
            Export planning data
          </ActionLink>
        </div>
      </section>
    </div>
  );
}
