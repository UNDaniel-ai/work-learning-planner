"use client";

import { ArrowUp, Save } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { EvidenceItem, KnowledgeCard, KnowledgeMaturity, ReviewItem } from "../domain/learning/types";
import { getClientErrorMessage, getJson, patchJson, postJson } from "../lib/learning/http-client";
import { ErrorBanner, LoadingState, SectionHeading, SubmitButton } from "./learning-workspace";

type CardDetails = { card: KnowledgeCard; evidence: EvidenceItem[]; reviewItems: ReviewItem[] };
const maturityOrder: KnowledgeMaturity[] = ["observed", "understood", "verified", "applied", "teachable"];
const fieldClass = "mt-1.5 h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100";

export function KnowledgeCardWorkspace({ cardId }: { cardId: string }) {
  const [details, setDetails] = useState<CardDetails>();
  const [answer, setAnswer] = useState("");
  const [score, setScore] = useState("3");
  const [errorType, setErrorType] = useState("");
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);
  const nextMaturity = useMemo(() => details ? maturityOrder[maturityOrder.indexOf(details.card.maturity) + 1] : undefined, [details]);

  useEffect(() => { let active = true; getJson<CardDetails>(`/api/learning/cards/${cardId}`).then((data) => active && setDetails(data)).catch((loadError) => active && setError(getClientErrorMessage(loadError))).finally(() => active && setIsLoading(false)); return () => { active = false; }; }, [cardId]);

  async function saveRecall(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!details?.reviewItems[0]) return;
    try { const updated = await postJson<ReviewItem>("/api/learning/reviews", { id: details.reviewItems[0].id, answer: answer.trim(), ease: Number(score), errorType: errorType.trim() || undefined }); setDetails({ ...details, reviewItems: details.reviewItems.map((item) => item.id === updated.id ? updated : item) }); setAnswer(""); setErrorType(""); } catch (submitError) { setError(getClientErrorMessage(submitError)); }
  }

  async function advanceMaturity() { if (!details || !nextMaturity) return; try { const updated = await patchJson<KnowledgeCard>(`/api/learning/cards/${cardId}`, { maturity: nextMaturity, confidence: Math.min(5, details.card.confidence + 1) }); setDetails({ ...details, card: updated }); } catch (submitError) { setError(getClientErrorMessage(submitError)); } }

  if (isLoading) return <LoadingState>Loading knowledge card...</LoadingState>;
  if (!details) return <ErrorBanner message={error ?? "Knowledge card not found."} />;
  const activeReview = details.reviewItems[0];

  return <div className="space-y-8">{error ? <ErrorBanner message={error} /> : null}
    <div className="grid gap-4 border-y border-stone-200 py-5 sm:grid-cols-3"><Meta label="Maturity" value={details.card.maturity} /><Meta label="Confidence" value={`${details.card.confidence}/5`} /><Meta label="Evidence" value={String(details.evidence.length)} /></div>
    <section className="space-y-4" aria-labelledby="card-summary-heading"><SectionHeading eyebrow="Knowledge" id="card-summary-heading" title="Summary" /><p className="max-w-3xl text-sm leading-7 text-stone-700">{details.card.summary}</p>{nextMaturity ? <button className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 text-sm font-medium" onClick={() => void advanceMaturity()} type="button"><ArrowUp size={16} />Advance to {nextMaturity}</button> : null}</section>
    <section className="space-y-4" aria-labelledby="card-evidence-heading"><SectionHeading eyebrow="Proof" id="card-evidence-heading" title="Evidence" /><ul className="divide-y divide-stone-200 border-y border-stone-200">{details.evidence.map((item) => <li className="py-4" key={item.id}><p className="text-sm font-semibold text-stone-950">{item.title}</p><p className="mt-1 text-sm text-stone-600">{item.summary}</p></li>)}</ul></section>
    {activeReview ? <section className="space-y-4 border-t border-stone-200 pt-8" aria-labelledby="active-recall-heading"><SectionHeading eyebrow="Active recall" id="active-recall-heading" title={activeReview.prompt} /><form className="grid gap-3 sm:grid-cols-[1fr_10rem]" onSubmit={saveRecall}><label className="text-xs font-medium text-stone-600">Recall answer<textarea aria-label="Recall answer" className={`${fieldClass} min-h-24 py-2`} onChange={(event) => setAnswer(event.target.value)} required value={answer} /></label><div className="space-y-3"><label className="block text-xs font-medium text-stone-600">Recall score<select aria-label="Recall score" className={fieldClass} onChange={(event) => setScore(event.target.value)} value={score}>{[1,2,3,4,5].map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label className="block text-xs font-medium text-stone-600">Error type<input aria-label="Error type" className={fieldClass} onChange={(event) => setErrorType(event.target.value)} value={errorType} /></label></div><div className="sm:col-span-2"><SubmitButton icon={<Save size={16} />} label="Save recall" /></div></form><p className="text-sm text-stone-600">Next review {formatDate(activeReview.nextReviewAt)}</p></section> : null}
  </div>;
}

function Meta({ label, value }: { label: string; value: string }) { return <div><p className="text-xs font-medium text-stone-500">{label}</p><p className="mt-1 text-sm font-semibold capitalize text-stone-950">{value}</p></div>; }
function formatDate(value: string) { return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(value)); }
