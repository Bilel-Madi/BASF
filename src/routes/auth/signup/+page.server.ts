// src/routes/auth/signup/+page.server.ts

import { fail, redirect } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import bcrypt from 'bcrypt';
import { generateSessionToken, createSession } from '$lib/server/session';

export const actions = {
  default: async (event) => {
    try {
      const formData = await event.request.formData();
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;
      const inviteCode = formData.get('inviteCode') as string;

      if (!email || !password) {
        return fail(400, { error: 'Email and password are required' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      if (inviteCode) {
        // If invite code exists, verify it
        const invite = await prisma.inviteCode.findUnique({
          where: { code: inviteCode },
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
          return fail(400, { error: 'Invalid or expired invite code' });
        }

        const firstProject = invite.organization.Project[0];

        const user = await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            role: 'VIEWER',
            organizationId: invite.organizationId,
            activeProjectId: firstProject?.id
          },
        });

        await prisma.inviteCode.update({
          where: { id: invite.id },
          data: { isUsed: true }
        });

        const sessionToken = generateSessionToken();
        const session = await createSession(sessionToken, user.id);
        
        // Set the session cookie before redirecting
        event.cookies.set('session', sessionToken, {
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          maxAge: 60 * 60 * 24 * 30, // 30 days
        });

        // Redirect based on whether user has an invite code
        return { 
          success: true, 
          location: inviteCode ? (firstProject ? '/dashboard' : '/projects') : '/auth/onboarding'
        };

      } else {
        // Create a new user with their own organization
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

        const sessionToken = generateSessionToken();
        await createSession(sessionToken, user.id);
        
        event.cookies.set('session', sessionToken, {
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          maxAge: 60 * 60 * 24 * 30, // 30 days
        });

        return { success: true, location: '/auth/onboarding' };
      }
    } catch (error) {
      console.error('Signup Error:', error);
      return fail(500, { error: 'Internal server error' });
    }
  },
};
