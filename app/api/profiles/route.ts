import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { credentialsSchema } from "@/lib/validators";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = credentialsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { username, password } = parsed.data;
  const existing = await prisma.profile.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json(
      { error: "Username already taken" },
      { status: 409 }
    );
  }
  const passwordHash = await hashPassword(password);
  const profile = await prisma.profile.create({
    data: { username, passwordHash },
    select: { id: true, username: true, createdAt: true },
  });
  return NextResponse.json({ profile });
}
