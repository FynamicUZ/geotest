import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/db";
import SearchBar from "@/components/SearchBar";

export const dynamic = "force-dynamic";

type Search = Promise<{ q?: string }>;

export default async function TestsPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const tests = await prisma.test.findMany({
    where: query ? { name: { contains: query } } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      name: true,
      description: true,
      timeLimitSec: true,
      createdAt: true,
      author: { select: { username: true } },
      _count: { select: { questions: true, attempts: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Browse tests</h1>
        <Link href="/tests/mix" className="btn-ghost">
          Mix tests
        </Link>
      </div>

      <div className="card">
        <Suspense fallback={<div className="input">Loading…</div>}>
          <SearchBar />
        </Suspense>
      </div>

      {query && (
        <div className="text-sm text-white/60">
          Results for <span className="text-white">"{query}"</span> ·{" "}
          {tests.length} found
        </div>
      )}

      {tests.length === 0 ? (
        <div className="card text-center text-white/60">
          No tests match.{" "}
          <Link href="/tests/new" className="text-sky-400">
            Create the first one →
          </Link>
        </div>
      ) : (
        <ul className="grid gap-3">
          {tests.map((t) => (
            <li key={t.id} className="card flex justify-between items-start gap-4">
              <div className="space-y-1">
                <Link
                  href={`/tests/${t.id}`}
                  className="text-lg font-medium text-white"
                >
                  {t.name}
                </Link>
                <div className="text-sm text-white/60">
                  by @{t.author.username} · {t._count.questions} questions ·{" "}
                  {t._count.attempts} attempts
                  {t.timeLimitSec ? ` · ${t.timeLimitSec}s timer` : ""}
                </div>
                {t.description && (
                  <p className="text-sm text-white/70 mt-1">{t.description}</p>
                )}
              </div>
              <Link href={`/tests/${t.id}`} className="btn-primary shrink-0">
                Open
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
