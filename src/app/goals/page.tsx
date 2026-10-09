import { ArrowRight, BookOpen, Flag, Plus } from "lucide-react";
import { ActionLink, EmptyState, PageHeader } from "../../components/page-layout";

export default function GoalsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        action={
          <ActionLink href="/weekly" icon={<ArrowRight size={16} />}>
            Build weekly plan
          </ActionLink>
        }
        description="Keep work outcomes and learning progress visible in the same planning surface."
        eyebrow="Direction"
        title="Goals & Learning"
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <section aria-labelledby="goals-heading" className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-stone-500">Work</p>
              <h2
                className="mt-1 text-xl font-semibold text-stone-950"
                id="goals-heading"
              >
                Goals
              </h2>
            </div>
            <Flag aria-hidden="true" className="text-teal-700" size={20} />
          </div>
          <EmptyState
            action={
              <ActionLink href="/weekly" icon={<Plus size={16} />}>
                Start with a weekly focus
              </ActionLink>
            }
            description="Quarterly, monthly, and weekly outcomes will live here."
            icon={<Flag aria-hidden="true" size={20} />}
            title="No goals yet"
          />
        </section>

        <section aria-labelledby="learning-heading" className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-stone-500">Learning</p>
              <h2
                className="mt-1 text-xl font-semibold text-stone-950"
                id="learning-heading"
              >
                Topics
              </h2>
            </div>
            <BookOpen aria-hidden="true" className="text-amber-700" size={20} />
          </div>
          <EmptyState
            action={
              <ActionLink href="/weekly" icon={<Plus size={16} />}>
                Add a learning topic
              </ActionLink>
            }
            description="Track a course, skill, reading topic, or practice thread."
            icon={<BookOpen aria-hidden="true" size={20} />}
            title="No learning topics yet"
          />
        </section>
      </div>
    </div>
  );
}
