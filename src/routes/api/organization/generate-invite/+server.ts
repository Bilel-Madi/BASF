import { json } from '@sveltejs/kit';
import { nanoid } from 'nanoid';
import prisma from '$lib/prisma';
import { validateSessionToken } from '$lib/server/session';

export async function POST(event) {
  try {
    // Get session and user
    const sessionToken = event.cookies.get('session');
    if (!sessionToken) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { session, user } = await validateSessionToken(sessionToken);
    if (!session || !user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const code = nanoid(8); // Generate 8-character unique code
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    const inviteCode = await prisma.inviteCode.create({
      data: {
        code,
        organizationId: user.organizationId,
        expiresAt
      }
    });

    return json({ code: inviteCode.code });
  } catch (error) {
    console.error('Error generating invite code:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
} 