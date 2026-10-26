"use client";

import { Check, FlaskConical, Play, Save, ShieldCheck } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import type { AICoachEvent, AICoachMode, EvidenceItem, EvidenceResult, KnowledgeCard, LearningModule, LearningSource, LearningTrack, ReviewItem, StudySession } from "../domain/learning/types";
import { getClientErrorMessage, getJson, patchJson, postJson } from "../lib/learning/http-client";
import { ErrorBanner, LoadingState, SectionHeading, SubmitButton } from "./learning-workspace";

type SessionDetails = { module: LearningModule; session: StudySession; evidence: EvidenceItem[]; coachEvents: AICoachEvent[] };
type TrackDetails = { source: LearningSource; track: LearningTrack; modules: LearningModule[] };
type AllowedCoachMode = Exclude<AICoachMode, "direct_solution">;
const coachModes: { value: AllowedCoachMode; label: string }[] = [
  { value: "socratic", label: "Socratic questions" },
  { value: "concept_hint", label: "Concept hint" },
  { value: "debug_guide", label: "Debug guide" },
  { value: "code_review", label: "Code review" },
  { value: "synthesis", label: "Synthesis" },
  { value: "recall_quiz", label: "Recall quiz" }
];
const inputClass = "mt-1.5 h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100";

export function StudySessionWorkspace({ sessionId }: { sessionId: string }) {
  const [details, setDetails] = useState<SessionDetails>();
  const [trackDetails, setTrackDetails] = useState<TrackDetails>();
  const [promotedCard, setPromotedCard] = useState<KnowledgeCard>();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);
  const [evidenceTitle, setEvidenceTitle] = useState("");
  const [evidenceSlug, setEvidenceSlug] = useState("");
  const [evidenceSummary, setEvidenceSummary] = useState("");
  const [evidenceReference, setEvidenceReference] = useState("");
  const [evidenceResult, setEvidenceResult] = useState<EvidenceResult>("pass");
  const [cardTitle, setCardTitle] = useState("");
  const [cardSlug, setCardSlug] = useState("");
  const [cardSummary, setCardSummary] = useState("");
  const [reviewPrompt, setReviewPrompt] = useState("");
  const [coachMode, setCoachMode] = useState<AllowedCoachMode>("socratic");
  const [coachInputSummary, setCoachInputSummary] = useState("");
  const [coachOutputSummary, setCoachOutputSummary] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const sessionData = await getJson<SessionDetails>(`/api/learning/sessions/${sessionId}`);
        const pathData = await getJson<TrackDetails>(`/api/learning/tracks/${sessionData.module.trackId}`);
        if (active) {
          setDetails({ ...sessionData, coachEvents: sessionData.coachEvents ?? [] });
          setTrackDetails(pathData);
        }
      } catch (loadError) { if (active) setError(getClientErrorMessage(loadError)); }
      finally { if (active) setIsLoading(false); }
    }
    void load(); return () => { active = false; };
  }, [sessionId]);

  async function changeStatus(status: "active" | "completed") {
    if (!details) return;
    try {
      const updated = await patchJson<StudySession>(`/api/learning/sessions/${sessionId}`, {
        status,
        outcome: status === "completed" ? details.session.outcome ?? "Evidence recorded." : undefined
      });
      setDetails({ ...details, session: updated });
    } catch (submitError) { setError(getClientErrorMessage(submitError)); }
  }

  async function addEvidence(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!details) return;
    try {
      const created = await postJson<EvidenceItem>(`/api/learning/sessions/${sessionId}/evidence`, {
        slug: evidenceSlug.trim(), kind: "toy_example", title: evidenceTitle.trim(), summary: evidenceSummary.trim(), reference: evidenceReference.trim(), result: evidenceResult
      });
      setDetails({ ...details, evidence: [...details.evidence, created] });
      setEvidenceTitle(""); setEvidenceSlug(""); setEvidenceSummary(""); setEvidenceReference("");
      setEvidenceResult("pass");
    } catch (submitError) { setError(getClientErrorMessage(submitError)); }
  }

  async function promoteCard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!details || !trackDetails) return;
    try {
      const result = await postJson<{ card: KnowledgeCard; reviewItem: ReviewItem }>("/api/learning/cards", {
        sessionId, slug: cardSlug.trim(), title: cardTitle.trim(), sourceIds: [trackDetails.source.id], evidenceIds: details.evidence.map((item) => item.id), summary: cardSummary.trim(), confidence: 3, reviewPrompt: reviewPrompt.trim()
      });
      setPromotedCard(result.card);
    } catch (submitError) { setError(getClientErrorMessage(submitError)); }
  }

  async function recordCoachInteraction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!details) return;
    try {
      const created = await postJson<AICoachEvent>("/api/learning/coach-events", {
        sessionId,
        mode: coachMode,
        requestedAction: "guidance",
        inputSummary: coachInputSummary.trim(),
        outputSummary: coachOutputSummary.trim()
      });
      setDetails({
        ...details,
        coachEvents: [...details.coachEvents, created]
      });
      setCoachInputSummary("");
      setCoachOutputSummary("");
    } catch (submitError) { setError(getClientErrorMessage(submitError)); }
  }

  if (isLoading) return <LoadingState>Loading study session...</LoadingState>;
  if (!details) return <ErrorBanner message={error ?? "Study session not found."} />;

  return <div className="space-y-8">
    {error ? <ErrorBanner message={error} /> : null}
    <div className="flex flex-wrap items-center justify-between gap-4 border-y border-stone-200 py-4"><div><p className="text-xs font-medium text-stone-500">{details.module.title}</p><p className="mt-1 text-sm text-stone-700">{details.session.preUnderstanding}</p></div><div className="flex gap-2"><button className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 text-sm" onClick={() => void changeStatus("active")} type="button"><Play size={15} />Start</button><button className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-stone-950 px-3 text-sm text-white" onClick={() => void changeStatus("completed")} type="button"><Check size={15} />Complete</button></div></div>
    <section className="space-y-4" aria-labelledby="evidence-heading"><SectionHeading eyebrow="Verification" id="evidence-heading" title="Evidence" />
      <ul className="divide-y divide-stone-200 border-y border-stone-200">{details.evidence.map((item) => <li className="py-4" key={item.id}><div className="flex justify-between gap-4"><span className="text-sm font-semibold text-stone-950">{item.title}</span><span className="text-xs font-medium uppercase text-teal-700">{item.result}</span></div><p className="mt-1 text-sm text-stone-600">{item.summary}</p><code className="mt-2 block break-all text-xs text-stone-500">{item.reference}</code></li>)}</ul>
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={addEvidence}><Field label="Evidence title" value={evidenceTitle} onChange={setEvidenceTitle} /><Field label="Evidence slug" value={evidenceSlug} onChange={setEvidenceSlug} /><Area label="Evidence summary" value={evidenceSummary} onChange={setEvidenceSummary} /><Area label="Evidence reference" value={evidenceReference} onChange={setEvidenceReference} /><label className="text-xs font-medium text-stone-600">Evidence result<select aria-label="Evidence result" className={inputClass} onChange={(event) => setEvidenceResult(event.target.value as EvidenceResult)} value={evidenceResult}>{["pass", "fail", "observed", "unknown"].map((result) => <option key={result} value={result}>{result}</option>)}</select></label><div className="sm:col-span-2"><SubmitButton icon={<FlaskConical size={16} />} label="Add evidence" /></div></form>
    </section>
    <section className="space-y-4 border-t border-stone-200 pt-8" aria-labelledby="coach-heading">
      <SectionHeading eyebrow="AI boundary" id="coach-heading" title="Coach-only boundary" />
      <p className="max-w-3xl text-sm leading-6 text-stone-600">
        {trackDetails?.source.aiGuidance === "coach_only"
          ? "Hints, questions, debugging guidance, review, synthesis, and recall are allowed. Direct solutions, TODO completion, assignment edits, and command execution are blocked."
          : "Coach interactions follow this learning source's AI guidance setting."}
      </p>
      {details.coachEvents.length > 0 ? <ul className="divide-y divide-stone-200 border-y border-stone-200">{details.coachEvents.map((event) => <li className="py-4" key={event.id}><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-semibold capitalize text-stone-950">{event.mode.replaceAll("_", " ")}</span><span className={`text-xs font-medium uppercase ${event.boundary === "allowed" ? "text-teal-700" : "text-red-700"}`}>{event.boundary}</span></div><p className="mt-1 text-sm text-stone-600">{event.outputSummary}</p></li>)}</ul> : null}
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={recordCoachInteraction}>
        <label className="text-xs font-medium text-stone-600">Coach mode<select aria-label="Coach mode" className={inputClass} onChange={(event) => setCoachMode(event.target.value as AllowedCoachMode)} value={coachMode}>{coachModes.map((mode) => <option key={mode.value} value={mode.value}>{mode.label}</option>)}</select></label>
        <div className="hidden sm:block" />
        <Area label="Coach request summary" value={coachInputSummary} onChange={setCoachInputSummary} />
        <Area label="Coach output summary" value={coachOutputSummary} onChange={setCoachOutputSummary} />
        <div className="sm:col-span-2"><SubmitButton icon={<ShieldCheck size={16} />} label="Record coach interaction" /></div>
      </form>
    </section>
    <section className="space-y-4 border-t border-stone-200 pt-8" aria-labelledby="promote-card-heading"><SectionHeading eyebrow="Synthesis" id="promote-card-heading" title="Promote a knowledge card" />
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={promoteCard}><Field label="Card title" value={cardTitle} onChange={setCardTitle} /><Field label="Card slug" value={cardSlug} onChange={setCardSlug} /><Area label="Card summary" value={cardSummary} onChange={setCardSummary} /><Area label="Review prompt" value={reviewPrompt} onChange={setReviewPrompt} /><div className="sm:col-span-2"><SubmitButton icon={<Save size={16} />} label="Promote knowledge card" /></div></form>
      {promotedCard ? <a className="inline-block border-l-2 border-teal-600 pl-3 text-sm font-semibold text-stone-950" href={`/learning/cards/${promotedCard.id}`}>{promotedCard.title}</a> : null}
    </section>
  </div>;
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="text-xs font-medium text-stone-600">{label}<input aria-label={label} className={inputClass} onChange={(event) => onChange(event.target.value)} required value={value} /></label>; }
function Area({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="text-xs font-medium text-stone-600">{label}<textarea aria-label={label} className={`${inputClass} min-h-20 py-2`} onChange={(event) => onChange(event.target.value)} required value={value} /></label>; }
