import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { LearningSessionSummary } from "../domain/learning/types";

type LearningSessionSummaryListProps = {
  sessions: LearningSessionSummary[];
  emptyMessage: string;
  linkLabel: string;
};

export function LearningSessionSummaryList({
  sessions,
  emptyMessage,
  linkLabel
}: LearningSessionSummaryListProps) {
  if (sessions.length === 0) {
    return (
      <p className="border border-dashed border-stone-300 px-4 py-5 text-sm text-stone-500">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-stone-200 border border-stone-200 bg-white/60">
      {sessions.map(({ session, module }) => (
        <li
          className="flex min-w-0 flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
          key={session.id}
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-stone-950">
                {module.title}
              </p>
              <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium capitalize text-teal-800">
                {session.status}
              </span>
            </div>
            <p className="mt-1 break-words text-sm text-stone-600">
              {session.question}
            </p>
          </div>
          <Link
            className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-teal-700 hover:text-teal-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            href={`/learning/sessions/${session.id}`}
          >
            {linkLabel}
            <ArrowRight aria-hidden="true" size={15} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
