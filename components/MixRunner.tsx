"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";

type Choice = { id: string; text: string; order: number };
type Question = {
  id: string;
  prompt: string;
  imageUrl: string | null;
  order: number;
  choices: Choice[];
};
type Mix = {
  name: string;
  questions: Question[];
};

function shuffle<T>(arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export default function MixRunner({ mix }: { mix: Mix }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [started, setStarted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedAt = useRef<number | null>(null);
  const mixId = useRef<string>(
    Math.random().toString(36).slice(2) + Date.now().toString(36)
  );

  const shuffledQuestions = useMemo(
    () =>
      shuffle(mix.questions).map((q) => ({
        ...q,
        choices: shuffle(q.choices),
      })),
    [mix]
  );

  const total = shuffledQuestions.length;

  async function submit() {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    const durationSec = startedAt.current
      ? Math.round((Date.now() - startedAt.current) / 1000)
      : 0;
    const payload = {
      answers: shuffledQuestions.map((q) => ({
        questionId: q.id,
        choiceId: answers[q.id] ?? null,
      })),
    };
    const res = await fetch("/api/tests/mix/submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to submit");
      return;
    }
    sessionStorage.setItem(
      `geotest:mix:${mixId.current}`,
      JSON.stringify({
        ...data,
        answers,
        mix: { ...mix, questions: shuffledQuestions },
        durationSec,
      })
    );
    router.push(`/tests/mix/result?k=${mixId.current}`);
  }

  if (!started) {
    return (
      <div className="card max-w-md mx-auto space-y-4">
        <h1 className="text-2xl font-semibold">{mix.name}</h1>
        <div className="text-sm text-white/60">
          {total} question{total === 1 ? "" : "s"} · shuffled · no leaderboard
        </div>
        <button
          className="btn-primary w-full"
          onClick={() => {
            startedAt.current = Date.now();
            setStarted(true);
          }}
        >
          Start
        </button>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between sticky top-0 bg-[#0b0d10] py-3 z-10 border-b border-white/10">
        <div className="text-sm text-white/60">
          {answeredCount}/{total} answered
        </div>
      </div>

      <ol className="space-y-6">
        {shuffledQuestions.map((q, i) => (
          <li key={q.id} className="card space-y-3">
            <div className="text-white/40 text-xs">
              Question {i + 1} of {total}
            </div>
            <div className="text-lg">{q.prompt}</div>
            {q.imageUrl && (
              <div className="relative w-full max-w-md aspect-video bg-black/30 rounded-md overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={q.imageUrl}
                  alt=""
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <div className="grid gap-2">
              {q.choices.map((c) => {
                const checked = answers[q.id] === c.id;
                return (
                  <label
                    key={c.id}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md border cursor-pointer transition ${
                      checked
                        ? "bg-sky-500/15 border-sky-400/60"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      checked={checked}
                      onChange={() =>
                        setAnswers((a) => ({ ...a, [q.id]: c.id }))
                      }
                    />
                    <span>{c.text}</span>
                  </label>
                );
              })}
            </div>
          </li>
        ))}
      </ol>

      {error && <div className="error">{error}</div>}

      <div className="flex justify-end">
        <button
          className="btn-primary"
          disabled={submitting || answeredCount === 0}
          onClick={() => submit()}
        >
          {submitting ? "Submitting…" : "Submit"}
        </button>
      </div>
    </div>
  );
}
