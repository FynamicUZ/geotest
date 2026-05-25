"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type TestListItem = {
  id: string;
  name: string;
  author: { username: string };
  _count: { questions: number };
};

export default function MixSelectPage() {
  const router = useRouter();
  const [tests, setTests] = useState<TestListItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tests")
      .then((r) => r.json())
      .then((data) => {
        setTests(data.tests ?? []);
        setLoading(false);
      });
  }, []);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function start() {
    if (selected.size < 2) return;
    const ids = Array.from(selected).join(",");
    router.push(`/tests/mix/take?ids=${encodeURIComponent(ids)}`);
  }

  const totalQuestions = tests
    .filter((t) => selected.has(t.id))
    .reduce((sum, t) => sum + t._count.questions, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Mix tests</h1>
          <p className="text-sm text-white/60">
            Pick 2 or more tests. Their questions will be combined and shuffled.
          </p>
        </div>
        <Link href="/tests" className="btn-ghost">
          Back
        </Link>
      </div>

      {loading ? (
        <div className="text-white/50">Loading…</div>
      ) : tests.length === 0 ? (
        <div className="card text-center text-white/60">
          No tests yet.{" "}
          <Link href="/tests/new" className="text-sky-400">
            Create one →
          </Link>
        </div>
      ) : (
        <ul className="grid gap-2">
          {tests.map((t) => {
            const checked = selected.has(t.id);
            return (
              <li key={t.id}>
                <label
                  className={`card flex items-center gap-3 cursor-pointer transition ${
                    checked
                      ? "bg-sky-500/15 border-sky-400/60"
                      : "hover:bg-white/5"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(t.id)}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{t.name}</div>
                    <div className="text-sm text-white/60">
                      by @{t.author.username} · {t._count.questions} questions
                    </div>
                  </div>
                </label>
              </li>
            );
          })}
        </ul>
      )}

      <div className="sticky bottom-3 card flex items-center justify-between gap-3">
        <div className="text-sm text-white/70">
          {selected.size} test{selected.size === 1 ? "" : "s"} selected ·{" "}
          {totalQuestions} question{totalQuestions === 1 ? "" : "s"} total
        </div>
        <button
          className="btn-primary"
          disabled={selected.size < 2}
          onClick={start}
        >
          Start mixed test
        </button>
      </div>
    </div>
  );
}
