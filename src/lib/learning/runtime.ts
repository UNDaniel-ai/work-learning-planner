import {
  createLearningUseCases,
  type LearningUseCases
} from "../../domain/learning/use-cases";
import {
  createLearningRepository,
  type LearningRepository
} from "../db/learning-repositories";
import { getConfig } from "../config";
import {
  getPlanningRuntime,
  type RuntimeInput
} from "../planning/runtime";
import {
  createMarkdownAssetWriter,
  type MarkdownAssetWriter
} from "./markdown-assets";

export type LearningRuntime = {
  repository: LearningRepository;
  useCases: LearningUseCases;
  writer: MarkdownAssetWriter;
};

export async function getLearningRuntime(
  input?: RuntimeInput
): Promise<LearningRuntime> {
  const planningRuntime = await getPlanningRuntime(input);
  const repository = createLearningRepository(planningRuntime.connection.db);
  const writer = createMarkdownAssetWriter({
    workspaceRoot: process.cwd(),
    assetsDirectory: getConfig().learningAssetsDirectory
  });

  return {
    repository,
    writer,
    useCases: createLearningUseCases({
      repository,
      planningRepository: planningRuntime.repository,
      writer
    })
  };
}
