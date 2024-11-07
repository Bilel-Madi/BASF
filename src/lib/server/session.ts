// src/lib/server/session.ts

import prisma from '$lib/prisma';
import { encodeHexLowerCase } from '@oslojs/encoding';
import { sha256 } from '@oslojs/crypto/sha2';
import type { User, Session } from '@prisma/client';
import type { RequestEvent } from '@sveltejs/kit';

export function generateSessionToken(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  // Assuming encodeBase32LowerCaseNoPadding is defined elsewhere or adjust as needed
  const token = Buffer.from(bytes).toString('base64url'); // Alternative encoding
  return token;
}

export async function createSession(token: string, userId: string): Promise<Session> {
  const tokenHash = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  const session = await prisma.session.create({
    data: {
      tokenHash,
      userId,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
    },
  });
  return session;
}

export async function validateSessionToken(token: string): Promise<SessionValidationResult> {
  const tokenHash = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  const result = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!result) {
    return { session: null, user: null };
  }

  const { user, ...session } = result;

  if (Date.now() >= session.expiresAt.getTime()) {
    await prisma.session.delete({ where: { tokenHash } });
    return { session: null, user: null };
  }

  // Extend session if less than 15 days left
  const fifteenDaysInMs = 1000 * 60 * 60 * 24 * 15;
  if (Date.now() >= session.expiresAt.getTime() - fifteenDaysInMs) {
    const newExpiry = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    await prisma.session.update({
      where: { tokenHash },
      data: { expiresAt: newExpiry },
    });
    session.expiresAt = newExpiry;
  }

  return { session, user };
}

export async function invalidateSession(token: string): Promise<void> {
  const tokenHash = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  await prisma.session.delete({ where: { tokenHash } });
}

export function setSessionCookie(event: RequestEvent, token: string, expiresAt: Date): void {
  event.cookies.set('session', token, {
    httpOnly: true,
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  });
}

export function deleteSessionCookie(event: RequestEvent): void {
  event.cookies.set('session', '', {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}

export type SessionValidationResult =
  | { session: Session; user: User }
  | { session: null; user: null };
