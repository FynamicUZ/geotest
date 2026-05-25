import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyProfile } from "@/lib/auth";
import { createTestRequestSchema } from "@/lib/validators";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const tests = await prisma.test.findMany({
    where: q
      ? { name: { contains: q } }
      : undefined,
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
  return NextResponse.json({ tests });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = createTestRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { username, password, test } = parsed.data;
  const profile = await verifyProfile(username, password);
  if (!profile) {
    return NextResponse.json(
      { error: "Wrong username or password" },
      { status: 401 }
    );
  }
  const created = await prisma.test.create({
    data: {
      name: test.name.trim(),
      description: test.description ?? "",
      timeLimitSec: test.timeLimitSec ?? null,
      authorId: profile.id,
      questions: {
        create: test.questions.map((q, qi) => ({
          order: qi,
          prompt: q.prompt,
          imageUrl: q.imageUrl ?? null,
          explanation: q.explanation ?? null,
          choices: {
            create: q.choices.map((c, ci) => ({
              order: ci,
              text: c.text,
              isCorrect: c.isCorrect,
            })),
          },
        })),
      },
    },
    select: { id: true, name: true },
  });
  return NextResponse.json({ test: created });
}
