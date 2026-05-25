"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type ResultData = {
  score: number;
  total: number;
  correctMap: Record<string, string>;
  explanations: Record<string, string | null>;
  answers: Record<string, string>;
  durationSec: number;
  mix: {
    name: string;
    questions: {
      id: string;
      prompt: string;
      imageUrl: string | null;
      choices: { id: string; text: string }[];
    }[];
  };
};

export default function MixResultPage() {
  return (
    <Suspense fallback={<div className="text-white/50">Loading…</div>}>
      <MixResultInner />
    </Suspense>
  );
}

function MixResultInner() {
  const sp = useSearchParams();
  const k = sp.get("k");
  const [data, setData] = useState<ResultData | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!k) {
      setMissing(true);
      return;
    }
    const raw = sessionStorage.getItem(`geotest:mix:${k}`);
    if (!raw) {
      setMissing(true);
      return;
    }
    setData(JSON.parse(raw) as ResultData);
  }, [k]);

  if (missing) {
    return (
      <div className="card text-center space-y-3">
        <div>No mix result to show.</div>
        <Link href="/tests/mix" className="btn-primary">
          Back to mix
        </Link>
      </div>
    );
  }
  if (!data) return <div className="text-white/50">Loading…</div>;

  const pct = Math.round((data.score / data.total) * 100);

  return (
    <div className="space-y-6">
      <div className="card flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{data.mix.name}</h1>
          <div className="text-sm text-white/60">{data.durationSec}s</div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold tabular-nums">
            {data.score}/{data.total}
          </div>
          <div className="text-white/60 text-sm">{pct}%</div>
        </div>
      </div>

      <ol className="space-y-4">
        {data.mix.questions.map((q, i) => {
          const correctId = data.correctMap[q.id];
          const chosenId = data.answers[q.id];
          const explanation = data.explanations[q.id];
          const isCorrect = chosenId === correctId;
          return (
            <li key={q.id} className="card space-y-3">
              <div className="flex justify-between items-start gap-3">
                <div>
                  <div className="text-white/40 text-xs">Question {i + 1}</div>
                  <div className="text-lg">{q.prompt}</div>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    isCorrect
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "bg-rose-500/15 text-rose-300"
                  }`}
                >
                  {isCorrect ? "Correct" : "Wrong"}
                </span>
              </div>
              {q.imageUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={q.imageUrl}
                  alt=""
                  className="max-w-md max-h-60 object-contain rounded-md"
                />
              )}
              <div className="grid gap-2">
                {q.choices.map((c) => {
                  const isC = c.id === correctId;
                  const isChosen = c.id === chosenId;
                  let cls =
                    "px-3 py-2 rounded-md border bg-white/5 border-white/10";
                  if (isC)
                    cls =
                      "px-3 py-2 rounded-md border bg-emerald-500/15 border-emerald-400/50";
                  else if (isChosen)
                    cls =
                      "px-3 py-2 rounded-md border bg-rose-500/15 border-rose-400/50";
                  return (
                    <div key={c.id} className={cls}>
                      {c.text}
                      {isC && (
                        <span className="text-xs text-emerald-300 ml-2">
                          ← correct
                        </span>
                      )}
                      {!isC && isChosen && (
                        <span className="text-xs text-rose-300 ml-2">
                          ← your answer
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              {explanation && (
                <div className="text-sm text-white/70 border-l-2 border-white/20 pl-3">
                  {explanation}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <div className="flex gap-2">
        <Link href="/tests/mix" className="btn-primary">
          New mix
        </Link>
        <Link href="/tests" className="btn-ghost">
          Browse tests
        </Link>
      </div>
    </div>
  );
}
