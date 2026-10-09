import { ArrowRight, Clock3, ListChecks } from "lucide-react";
import { ActionLink, EmptyState, MetricBand, PageHeader } from "../../components/page-layout";

export default function TodayPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        action={
          <ActionLink href="/weekly" icon={<ArrowRight size={16} />}>
            Open weekly plan
          </ActionLink>
        }
        description="A small, honest view of what is planned and what actually gets your attention today."
        eyebrow="Friday, October 9, 2026"
        title="Today"
      />

      <MetricBand
        items={[
          { label: "Planned focus", value: "0h 00m", accent: "text-teal-700" },
          { label: "Completed tasks", value: "0", accent: "text-stone-950" },
          { label: "Work / learning", value: "—", accent: "text-amber-700" }
        ]}
      />

      <section aria-labelledby="today-blocks-heading" className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-stone-500">Time blocks</p>
            <h2
              className="mt-1 text-xl font-semibold text-stone-950"
              id="today-blocks-heading"
            >
              Today&apos;s focus
            </h2>
          </div>
          <Clock3 aria-hidden="true" className="text-stone-400" size={20} />
        </div>
        <EmptyState
          action={
            <ActionLink href="/weekly" icon={<ArrowRight size={16} />}>
              Schedule from weekly plan
            </ActionLink>
          }
          description="No time blocks are scheduled yet. Start with the week, then bring one clear block into today."
          icon={<Clock3 aria-hidden="true" size={20} />}
          title="Nothing scheduled"
        />
      </section>

      <section aria-labelledby="today-tasks-heading" className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-stone-500">Execution</p>
            <h2
              className="mt-1 text-xl font-semibold text-stone-950"
              id="today-tasks-heading"
            >
              Priority tasks
            </h2>
          </div>
          <ListChecks aria-hidden="true" className="text-stone-400" size={20} />
        </div>
        <div className="border border-stone-200 bg-white/60 px-5 py-5 text-sm text-stone-600">
          Tasks will appear here after they are selected for the current week.
        </div>
      </section>
    </div>
  );
}
