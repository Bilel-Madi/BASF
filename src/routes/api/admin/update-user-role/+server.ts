import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import type { RequestHandler } from './$types';
import type { Role } from '@prisma/client';

export const POST: RequestHandler = async ({ request, locals }) => {
  const user = locals.user;

  if (!user || user.role !== 'SUPER_ADMIN') {
    return new Response('Unauthorized', { status: 401 });
  }

  const { userId, role } = await request.json();

  const validRoles = ['USER', 'ADMIN', 'VIEWER', 'SUPER_ADMIN'];
  if (!validRoles.includes(role)) {
    return new Response('Invalid role', { status: 400 });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: role as Role },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true
      }
    });

    return json(updatedUser);
  } catch (error) {
    console.error('Error updating user role:', error);
    return new Response('Server error', { status: 500 });
  }
}; 