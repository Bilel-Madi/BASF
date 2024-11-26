// src/routes/api/zones/+server.ts

import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
  const user = locals.user;

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const zones = await prisma.zone.findMany({
    where: user.role === 'SUPER_ADMIN'
      ? { 
          projectId: user.activeProjectId || '' 
        }
      : { 
          projectId: user.activeProjectId || '',
          organizationId: user.organizationId 
        },
    include: {
      organization: {
        select: {
          name: true
        }
      }
    }
  });

  return json(zones);
};
