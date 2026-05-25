"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type ResultData = {
  score: number;
  total: number;
  correctMap: Record<string, string>;
  explanations: Record<string, string | null>;
  answers: Record<string, string>;
  nickname: string;
  durationSec: number;
  test: {
    id: string;
    name: string;
    questions: {
      id: string;
      prompt: string;
      imageUrl: string | null;
      choices: { id: string; text: string }[];
    }[];
  };
};

export default function ResultPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<ResultData | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(`geotest:result:${params.id}`);
    if (!raw) {
      setMissing(true);
      return;
    }
    setData(JSON.parse(raw) as ResultData);
  }, [params.id]);

  if (missing) {
    return (
      <div className="card text-center space-y-3">
        <div>No result to show. Take the test first.</div>
        <Link href={`/tests/${params.id}`} className="btn-primary">
          Back to test
        </Link>
      </div>
    );
  }
  if (!data) return <div className="text-white/50">Loading…</div>;

  const pct = Math.round((data.score / data.total) * 100);
  const wrongIds = data.test.questions
    .filter((q) => data.answers[q.id] !== data.correctMap[q.id])
    .map((q) => q.id);

  return (
    <div className="space-y-6">
      <div className="card flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{data.test.name}</h1>
          <div className="text-sm text-white/60">
            @{data.nickname} · {data.durationSec}s
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold tabular-nums">
            {data.score}/{data.total}
          </div>
          <div className="text-white/60 text-sm">{pct}%</div>
        </div>
      </div>

      <ol className="space-y-4">
        {data.test.questions.map((q, i) => {
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
                  if (isC) cls = "px-3 py-2 rounded-md border bg-emerald-500/15 border-emerald-400/50";
                  else if (isChosen)
                    cls = "px-3 py-2 rounded-md border bg-rose-500/15 border-rose-400/50";
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
        <Link href={`/tests/${params.id}`} className="btn-primary">
          Back to test
        </Link>
        <Link href={`/tests/${params.id}/take`} className="btn-ghost">
          Retake
        </Link>
        {wrongIds.length > 0 && wrongIds.length < data.total && (
          <Link
            href={`/tests/${params.id}/take?q=${wrongIds.join(",")}`}
            className="btn-ghost"
          >
            Retake Wrong ({wrongIds.length})
          </Link>
        )}
      </div>
    </div>
  );
}
