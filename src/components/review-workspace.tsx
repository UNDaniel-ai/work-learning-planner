"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  PlanningPeriod,
  Review
} from "../domain/planning/types";
import {
  ReviewForm,
  type ReviewFormInput
} from "./review-form";

type WeeklyResponse = {
  planningPeriods: PlanningPeriod[];
};

type ReviewsResponse = {
  reviews: Review[];
};

type ReviewWorkspaceProps = {
  date: string;
};

export function ReviewWorkspace({ date }: ReviewWorkspaceProps) {
  const [periods, setPeriods] = useState<PlanningPeriod[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();

  const currentPeriod = useMemo(
    () => findPlanningPeriod(periods, date),
    [date, periods]
  );

  useEffect(() => {
    let isActive = true;

    async function loadReviewData() {
      try {
        const weeklyData = await getJson<WeeklyResponse>(
          "/api/planning/weekly"
        );
        const loadedPeriod = findPlanningPeriod(
          weeklyData.planningPeriods,
          date
        );
        const reviewData = loadedPeriod
          ? await getJson<ReviewsResponse>(
              `/api/planning/reviews?periodId=${encodeURIComponent(
                loadedPeriod.id
              )}`
            )
          : { reviews: [] };

        if (!isActive) {
          return;
        }

        setPeriods(weeklyData.planningPeriods);
        setReviews(reviewData.reviews);
        setError(undefined);
      } catch (loadError) {
        if (isActive) {
          setError(getErrorMessage(loadError));
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadReviewData();

    return () => {
      isActive = false;
    };
  }, [date]);

  async function saveReview(input: ReviewFormInput) {
    if (!currentPeriod) {
      return;
    }

    const review = await postJson<Review>("/api/planning/reviews", {
      periodId: currentPeriod.id,
      type: input.type,
      date: input.type === "daily" ? date : undefined,
      wins: input.wins,
      misses: input.misses,
      adjustments: input.adjustments,
      actualMinutes: input.actualMinutes
    });

    setReviews((currentReviews) => [...currentReviews, review]);
    setError(undefined);
  }

  if (isLoading) {
    return (
      <p className="border border-stone-200 bg-white/60 px-4 py-5 text-sm text-stone-500">
        Loading review...
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {error ? (
        <p
          className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {!currentPeriod ? (
        <p className="border border-dashed border-stone-300 px-4 py-5 text-sm text-stone-500">
          Create a weekly plan before recording a review.
        </p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <section
            aria-labelledby="review-heading"
            className="space-y-4 border border-stone-200 bg-white/60 p-5"
          >
            <div>
              <p className="text-xs font-medium text-stone-500">
                Weekly review
              </p>
              <h2
                className="mt-1 text-xl font-semibold text-stone-950"
                id="review-heading"
              >
                Close the loop
              </h2>
            </div>
            <ReviewForm onSubmit={saveReview} />
          </section>

          <section
            aria-labelledby="review-history-heading"
            className="space-y-3"
          >
            <div>
              <p className="text-xs font-medium text-stone-500">
                Recorded reviews
              </p>
              <h2
                className="mt-1 text-xl font-semibold text-stone-950"
                id="review-history-heading"
              >
                Plan versus actual
              </h2>
            </div>
            {reviews.length > 0 ? (
              <ul className="divide-y divide-stone-200 border border-stone-200 bg-white/60">
                {reviews.map((review) => (
                  <li className="space-y-2 px-4 py-4" key={review.id}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium capitalize text-stone-950">
                        {review.type} review
                      </span>
                      <span className="text-sm font-semibold text-teal-700">
                        {formatVariance(review.varianceMinutes)}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500">
                      {review.plannedMinutes} min planned /{" "}
                      {review.actualMinutes} min actual
                    </p>
                    {review.wins.length > 0 ? (
                      <p className="text-sm text-stone-700">
                        {review.wins.join(" · ")}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="border border-dashed border-stone-300 px-4 py-5 text-sm text-stone-500">
                No review recorded yet.
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

  return readJson<T>(response);
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  return readJson<T>(response);
}

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Planning API request failed with ${response.status}.`);
  }

  return response.json() as Promise<T>;
}

function findPlanningPeriod(
  periods: PlanningPeriod[],
  date: string
): PlanningPeriod | undefined {
  return (
    periods.find((period) => period.startsOn <= date && date <= period.endsOn) ??
    periods.at(-1)
  );
}

function formatVariance(minutes: number): string {
  return `${minutes > 0 ? "+" : ""}${minutes} min`;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Review failed to load.";
}
