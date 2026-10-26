"use client";

import { BookPlus, Brain, Plus } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import type {
  LearningSource,
  LearningTrack,
  ReviewItem
} from "../domain/learning/types";
import {
  getClientErrorMessage,
  getJson,
  postJson
} from "../lib/learning/http-client";

type TrackCreationResult = {
  track: LearningTrack;
};

const fieldClass =
  "mt-1.5 h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-950 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100";
const textareaClass =
  "mt-1.5 min-h-20 w-full resize-y rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-950 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100";

export function LearningWorkspace() {
  const [sources, setSources] = useState<LearningSource[]>([]);
  const [tracks, setTracks] = useState<LearningTrack[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [sourceTitle, setSourceTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceRevision, setSourceRevision] = useState("");
  const [selectedSourceId, setSelectedSourceId] = useState("");
  const [sourceSlug, setSourceSlug] = useState("");
  const [pathTitle, setPathTitle] = useState("");
  const [objective, setObjective] = useState("");
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleSlug, setModuleSlug] = useState("");
  const [expectedOutcome, setExpectedOutcome] = useState("");
  const [acceptanceCriterion, setAcceptanceCriterion] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [sourceData, trackData, reviewData] = await Promise.all([
          getJson<{ sources: LearningSource[] }>("/api/learning/sources"),
          getJson<{ tracks: LearningTrack[] }>("/api/learning/tracks"),
          getJson<{ reviewItems: ReviewItem[] }>("/api/learning/reviews")
        ]);

        if (!active) return;
        setSources(sourceData.sources);
        setSelectedSourceId(sourceData.sources[0]?.id ?? "");
        setTracks(trackData.tracks);
        setReviews(reviewData.reviewItems);
      } catch (loadError) {
        if (active) setError(getClientErrorMessage(loadError));
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  async function addSource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const created = await postJson<LearningSource>("/api/learning/sources", {
        title: sourceTitle.trim(),
        kind: "repo",
        url: sourceUrl.trim(),
        revision: sourceRevision.trim() || undefined,
        aiGuidance: "coach_only"
      });
      setSources((current) => [...current, created]);
      setSelectedSourceId(created.id);
      setSourceTitle("");
      setSourceUrl("");
      setSourceRevision("");
      setError(undefined);
    } catch (submitError) {
      setError(getClientErrorMessage(submitError));
    }
  }

  async function createTrack(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const result = await postJson<TrackCreationResult>(
        "/api/learning/tracks",
        {
          sourceId: selectedSourceId,
          sourceSlug: sourceSlug.trim(),
          title: pathTitle.trim(),
          objective: objective.trim(),
          modules: [
            {
              slug: moduleSlug.trim(),
              title: moduleTitle.trim(),
              sequence: 1,
              expectedOutcome: expectedOutcome.trim(),
              acceptanceCriteria: [acceptanceCriterion.trim()]
            }
          ]
        }
      );
      setTracks((current) => [...current, result.track]);
      setPathTitle("");
      setObjective("");
      setModuleTitle("");
      setModuleSlug("");
      setExpectedOutcome("");
      setAcceptanceCriterion("");
      setError(undefined);
    } catch (submitError) {
      setError(getClientErrorMessage(submitError));
    }
  }

  if (isLoading) {
    return <LoadingState>Loading learning workspace...</LoadingState>;
  }

  return (
    <div className="space-y-8">
      {error ? <ErrorBanner message={error} /> : null}

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section aria-labelledby="learning-paths-heading" className="space-y-4">
          <SectionHeading
            eyebrow="Active paths"
            id="learning-paths-heading"
            title="Learning paths"
          />
          {tracks.length ? (
            <ul className="divide-y divide-stone-200 border-y border-stone-200">
              {tracks.map((track) => (
                <li className="py-4" key={track.id}>
                  <a
                    className="group flex items-center justify-between gap-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700"
                    href={`/learning/${track.id}`}
                  >
                    <span>
                      <span className="block text-sm font-semibold text-stone-950 group-hover:text-teal-800">
                        {track.title}
                      </span>
                      <span className="mt-1 block text-sm text-stone-600">
                        {track.objective}
                      </span>
                    </span>
                    <span className="text-xs font-medium uppercase text-teal-700">
                      {track.status}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyLine>No learning paths yet.</EmptyLine>
          )}
        </section>

        <section aria-labelledby="review-queue-heading" className="space-y-4">
          <SectionHeading
            eyebrow="Active recall"
            id="review-queue-heading"
            title="Review queue"
          />
          {reviews.length ? (
            <ul className="space-y-2">
              {reviews.map((review) => (
                <li className="border border-stone-200 bg-white/70 p-4" key={review.id}>
                  <a
                    className="text-sm font-medium text-stone-950 hover:text-teal-800"
                    href={`/learning/cards/${review.knowledgeCardId}`}
                  >
                    {review.prompt}
                  </a>
                  <p className="mt-2 text-xs text-stone-500">
                    Due {formatDate(review.nextReviewAt)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyLine>No cards due.</EmptyLine>
          )}
        </section>
      </div>

      <div className="grid gap-8 border-t border-stone-200 pt-8 lg:grid-cols-2">
        <section aria-labelledby="new-source-heading" className="space-y-4">
          <IconHeading
            icon={<BookPlus aria-hidden="true" size={17} />}
            id="new-source-heading"
            title="Add a source"
          />
          <form className="space-y-3" onSubmit={addSource}>
            <TextField label="Source title" onChange={setSourceTitle} required value={sourceTitle} />
            <TextField label="Source URL" onChange={setSourceUrl} required type="url" value={sourceUrl} />
            <TextField label="Revision" onChange={setSourceRevision} value={sourceRevision} />
            <SubmitButton icon={<Plus size={16} />} label="Add source" />
          </form>
        </section>

        <section aria-labelledby="new-path-heading" className="space-y-4">
          <IconHeading
            icon={<Brain aria-hidden="true" size={17} />}
            id="new-path-heading"
            title="Create a learning path"
          />
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={createTrack}>
            <label className="text-xs font-medium text-stone-600 sm:col-span-2">
              Learning source
              <select
                className={fieldClass}
                onChange={(event) => setSelectedSourceId(event.target.value)}
                required
                value={selectedSourceId}
              >
                <option disabled value="">Select a source</option>
                {sources.map((item) => (
                  <option key={item.id} value={item.id}>{item.title}</option>
                ))}
              </select>
            </label>
            <TextField label="Path title" onChange={setPathTitle} required value={pathTitle} />
            <TextField label="Source slug" onChange={setSourceSlug} required value={sourceSlug} />
            <TextArea label="Learning objective" onChange={setObjective} required value={objective} />
            <TextField label="Initial module title" onChange={setModuleTitle} required value={moduleTitle} />
            <TextField label="Module slug" onChange={setModuleSlug} required value={moduleSlug} />
            <TextArea label="Expected outcome" onChange={setExpectedOutcome} required value={expectedOutcome} />
            <TextArea label="Acceptance criterion" onChange={setAcceptanceCriterion} required value={acceptanceCriterion} />
            <div className="sm:col-span-2">
              <SubmitButton icon={<Plus size={16} />} label="Create learning path" />
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

function TextField({ label, onChange, required = false, type = "text", value }: {
  label: string; onChange: (value: string) => void; required?: boolean; type?: string; value: string;
}) {
  return <label className="text-xs font-medium text-stone-600">{label}<input aria-label={label} className={fieldClass} onChange={(event) => onChange(event.target.value)} required={required} type={type} value={value} /></label>;
}

function TextArea({ label, onChange, required = false, value }: {
  label: string; onChange: (value: string) => void; required?: boolean; value: string;
}) {
  return <label className="text-xs font-medium text-stone-600">{label}<textarea aria-label={label} className={textareaClass} onChange={(event) => onChange(event.target.value)} required={required} value={value} /></label>;
}

export function SubmitButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return <button className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-stone-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700" type="submit">{icon}{label}</button>;
}

export function SectionHeading({ eyebrow, id, title }: { eyebrow: string; id: string; title: string }) {
  return <div><p className="text-xs font-medium text-stone-500">{eyebrow}</p><h2 className="mt-1 text-xl font-semibold text-stone-950" id={id}>{title}</h2></div>;
}

function IconHeading({ icon, id, title }: { icon: React.ReactNode; id: string; title: string }) {
  return <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700">{icon}</span><h2 className="text-lg font-semibold text-stone-950" id={id}>{title}</h2></div>;
}

export function ErrorBanner({ message }: { message: string }) {
  return <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{message}</p>;
}

export function LoadingState({ children }: { children: React.ReactNode }) {
  return <p className="border border-stone-200 bg-white/60 px-4 py-5 text-sm text-stone-500">{children}</p>;
}

function EmptyLine({ children }: { children: React.ReactNode }) {
  return <p className="border border-dashed border-stone-300 px-4 py-5 text-sm text-stone-500">{children}</p>;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(value));
}
