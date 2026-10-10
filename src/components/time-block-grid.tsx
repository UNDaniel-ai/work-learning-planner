"use client";

import { Clock3, Plus } from "lucide-react";
import { useState, type FormEvent } from "react";
import type { TimeBlock } from "../domain/planning/types";

export type CreateTimeBlockFormInput = {
  startsAt: string;
  endsAt: string;
  note?: string;
};

type TimeBlockGridProps = {
  blocks: TimeBlock[];
  onCreateTimeBlock: (
    input: CreateTimeBlockFormInput
  ) => Promise<void> | void;
};

export function TimeBlockGrid({
  blocks,
  onCreateTimeBlock
}: TimeBlockGridProps) {
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [note, setNote] = useState("");

  function submitTimeBlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!startsAt || !endsAt) {
      return;
    }

    void onCreateTimeBlock({
      startsAt,
      endsAt,
      note: note.trim() || undefined
    });
    setStartsAt("");
    setEndsAt("");
    setNote("");
  }

  return (
    <div className="space-y-4">
      {blocks.length > 0 ? (
        <ul className="divide-y divide-stone-200 border border-stone-200 bg-white/60">
          {blocks.map((block) => (
            <li
              className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              key={block.id}
            >
              <div className="flex min-w-0 items-start gap-3">
                <Clock3
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-teal-700"
                  size={18}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-stone-950">
                    {formatTime(block.startsAt)}–{formatTime(block.endsAt)}
                  </p>
                  {block.note ? (
                    <p className="mt-1 truncate text-xs text-stone-500">
                      {block.note}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-xs text-stone-500">
                <span>{block.durationMinutes} min planned</span>
                {block.actualMinutes !== undefined ? (
                  <span>{block.actualMinutes} min actual</span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="border border-dashed border-stone-300 px-4 py-5 text-sm text-stone-500">
          No time blocks scheduled.
        </p>
      )}

      <form
        className="grid gap-3 border-t border-stone-200 pt-4 sm:grid-cols-2"
        onSubmit={submitTimeBlock}
      >
        <div>
          <label
            className="text-xs font-medium text-stone-600"
            htmlFor="time-block-start"
          >
            Start
          </label>
          <input
            className="mt-1.5 h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-950 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            id="time-block-start"
            onChange={(event) => setStartsAt(event.target.value)}
            type="time"
            value={startsAt}
          />
        </div>
        <div>
          <label
            className="text-xs font-medium text-stone-600"
            htmlFor="time-block-end"
          >
            End
          </label>
          <input
            className="mt-1.5 h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-950 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            id="time-block-end"
            onChange={(event) => setEndsAt(event.target.value)}
            type="time"
            value={endsAt}
          />
        </div>
        <div className="sm:col-span-2">
          <label
            className="text-xs font-medium text-stone-600"
            htmlFor="time-block-note"
          >
            Note
          </label>
          <input
            className="mt-1.5 h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-950 outline-none placeholder:text-stone-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            id="time-block-note"
            onChange={(event) => setNote(event.target.value)}
            placeholder="Deep work, reading, practice..."
            value={note}
          />
        </div>
        <div className="sm:col-span-2">
          <button
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-stone-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            type="submit"
          >
            <Plus aria-hidden="true" size={16} />
            Add time block
          </button>
        </div>
      </form>
    </div>
  );
}

function formatTime(value: string): string {
  const match = value.match(/T(\d{2}:\d{2})/);

  return match?.[1] ?? value;
}
