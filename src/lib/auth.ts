import { cookies } from "next/headers";
import crypto from "crypto";

const AUTH_SECRET =
  process.env.AUTH_SECRET || "jarvis-default-secret-change-me";
const AUTH_PASSWORD = process.env.AUTH_PASSWORD || "";
const COOKIE_NAME = "jarvis-session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function sign(payload: string): string {
  return crypto.createHmac("sha256", AUTH_SECRET).update(payload).digest("hex");
}

export function createSessionToken(): string {
  const payload = `jarvis:${Date.now()}`;
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string): boolean {
  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) return false;
  const payload = token.substring(0, lastDot);
  const signature = token.substring(lastDot + 1);
  const expected = sign(payload);
  return crypto.timingSafeEqual(
    Buffer.from(signature, "hex"),
    Buffer.from(expected, "hex"),
  );
}

export function validatePassword(password: string): boolean {
  if (!AUTH_PASSWORD) return false;
  return password === AUTH_PASSWORD;
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    return verifySessionToken(token);
  } catch {
    return false;
  }
}
