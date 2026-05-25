import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { submitSchema } from "@/lib/validators";

type RouteCtx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: RouteCtx) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { nickname, answers, durationSec, practice } = parsed.data;

  const test = await prisma.test.findUnique({
    where: { id },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: { choices: { orderBy: { order: "asc" } } },
      },
    },
  });
  if (!test) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const answerByQuestion = new Map<string, string | null>();
  for (const a of answers) answerByQuestion.set(a.questionId, a.choiceId);

  const correctMap: Record<string, string> = {};
  let score = 0;
  for (const q of test.questions) {
    const correct = q.choices.find((c) => c.isCorrect);
    if (!correct) continue;
    correctMap[q.id] = correct.id;
    if (answerByQuestion.get(q.id) === correct.id) score += 1;
  }
  const total = answers.length;

  if (!practice) {
    await prisma.attempt.create({
      data: {
        testId: id,
        nickname: nickname.trim(),
        score,
        total,
        durationSec: durationSec ?? 0,
      },
    });
  }

  const explanations: Record<string, string | null> = {};
  for (const q of test.questions) explanations[q.id] = q.explanation;

  return NextResponse.json({ score, total, correctMap, explanations });
}
