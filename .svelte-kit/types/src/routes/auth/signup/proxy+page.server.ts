// @ts-nocheck
// src/routes/auth/signup/+page.server.ts

import { fail, redirect, type Actions, type PageServerLoad } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import bcrypt from 'bcrypt';
import { generateSessionToken, createSession } from '$lib/server/session';

export const load = async ({ url }: Parameters<PageServerLoad>[0]) => {
  const inviteToken = url.searchParams.get('invite');

  if (inviteToken) {
    // Verify the invite token
    const invite = await prisma.inviteCode.findUnique({
      where: { code: inviteToken },
      include: { organization: true }
    });

    if (!invite || invite.isUsed || invite.expiresAt < new Date()) {
      return {
        error: 'Invalid or expired invitation link'
      };
    }

    return {
      invite: {
        token: inviteToken,
        organizationName: invite.organization.name
      }
    };
  }

  return {};
};

export const actions = {
  default: async (event: import('./$types').RequestEvent) => {
    const formData = await event.request.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const inviteToken = formData.get('inviteToken') as string;

    // Basic validation
    if (!email || !password) {
      return fail(400, { error: 'Email and password are required' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return fail(400, { error: 'User with this email already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    if (inviteToken) {
      // Verify invite token
      const invite = await prisma.inviteCode.findUnique({
        where: { code: inviteToken },
        include: { 
          organization: {
            include: {
              Project: {
                take: 1
              }
            }
          }
        }
      });

      if (!invite || invite.isUsed || invite.expiresAt < new Date()) {
        return fail(400, { error: 'Invalid or expired invitation' });
      }

      const firstProject = invite.organization.Project[0];

      // Create user with VIEWER role in the invited organization
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: 'VIEWER',
          organizationId: invite.organizationId,
          activeProjectId: firstProject?.id || null
        },
      });

      // Mark invite as used
      await prisma.inviteCode.update({
        where: { id: invite.id },
        data: { isUsed: true }
      });

      // Generate and store session token
      const sessionToken = generateSessionToken();
      await createSession(sessionToken, user.id);

      // Set the session cookie
      event.cookies.set('session', sessionToken, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });

      // Redirect to dashboard or projects based on the presence of a project
      throw redirect(303, firstProject ? '/dashboard' : '/projects');
    } else {
      // Regular signup (create new organization)
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: 'ADMIN',
          organization: {
            create: {
              name: `${email.split('@')[0]}'s Organization`,
              subscriptionStatus: 'FREE'
            }
          }
        },
      });

      // Generate and store session token
      const sessionToken = generateSessionToken();
      await createSession(sessionToken, user.id);

      // Set the session cookie
      event.cookies.set('session', sessionToken, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });

      // Redirect to onboarding
      throw redirect(303, '/auth/onboarding');
    }
  }
};
;null as any as Actions;