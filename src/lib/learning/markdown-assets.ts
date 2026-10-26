import { mkdir, readFile, writeFile } from "node:fs/promises";
import {
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep
} from "node:path";
import type {
  EvidenceItem,
  KnowledgeCard,
  LearningModule,
  LearningTrack,
  StudySession
} from "../../domain/learning/types";

type MarkdownAssetWriterInput = {
  workspaceRoot: string;
  assetsDirectory: string;
};

type WriteResult = {
  relativePath: string;
  created: boolean;
};

type WriteTrackInput = {
  sourceSlug: string;
  track: LearningTrack;
};

type WriteModuleInput = {
  sourceSlug: string;
  slug: string;
  learningModule: LearningModule;
};

type WriteSessionInput = {
  sourceSlug: string;
  slug: string;
  session: StudySession;
};

type WriteKnowledgeCardInput = {
  sourceSlug: string;
  card: KnowledgeCard;
};

type WriteEvidenceInput = {
  sourceSlug: string;
  slug: string;
  evidence: EvidenceItem;
};

type UpdateSessionMetadataInput = {
  relativePath: string;
  session: StudySession;
  evidenceIds: string[];
};

type UpdateKnowledgeCardMetadataInput = {
  relativePath: string;
  card: KnowledgeCard;
};

export function createMarkdownAssetWriter(input: MarkdownAssetWriterInput) {
  const workspaceRoot = resolve(input.workspaceRoot);
  const assetsRoot = resolveAssetRoot(workspaceRoot, input.assetsDirectory);

  return {
    async writeTrack({
      sourceSlug,
      track
    }: WriteTrackInput): Promise<WriteResult> {
      assertSafeSlug(sourceSlug, "sourceSlug");

      return writeNewAsset({
        workspaceRoot,
        absolutePath: join(assetsRoot, sourceSlug, "track.md"),
        metadata: {
          id: track.id,
          title: track.title,
          status: track.status,
          sourceId: track.sourceId,
          learningTopicId: track.learningTopicId,
          objective: track.objective
        },
        body: `# ${track.title}\n\n## Objective\n\n${track.objective}\n\n## Notes\n`
      });
    },

    async writeModule({
      sourceSlug,
      slug,
      learningModule
    }: WriteModuleInput): Promise<WriteResult> {
      assertSafeSlug(sourceSlug, "sourceSlug");
      assertSafeSlug(slug, "slug");
      const sequence = String(learningModule.sequence).padStart(2, "0");

      return writeNewAsset({
        workspaceRoot,
        absolutePath: join(
          assetsRoot,
          sourceSlug,
          "modules",
          `${sequence}-${slug}.md`
        ),
        metadata: {
          id: learningModule.id,
          title: learningModule.title,
          status: learningModule.status,
          trackId: learningModule.trackId,
          sequence: learningModule.sequence,
          expectedOutcome: learningModule.expectedOutcome,
          acceptanceCriteria: learningModule.acceptanceCriteria
        },
        body: `# ${learningModule.title}\n\n## Expected outcome\n\n${learningModule.expectedOutcome}\n\n## Notes\n`
      });
    },

    async writeSession({
      sourceSlug,
      slug,
      session
    }: WriteSessionInput): Promise<WriteResult> {
      assertSafeSlug(sourceSlug, "sourceSlug");
      assertSafeSlug(slug, "slug");
      const date = session.createdAt.slice(0, 10);

      return writeNewAsset({
        workspaceRoot,
        absolutePath: join(
          assetsRoot,
          sourceSlug,
          "sessions",
          `${date}-${slug}.md`
        ),
        metadata: {
          id: session.id,
          title: session.question,
          status: session.status,
          moduleId: session.moduleId,
          planningPeriodId: session.planningPeriodId,
          timeBlockId: session.timeBlockId,
          taskLinkId: session.taskLinkId
        },
        body: `# ${session.question}\n\n## Before\n\n${session.preUnderstanding}\n\n## Attempt\n\n## Evidence\n\n## Outcome\n`
      });
    },

    async writeKnowledgeCard({
      sourceSlug,
      card
    }: WriteKnowledgeCardInput): Promise<WriteResult> {
      assertSafeSlug(sourceSlug, "sourceSlug");
      assertSafeSlug(card.slug, "slug");

      return writeNewAsset({
        workspaceRoot,
        absolutePath: join(
          assetsRoot,
          sourceSlug,
          "knowledge",
          `${card.slug}.md`
        ),
        metadata: {
          id: card.id,
          title: card.title,
          maturity: card.maturity,
          confidence: card.confidence,
          trackId: card.trackId,
          moduleId: card.moduleId,
          sourceIds: card.sourceIds,
          evidenceIds: card.evidenceIds,
          relatedCardIds: card.relatedCardIds
        },
        body: `# ${card.title}\n\n## Summary\n\n${card.summary}\n\n## My explanation\n\n## Minimal example\n\n## Counterexample or failure mode\n\n## Evidence\n\n## Open questions\n`
      });
    },

    async writeEvidence({
      sourceSlug,
      slug,
      evidence
    }: WriteEvidenceInput): Promise<WriteResult> {
      assertSafeSlug(sourceSlug, "sourceSlug");
      assertSafeSlug(slug, "slug");

      return writeNewAsset({
        workspaceRoot,
        absolutePath: join(
          assetsRoot,
          sourceSlug,
          "experiments",
          `${slug}.md`
        ),
        metadata: {
          id: evidence.id,
          title: evidence.title,
          sessionId: evidence.sessionId,
          kind: evidence.kind,
          result: evidence.result,
          reference: evidence.reference
        },
        body: `# ${evidence.title}\n\n## Summary\n\n${evidence.summary}\n`
      });
    },

    async updateSessionMetadata({
      relativePath,
      session,
      evidenceIds
    }: UpdateSessionMetadataInput): Promise<void> {
      const absolutePath = resolveWorkspaceAsset(
        workspaceRoot,
        assetsRoot,
        relativePath
      );
      const contents = await readFile(absolutePath, "utf8");
      const frontmatterMatch = contents.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);

      if (!frontmatterMatch) {
        throw new Error(`Markdown asset has invalid frontmatter: ${relativePath}`);
      }

      const body = contents.slice(frontmatterMatch[0].length);
      const metadata = serializeFrontmatter({
        id: session.id,
        title: session.question,
        status: session.status,
        moduleId: session.moduleId,
        planningPeriodId: session.planningPeriodId,
        timeBlockId: session.timeBlockId,
        taskLinkId: session.taskLinkId,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        evidenceIds,
        updatedAt: session.updatedAt
      });

      await writeFile(absolutePath, `${metadata}\n${body}`, "utf8");
    },

    async updateKnowledgeCardMetadata({
      relativePath,
      card
    }: UpdateKnowledgeCardMetadataInput): Promise<void> {
      const absolutePath = resolveWorkspaceAsset(
        workspaceRoot,
        assetsRoot,
        relativePath
      );
      const contents = await readFile(absolutePath, "utf8");
      const frontmatterMatch = contents.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);

      if (!frontmatterMatch) {
        throw new Error(`Markdown asset has invalid frontmatter: ${relativePath}`);
      }

      const body = contents.slice(frontmatterMatch[0].length);
      const metadata = serializeFrontmatter({
        id: card.id,
        title: card.title,
        maturity: card.maturity,
        confidence: card.confidence,
        trackId: card.trackId,
        moduleId: card.moduleId,
        sourceIds: card.sourceIds,
        evidenceIds: card.evidenceIds,
        relatedCardIds: card.relatedCardIds,
        updatedAt: card.updatedAt
      });

      await writeFile(absolutePath, `${metadata}\n${body}`, "utf8");
    }
  };
}

