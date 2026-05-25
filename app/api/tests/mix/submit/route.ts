import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const mixSubmitSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        choiceId: z.string().min(1).nullable(),
      })
    )
    .min(1),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = mixSubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { answers } = parsed.data;

  const questionIds = answers.map((a) => a.questionId);
  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
    include: { choices: true },
  });

  const answerByQuestion = new Map<string, string | null>();
  for (const a of answers) answerByQuestion.set(a.questionId, a.choiceId);

  const correctMap: Record<string, string> = {};
  const explanations: Record<string, string | null> = {};
  let score = 0;
  for (const q of questions) {
    const correct = q.choices.find((c) => c.isCorrect);
    if (!correct) continue;
    correctMap[q.id] = correct.id;
    explanations[q.id] = q.explanation;
    if (answerByQuestion.get(q.id) === correct.id) score += 1;
  }

  return NextResponse.json({
    score,
    total: questions.length,
    correctMap,
    explanations,
  });
}
