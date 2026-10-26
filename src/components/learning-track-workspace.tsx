"use client";

import { Play } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import type {
  KnowledgeCard,
  LearningModule,
  LearningSource,
  LearningTrack,
  StudySession
} from "../domain/learning/types";
import type { PlanningPeriod } from "../domain/planning/types";
import { getClientErrorMessage, getJson, postJson } from "../lib/learning/http-client";
import { ErrorBanner, LoadingState, SectionHeading, SubmitButton } from "./learning-workspace";

type TrackDetails = { source: LearningSource; track: LearningTrack; modules: LearningModule[] };
type WeeklyData = { planningPeriods: PlanningPeriod[] };
const fieldClass = "mt-1.5 h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100";

export function LearningTrackWorkspace({ trackId }: { trackId: string }) {
  const [details, setDetails] = useState<TrackDetails>();
  const [cards, setCards] = useState<KnowledgeCard[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [moduleId, setModuleId] = useState("");
  const [planningPeriodId, setPlanningPeriodId] = useState<string>();
  const [slug, setSlug] = useState("");
  const [question, setQuestion] = useState("");
  const [understanding, setUnderstanding] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;
    Promise.all([
      getJson<TrackDetails>(`/api/learning/tracks/${trackId}`),
      getJson<{ cards: KnowledgeCard[] }>(`/api/learning/cards?trackId=${encodeURIComponent(trackId)}`),
      getJson<WeeklyData>("/api/planning/weekly")
    ]).then(([loaded, cardData, weeklyData]) => {
      if (!active) return;
      setDetails(loaded);
      setModuleId(loaded.modules[0]?.id ?? "");
      setCards(cardData.cards);
      setPlanningPeriodId(
        findPlanningPeriod(weeklyData.planningPeriods, getTodayDate())?.id
      );
    }).catch((loadError) => active && setError(getClientErrorMessage(loadError))).finally(() => active && setIsLoading(false));
    return () => { active = false; };
  }, [trackId]);

  async function startSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const created = await postJson<StudySession>("/api/learning/sessions", {
        moduleId, planningPeriodId, slug: slug.trim(), question: question.trim(), preUnderstanding: understanding.trim()
      });
      setSessions((current) => [...current, created]);
      setSlug(""); setQuestion(""); setUnderstanding(""); setError(undefined);
    } catch (submitError) { setError(getClientErrorMessage(submitError)); }
  }

  if (isLoading) return <LoadingState>Loading learning path...</LoadingState>;
  if (!details) return <ErrorBanner message={error ?? "Learning path not found."} />;

  return <div className="space-y-8">
    {error ? <ErrorBanner message={error} /> : null}
    <div className="grid gap-6 border-y border-stone-200 py-5 sm:grid-cols-3">
      <Meta label="Source" value={details.source.title} />
      <Meta label="Revision" value={details.source.revision ?? "Not pinned"} />
      <Meta label="AI guidance" value={details.source.aiGuidance.replaceAll("_", " ")} />
    </div>
    <section className="space-y-4" aria-labelledby="track-modules-heading">
      <SectionHeading eyebrow="Sequence" id="track-modules-heading" title="Modules" />
      <ol className="divide-y divide-stone-200 border-y border-stone-200">
        {details.modules.map((item) => <li className="grid gap-2 py-4 sm:grid-cols-[3rem_1fr_auto] sm:items-start" key={item.id}><span className="text-sm font-semibold text-teal-700">{String(item.sequence).padStart(2, "0")}</span><span><span className="block text-sm font-semibold text-stone-950">{item.title}</span><span className="mt-1 block text-sm text-stone-600">{item.expectedOutcome}</span></span><span className="text-xs font-medium uppercase text-stone-500">{item.status.replaceAll("_", " ")}</span></li>)}
      </ol>
    </section>
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="space-y-4" aria-labelledby="start-session-heading">
        <SectionHeading eyebrow="Focused work" id="start-session-heading" title="Start a session" />
        <form className="space-y-3" onSubmit={startSession}>
          <label className="block text-xs font-medium text-stone-600">Module<select aria-label="Module" className={fieldClass} onChange={(event) => setModuleId(event.target.value)} value={moduleId}>{details.modules.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
          <Field label="Session slug" onChange={setSlug} value={slug} />
          <Field label="Study question" onChange={setQuestion} value={question} />
          <label className="block text-xs font-medium text-stone-600">Current understanding<textarea aria-label="Current understanding" className={`${fieldClass} min-h-20 py-2`} onChange={(event) => setUnderstanding(event.target.value)} value={understanding} /></label>
          <SubmitButton icon={<Play size={16} />} label="Start study session" />
        </form>
        {sessions.map((item) => <a className="block border-l-2 border-teal-600 pl-3 text-sm font-medium text-stone-950" href={`/learning/sessions/${item.id}`} key={item.id}>{item.question}</a>)}
      </section>
      <section className="space-y-4" aria-labelledby="track-cards-heading">
        <SectionHeading eyebrow="Knowledge" id="track-cards-heading" title="Cards" />
        {cards.length ? cards.map((item) => <a className="block border border-stone-200 bg-white/70 p-4" href={`/learning/cards/${item.id}`} key={item.id}><span className="text-sm font-semibold">{item.title}</span><span className="mt-2 block text-xs text-stone-500">{item.maturity} · confidence {item.confidence}/5</span></a>) : <p className="text-sm text-stone-500">No knowledge cards yet.</p>}
      </section>
    </div>
  </div>;
}

function Field({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) { return <label className="block text-xs font-medium text-stone-600">{label}<input aria-label={label} className={fieldClass} onChange={(event) => onChange(event.target.value)} required value={value} /></label>; }
function Meta({ label, value }: { label: string; value: string }) { return <div><p className="text-xs font-medium text-stone-500">{label}</p><p className="mt-1 text-sm font-semibold capitalize text-stone-950">{value}</p></div>; }

function findPlanningPeriod(periods: PlanningPeriod[], date: string) {
  return (
    periods.find((period) => period.startsOn <= date && date <= period.endsOn) ??
    periods.at(-1)
  );
}

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}
