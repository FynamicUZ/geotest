import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyProfile } from "@/lib/auth";
import {
  editTestRequestSchema,
  deleteTestRequestSchema,
} from "@/lib/validators";

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: RouteCtx) {
  const { id } = await ctx.params;
  const url = new URL(_req.url);
  const includeAnswers = url.searchParams.get("includeAnswers") === "1";
  const test = await prisma.test.findUnique({
    where: { id },
    include: {
      author: { select: { username: true } },
      questions: {
        orderBy: { order: "asc" },
        include: {
          choices: {
            orderBy: { order: "asc" },
            select: includeAnswers
              ? { id: true, text: true, order: true, isCorrect: true }
              : { id: true, text: true, order: true },
          },
        },
      },
    },
  });
  if (!test) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ test });
}

export async function PATCH(req: Request, ctx: RouteCtx) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = editTestRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { username, password, test: payload } = parsed.data;
  const profile = await verifyProfile(username, password);
  if (!profile) {
    return NextResponse.json(
      { error: "Wrong username or password" },
      { status: 401 }
    );
  }
  const existing = await prisma.test.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.authorId !== profile.id) {
    return NextResponse.json({ error: "Not your test" }, { status: 403 });
  }

  await prisma.$transaction([
    prisma.question.deleteMany({ where: { testId: id } }),
    prisma.test.update({
      where: { id },
      data: {
        name: payload.name.trim(),
        description: payload.description ?? "",
        timeLimitSec: payload.timeLimitSec ?? null,
        questions: {
          create: payload.questions.map((q, qi) => ({
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
    }),
  ]);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, ctx: RouteCtx) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = deleteTestRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const profile = await verifyProfile(parsed.data.username, parsed.data.password);
  if (!profile) {
    return NextResponse.json(
      { error: "Wrong username or password" },
      { status: 401 }
    );
  }
  const existing = await prisma.test.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.authorId !== profile.id) {
    return NextResponse.json({ error: "Not your test" }, { status: 403 });
  }
  await prisma.test.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
