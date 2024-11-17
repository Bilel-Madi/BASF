// src/routes/auth/signup/+page.server.ts

import { fail, redirect } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import bcrypt from 'bcrypt';
import { generateSessionToken, createSession, setSessionCookie } from '$lib/server/session';

export const actions = {
  default: async (event) => {
    try {
      const formData = await event.request.formData();
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;

      if (!email || !password) {
        return fail(400, { error: 'Email and password are required' });
      }

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return fail(400, { error: 'User already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: 'USER',
          organization: {
            create: {
              name: 'Temporary Organization'
            }
          }
        },
      });

      const sessionToken = generateSessionToken();
      const session = await createSession(sessionToken, user.id);
      setSessionCookie(event, sessionToken, session.expiresAt);

      throw redirect(303, '/auth/onboarding');
    } catch (error: any) {
      if (error && typeof error === 'object' && 'status' in error && 'location' in error) {
        throw error;
      }

      console.error('Signup Error:', error);
      return fail(500, { error: 'Internal server error' });
    }
  },
};
