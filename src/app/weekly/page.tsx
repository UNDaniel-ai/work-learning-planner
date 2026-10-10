import { ArrowRight } from "lucide-react";
import { ActionLink, PageHeader } from "../../components/page-layout";
import { WeeklyPlanner } from "../../components/weekly-planner";

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

      <WeeklyPlanner />
    </div>
  );
}
