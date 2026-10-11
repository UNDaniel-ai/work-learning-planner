import { ArrowRight } from "lucide-react";
import { ReviewWorkspace } from "../../components/review-workspace";
import { ActionLink, PageHeader } from "../../components/page-layout";

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
      <ReviewWorkspace date={getTodayDate()} />
    </div>
  );
}

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}
