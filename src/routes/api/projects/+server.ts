// src/routes/api/projects/+server.ts

import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
  const user = locals.user;

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const projects = await prisma.project.findMany({
    where: user.role === 'SUPER_ADMIN' 
      ? {} 
      : { organizationId: user.organizationId },
    include: {
      organization: {
        select: {
          name: true
        }
      }
    }
  });

  return json(projects);
};
