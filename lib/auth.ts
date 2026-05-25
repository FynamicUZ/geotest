import bcrypt from "bcryptjs";
import { prisma } from "./db";

export async function verifyProfile(username: string, password: string) {
  if (!username || !password) return null;
  const profile = await prisma.profile.findUnique({ where: { username } });
  if (!profile) return null;
  const ok = await bcrypt.compare(password, profile.passwordHash);
  return ok ? profile : null;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}
