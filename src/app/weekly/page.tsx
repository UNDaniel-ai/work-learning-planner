import { ArrowRight, CalendarDays, Plus } from "lucide-react";
import { ActionLink, EmptyState, PageHeader } from "../../components/page-layout";

export default function WeeklyPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        action={
          <ActionLink href="/goals" icon={<ArrowRight size={16} />}>
            Choose a goal
          </ActionLink>
        }
        description="Choose a few outcomes, connect the right tasks, and give the week enough shape to be useful."
        eyebrow="Week of October 5–11, 2026"
        title="Weekly Plan"
      />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
        <section aria-labelledby="weekly-focus-heading" className="space-y-3">
          <div>
            <p className="text-xs font-medium text-stone-500">Planning period</p>
            <h2
              className="mt-1 text-xl font-semibold text-stone-950"
              id="weekly-focus-heading"
            >
              This week&apos;s focus
            </h2>
          </div>
          <EmptyState
            action={
              <ActionLink href="/goals" icon={<Plus size={16} />}>
                Add weekly focus
              </ActionLink>
            }
            description="No goals or tasks have been selected for this week."
            icon={<CalendarDays aria-hidden="true" size={20} />}
            title="The week is still open"
          />
        </section>

        <section className="border border-stone-200 bg-white/60 p-5">
          <p className="text-xs font-medium text-stone-500">Capacity</p>
          <p className="mt-2 text-3xl font-semibold text-stone-950">0h</p>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Planned time will be visible after the first block is added.
          </p>
        </section>
      </div>
    </div>
  );
}
