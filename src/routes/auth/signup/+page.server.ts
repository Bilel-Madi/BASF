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

      // Basic validation
      if (!email || !password) {
        return fail(400, { error: 'Email and password are required' });
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return fail(400, { error: 'User already exists' });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create an organization
      const organization = await prisma.organization.create({
        data: {
          name: 'Default Organization', // Customize as needed or allow user input
        },
      });

      // Create the user with the organizationId
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: 'USER', // Adjust role as needed
          organizationId: organization.id,
        },
      });

      // Create a session
      const sessionToken = generateSessionToken();
      const session = await createSession(sessionToken, user.id);
      setSessionCookie(event, sessionToken, session.expiresAt);

      // Redirect to /zones
      throw redirect(303, '/zones');
    } catch (error) {
      console.error('Signup Error:', error);
      return fail(500, { error: 'Internal server error' });
    }
  },
};
