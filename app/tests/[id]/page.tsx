import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Leaderboard from "@/components/Leaderboard";

export const dynamic = "force-dynamic";

export default async function TestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const test = await prisma.test.findUnique({
    where: { id },
    include: {
      author: { select: { username: true } },
      _count: { select: { questions: true, attempts: true } },
    },
  });
  if (!test) notFound();

  const attempts = await prisma.attempt.findMany({
    where: { testId: id },
    orderBy: [{ score: "desc" }, { durationSec: "asc" }, { createdAt: "asc" }],
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div className="card space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{test.name}</h1>
            <div className="text-sm text-white/60">
              by @{test.author.username} · {test._count.questions} questions
              {test.timeLimitSec ? ` · ${test.timeLimitSec}s timer` : ""}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link href={`/tests/${test.id}/take`} className="btn-primary">
              Start
            </Link>
            <Link href={`/tests/${test.id}/edit`} className="btn-ghost">
              Edit
            </Link>
          </div>
        </div>
        {test.description && (
          <p className="text-white/80 whitespace-pre-wrap">{test.description}</p>
        )}
      </div>

      <div className="card space-y-3">
        <h2 className="text-lg font-medium">Leaderboard</h2>
        <Leaderboard
          attempts={attempts.map((a) => ({
            ...a,
            createdAt: a.createdAt.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
