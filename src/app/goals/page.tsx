import { ArrowRight } from "lucide-react";
import { GoalsWorkspace } from "../../components/goals-workspace";
import { ActionLink, PageHeader } from "../../components/page-layout";

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

      <GoalsWorkspace />
    </div>
  );
}
