import { KnowledgeCardWorkspace } from "../../../../components/knowledge-card-workspace";
import { PageHeader } from "../../../../components/page-layout";

export default async function KnowledgeCardPage({ params }: { params: Promise<{ cardId: string }> }) {
  const { cardId } = await params;
  return <div className="space-y-8"><PageHeader eyebrow="Knowledge card" title="Recall and mature" description="Keep sources and evidence visible while understanding moves from observation to teaching." /><KnowledgeCardWorkspace cardId={cardId} /></div>;
}
