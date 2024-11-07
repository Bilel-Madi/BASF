// src/hooks.server.ts

import { validateSessionToken, setSessionCookie, deleteSessionCookie } from '$lib/server/session';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const token = event.cookies.get('session') ?? null;

  if (!token) {
    event.locals.user = null;
    event.locals.session = null;
    return resolve(event);
  }

  const { session, user } = await validateSessionToken(token);

  if (session && user) {
    setSessionCookie(event, token, session.expiresAt);
    event.locals.user = user;
    event.locals.session = session;
  } else {
    deleteSessionCookie(event);
    event.locals.user = null;
    event.locals.session = null;
  }

  return resolve(event);
};
