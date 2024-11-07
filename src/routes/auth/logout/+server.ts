// src/routes/auth/logout/+server.ts

import { redirect } from '@sveltejs/kit';
import { invalidateSession, deleteSessionCookie } from '$lib/server/session';

export const GET = async (event) => {
  const token = event.cookies.get('session') ?? null;

  if (token) {
    await invalidateSession(token);
  }

  deleteSessionCookie(event);

  throw redirect(303, '/');
};
