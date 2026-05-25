import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: RouteCtx) {
  const { id } = await ctx.params;
  const attempts = await prisma.attempt.findMany({
    where: { testId: id },
    orderBy: [{ score: "desc" }, { durationSec: "asc" }, { createdAt: "asc" }],
    take: 50,
    select: {
      id: true,
      nickname: true,
      score: true,
      total: true,
      durationSec: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ attempts });
}
