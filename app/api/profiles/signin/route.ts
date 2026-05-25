import { NextResponse } from "next/server";
import { verifyProfile } from "@/lib/auth";
import { credentialsSchema } from "@/lib/validators";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = credentialsSchema.safeParse(body);
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
  return NextResponse.json({
    profile: { id: profile.id, username: profile.username },
  });
}
