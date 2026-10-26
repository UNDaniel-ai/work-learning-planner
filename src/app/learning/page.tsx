import { LearningWorkspace } from "../../components/learning-workspace";
import { PageHeader } from "../../components/page-layout";

export default function LearningPage() {
  return <div className="space-y-8"><PageHeader eyebrow="Practice and evidence" title="Learning" description="Turn focused study sessions into evidence-backed knowledge and active recall." /><LearningWorkspace /></div>;
}
