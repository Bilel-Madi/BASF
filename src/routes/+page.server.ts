// src/routes/+page.server.ts

import { fail, redirect } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import bcrypt from 'bcrypt';
import { generateSessionToken, createSession, setSessionCookie } from '$lib/server/session';

export const load = async ({ locals }) => {
  // If user is authenticated, redirect to dashboard
  if (locals.user) {
    throw redirect(303, '/dashboard');
  }

  // If not authenticated, the page will load normally (showing the sign-in form)
  return {};
};

export const actions = {
  default: async (event) => {
    try {
      const formData = await event.request.formData();
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;

      // Basic validation
      if (!email || !password) {
        return fail(400, { error: 'Email and password are required' });
      }

      // Find the user
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !user.password) {
        return fail(400, { error: 'Invalid credentials' });
      }

      // Check the password
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return fail(400, { error: 'Invalid credentials' });
      }

      // Create a session
      const sessionToken = generateSessionToken();
      const session = await createSession(sessionToken, user.id);
      setSessionCookie(event, sessionToken, session.expiresAt);

      // Redirect to /zones
      throw redirect(303, '/zones');
    } catch (error: any) {
      // Check if the error is a redirect by looking for 'status' and 'location'
      if (error && typeof error === 'object' && 'status' in error && 'location' in error) {
        throw error; // Re-throw redirect errors to let SvelteKit handle them
      }

      console.error('Login Error:', error);
      return fail(500, { error: 'Internal server error' });
    }
  },
};
