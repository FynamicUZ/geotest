"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { getSignedInUsername } from "@/lib/clientAuth";

type Choice = { id: string; text: string; order: number };
type Question = {
  id: string;
  prompt: string;
  imageUrl: string | null;
  order: number;
  choices: Choice[];
};
type Test = {
  id: string;
  name: string;
  description: string;
  timeLimitSec: number | null;
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

export default function TestRunner({ test, practice }: { test: Test; practice?: boolean }) {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [started, setStarted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedAt = useRef<number | null>(null);

  const shuffledQuestions = useMemo(
    () =>
      shuffle(test.questions).map((q) => ({
        ...q,
        choices: shuffle(q.choices),
      })),
    [test]
  );

  const total = shuffledQuestions.length;
  const initialTime = test.timeLimitSec ?? 0;
  const [remaining, setRemaining] = useState(initialTime);

  useEffect(() => {
    const u = getSignedInUsername();
    if (u) setNickname(u);
  }, []);

  useEffect(() => {
    if (!started || !test.timeLimitSec) return;
    const t = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(t);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [started, test.timeLimitSec]);

  const submit = useMemo(
    () => async () => {
      if (submitting) return;
      setSubmitting(true);
      setError(null);
      const payload = {
        nickname: nickname.trim(),
        durationSec: startedAt.current
          ? Math.round((Date.now() - startedAt.current) / 1000)
          : 0,
        answers: shuffledQuestions.map((q) => ({
          questionId: q.id,
          choiceId: answers[q.id] ?? null,
        })),
        ...(practice && { practice: true }),
      };
      const res = await fetch(`/api/tests/${test.id}/submit`, {
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
        `geotest:result:${test.id}`,
        JSON.stringify({
          ...data,
          answers,
          test: { ...test, questions: shuffledQuestions },
          nickname: payload.nickname,
          durationSec: payload.durationSec,
        })
      );
      router.push(`/tests/${test.id}/result`);
    },
    [answers, nickname, practice, router, submitting, test, shuffledQuestions]
  );

  useEffect(() => {
    if (started && test.timeLimitSec && remaining === 0) {
      void submit();
    }
  }, [started, remaining, test.timeLimitSec, submit]);

  if (!started) {
    return (
      <div className="card max-w-md mx-auto space-y-4">
        <h1 className="text-2xl font-semibold">{test.name}</h1>
        <div className="text-sm text-white/60">
          {total} question{total === 1 ? "" : "s"}
          {test.timeLimitSec
            ? ` · ${test.timeLimitSec}s timer`
            : " · no time limit"}
        </div>
        {practice && (
          <div className="text-xs px-3 py-2 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20">
            Practice mode — wrong answers only, result won&apos;t appear on the leaderboard.
          </div>
        )}
        <div>
          <div className="label">Your nickname (for the leaderboard)</div>
          <input
            className="input"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="e.g. alice"
            maxLength={40}
          />
        </div>
        <button
          className="btn-primary w-full"
          disabled={!nickname.trim()}
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
          {answeredCount}/{total} answered · @{nickname}
        </div>
        {test.timeLimitSec ? (
          <div
            className={`tabular-nums font-mono text-lg ${
              remaining <= 10 ? "text-rose-400" : "text-white"
            }`}
          >
            {formatTime(remaining)}
          </div>
        ) : null}
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

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}