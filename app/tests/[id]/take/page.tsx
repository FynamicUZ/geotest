import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import TestRunner from "@/components/TestRunner";

export const dynamic = "force-dynamic";

export default async function TakePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { id } = await params;
  const { q } = await searchParams;

  const test = await prisma.test.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      timeLimitSec: true,
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
  if (!test) notFound();

  let questions = test.questions;
  let practice = false;
  if (q) {
    const ids = new Set(q.split(","));
    const filtered = test.questions.filter((question) => ids.has(question.id));
    if (filtered.length > 0) {
      questions = filtered;
      practice = true;
    }
  }

  return <TestRunner test={{ ...test, questions }} practice={practice} />;
}
