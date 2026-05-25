import Link from "next/link";
import { prisma } from "@/lib/db";
import MixRunner from "@/components/MixRunner";

export const dynamic = "force-dynamic";

type Search = Promise<{ ids?: string }>;

export default async function MixTakePage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const { ids } = await searchParams;
  const idList = (ids ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (idList.length < 2) {
    return (
      <div className="card text-center space-y-3">
        <div>Pick at least 2 tests to mix.</div>
        <Link href="/tests/mix" className="btn-primary">
          Back to selection
        </Link>
      </div>
    );
  }

  const tests = await prisma.test.findMany({
    where: { id: { in: idList } },
    select: {
      id: true,
      name: true,
      questions: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          prompt: true,
          imageUrl: true,
          order: true,
          choices: {
            orderBy: { order: "asc" },
            select: { id: true, text: true, order: true },
          },
        },
      },
    },
  });

  if (tests.length === 0) {
    return (
      <div className="card text-center space-y-3">
        <div>Selected tests not found.</div>
        <Link href="/tests/mix" className="btn-primary">
          Back
        </Link>
      </div>
    );
  }

  const mixedQuestions = tests.flatMap((t) => t.questions);
  const names = tests.map((t) => t.name);

  return (
    <MixRunner
      mix={{
        name: `Mix: ${names.join(" + ")}`,
        questions: mixedQuestions,
      }}
    />
  );
}