export type MarkdownAssetWriter = ReturnType<typeof createMarkdownAssetWriter>;

function resolveAssetRoot(
  workspaceRoot: string,
  assetsDirectory: string
): string {
  if (isAbsolute(assetsDirectory)) {
    throw new Error("Learning assets directory must stay inside the workspace.");
  }

  const assetsRoot = resolve(workspaceRoot, assetsDirectory);
  const pathFromWorkspace = relative(workspaceRoot, assetsRoot);

  if (
    !pathFromWorkspace ||
    pathFromWorkspace === ".." ||
    pathFromWorkspace.startsWith(`..${sep}`) ||
    isAbsolute(pathFromWorkspace)
  ) {
    throw new Error("Learning assets directory must stay inside the workspace.");
  }

  return assetsRoot;
}

function assertSafeSlug(value: string, fieldName: string): void {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
    throw new Error(`${fieldName} must be a lowercase URL-safe slug.`);
  }
}

function resolveWorkspaceAsset(
  workspaceRoot: string,
  assetsRoot: string,
  relativePath: string
): string {
  if (isAbsolute(relativePath)) {
    throw new Error("Markdown asset path must be relative to the workspace.");
  }

  const absolutePath = resolve(workspaceRoot, relativePath);
  const pathFromAssets = relative(assetsRoot, absolutePath);

  if (
    !pathFromAssets ||
    pathFromAssets === ".." ||
    pathFromAssets.startsWith(`..${sep}`) ||
    isAbsolute(pathFromAssets)
  ) {
    throw new Error("Markdown asset path must stay inside the assets directory.");
  }

  return absolutePath;
}

async function writeNewAsset(input: {
  workspaceRoot: string;
  absolutePath: string;
  metadata: Record<string, unknown>;
  body: string;
}): Promise<WriteResult> {
  const relativePath = toPosixPath(
    relative(input.workspaceRoot, input.absolutePath)
  );
  const contents = `${serializeFrontmatter(input.metadata)}\n${input.body}`;

  await mkdir(dirname(input.absolutePath), { recursive: true });

  try {
    await writeFile(input.absolutePath, contents, {
      encoding: "utf8",
      flag: "wx"
    });
    return { relativePath, created: true };
  } catch (error) {
    if (isAlreadyExistsError(error)) {
      return { relativePath, created: false };
    }

    throw error;
  }
}

function serializeFrontmatter(metadata: Record<string, unknown>): string {
  const entries = Object.entries(metadata).filter(
    ([, value]) => value !== undefined
  );

  return [
    "---",
    ...entries.map(([key, value]) => `${key}: ${JSON.stringify(value)}`),
    "---"
  ].join("\n");
}

function toPosixPath(value: string): string {
  return value.split(sep).join("/");
}

function isAlreadyExistsError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === "EEXIST"
  );
}
