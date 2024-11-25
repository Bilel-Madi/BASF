// src/routes/api/devices/latest-readings/+server.ts

import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
  const user = locals.user;

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Fetch devices with latest readings
  const devices = await prisma.device.findMany({
    where: {
      zone: {
        organizationId: user.organizationId,
        projectId: user.activeProjectId || undefined
      },
    },
    include: {
      zone: true,
    },
    orderBy: [
      {
        type: 'asc',
      },
      {
        number: 'asc',
      },
    ],
  });

  return json(devices);
};
