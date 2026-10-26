import { StudySessionWorkspace } from "../../../../components/study-session-workspace";
import { PageHeader } from "../../../../components/page-layout";

export default async function StudySessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  return <div className="space-y-8"><PageHeader eyebrow="Study session" title="Question to evidence" description="Capture the attempt, keep the proof, and promote only what the evidence supports." /><StudySessionWorkspace sessionId={sessionId} /></div>;
}
