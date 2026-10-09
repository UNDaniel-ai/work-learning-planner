import { ArrowRight, ClipboardCheck, SlidersHorizontal } from "lucide-react";
import { ActionLink, EmptyState, PageHeader } from "../../components/page-layout";

export default function ReviewPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        action={
          <ActionLink href="/today" icon={<ArrowRight size={16} />}>
            Back to today
          </ActionLink>
        }
        description="Record what moved, what slipped, and what should change next week."
        eyebrow="Reflection"
        title="Review"
      />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
        <section aria-labelledby="review-heading" className="space-y-3">
          <div>
            <p className="text-xs font-medium text-stone-500">Weekly review</p>
            <h2
              className="mt-1 text-xl font-semibold text-stone-950"
              id="review-heading"
            >
              Close the loop
            </h2>
          </div>
          <EmptyState
            action={
              <ActionLink href="/today" icon={<ClipboardCheck size={16} />}>
                Review today&apos;s work
              </ActionLink>
            }
            description="A review will appear after the week has a plan and some actual time behind it."
            icon={<ClipboardCheck aria-hidden="true" size={20} />}
            title="No review recorded"
          />
        </section>

        <section className="border border-stone-200 bg-white/60 p-5">
          <SlidersHorizontal
            aria-hidden="true"
            className="text-stone-400"
            size={20}
          />
          <p className="mt-4 text-sm font-medium text-stone-800">
            Plan versus actual
          </p>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Variance and adjustment notes will stay explainable and editable.
          </p>
        </section>
      </div>
    </div>
  );
}
