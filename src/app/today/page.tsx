import { ArrowRight } from "lucide-react";
import { TodayWorkspace } from "../../components/today-workspace";
import { ActionLink, PageHeader } from "../../components/page-layout";

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
        eyebrow="Execution"
        title="Today"
      />
      <TodayWorkspace date={getTodayDate()} />
    </div>
  );
}

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}
