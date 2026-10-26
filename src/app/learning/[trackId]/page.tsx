import { LearningTrackWorkspace } from "../../../components/learning-track-workspace";
import { PageHeader } from "../../../components/page-layout";

export default async function LearningTrackPage({ params }: { params: Promise<{ trackId: string }> }) {
  const { trackId } = await params;
  return <div className="space-y-8"><PageHeader eyebrow="Learning path" title="Path workspace" description="Move through ordered modules and keep every session tied to a concrete outcome." /><LearningTrackWorkspace trackId={trackId} /></div>;
}
