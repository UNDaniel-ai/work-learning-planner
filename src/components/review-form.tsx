"use client";

import { Save } from "lucide-react";
import { useState, type FormEvent } from "react";
import type { ReviewType } from "../domain/planning/types";

export type ReviewFormInput = {
  type: ReviewType;
  wins: string[];
  misses: string[];
  adjustments: string[];
  actualMinutes?: number;
};

type ReviewFormProps = {
  onSubmit: (input: ReviewFormInput) => Promise<void> | void;
};

export function ReviewForm({ onSubmit }: ReviewFormProps) {
  const [type, setType] = useState<ReviewType>("weekly");
  const [wins, setWins] = useState("");
  const [misses, setMisses] = useState("");
  const [adjustments, setAdjustments] = useState("");
  const [actualMinutes, setActualMinutes] = useState("");

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedActualMinutes =
      actualMinutes === "" ? undefined : Number(actualMinutes);

    await onSubmit({
      type,
      wins: splitNotes(wins),
      misses: splitNotes(misses),
      adjustments: splitNotes(adjustments),
      actualMinutes:
        parsedActualMinutes === undefined ||
        !Number.isInteger(parsedActualMinutes)
          ? undefined
          : parsedActualMinutes
    });
    setWins("");
    setMisses("");
    setAdjustments("");
    setActualMinutes("");
  }

  return (
    <form className="space-y-4" onSubmit={submitReview}>
      <div>
        <label
          className="text-xs font-medium text-stone-600"
          htmlFor="review-type"
        >
          Review type
        </label>
        <select
          className="mt-1.5 h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-950 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          id="review-type"
          onChange={(event) => setType(event.target.value as ReviewType)}
          value={type}
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </select>
      </div>

      <NoteField
        id="review-wins"
        label="Wins"
        onChange={setWins}
        placeholder="One win per line"
        value={wins}
      />
      <NoteField
        id="review-misses"
        label="Misses"
        onChange={setMisses}
        placeholder="One miss per line"
        value={misses}
      />
      <NoteField
        id="review-adjustments"
        label="Adjustments"
        onChange={setAdjustments}
        placeholder="One adjustment per line"
        value={adjustments}
      />

      <div>
        <label
          className="text-xs font-medium text-stone-600"
          htmlFor="review-actual-minutes"
        >
          Actual minutes
        </label>
        <input
          className="mt-1.5 h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-950 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          id="review-actual-minutes"
          min="0"
          onChange={(event) => setActualMinutes(event.target.value)}
          type="number"
          value={actualMinutes}
        />
      </div>

      <button
        className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-stone-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
        type="submit"
      >
        <Save aria-hidden="true" size={16} />
        Save review
      </button>
    </form>
  );
}

function NoteField({
  id,
  label,
  onChange,
  placeholder,
  value
}: {
  id: string;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <div>
      <label
        className="text-xs font-medium text-stone-600"
        htmlFor={id}
      >
        {label}
      </label>
      <textarea
        className="mt-1.5 min-h-20 w-full resize-y rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-950 outline-none placeholder:text-stone-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
        id={id}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </div>
  );
}

function splitNotes(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}
