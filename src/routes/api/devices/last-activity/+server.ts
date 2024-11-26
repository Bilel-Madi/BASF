// src/routes/api/devices/last-activity/+server.ts

import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
  const user = locals.user;

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Get the latest 'last_seen' timestamp with SUPER_ADMIN consideration
  const lastActivity = await prisma.device.findFirst({
    where: {
      zone: user.role === 'SUPER_ADMIN'
        ? {
            projectId: user.activeProjectId || undefined
          }
        : {
            organizationId: user.organizationId,
            projectId: user.activeProjectId || undefined
          },
      last_seen: {
        not: null,
      },
    },
    orderBy: {
      last_seen: 'desc',
    },
    select: {
      last_seen: true,
    },
  });

  return json({ last_seen: lastActivity?.last_seen });
};
