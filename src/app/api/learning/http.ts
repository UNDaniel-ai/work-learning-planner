import { LearningUseCaseError } from "../../../domain/learning/use-cases";

export function learningErrorResponse(error: unknown): Response {
  if (error instanceof LearningUseCaseError) {
    const notFoundCodes = new Set([
      "LEARNING_SOURCE_NOT_FOUND",
      "LEARNING_TOPIC_NOT_FOUND",
      "LEARNING_TRACK_NOT_FOUND",
      "LEARNING_MODULE_NOT_FOUND",
      "STUDY_SESSION_NOT_FOUND",
      "KNOWLEDGE_CARD_NOT_FOUND",
      "REVIEW_ITEM_NOT_FOUND"
    ]);

    return Response.json(
      {
        ok: false,
        error: error.message,
        code: error.code
      },
      {
        status:
          error.code === "DUPLICATE_LEARNING_ID"
            ? 409
            : notFoundCodes.has(error.code)
              ? 404
              : 422
      }
    );
  }

  if (error instanceof Error) {
    return Response.json(
      {
        ok: false,
        error: error.message
      },
      { status: 400 }
    );
  }

  return Response.json(
    {
      ok: false,
      error: "Learning request failed."
    },
    { status: 500 }
  );
}
