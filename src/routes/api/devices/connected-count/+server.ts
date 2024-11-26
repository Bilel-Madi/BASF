// src/routes/api/devices/connected-count/+server.ts

import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import { subHours } from 'date-fns';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
  const user = locals.user;

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const twoHoursAgo = subHours(new Date(), 2);

  // Fetch counts with SUPER_ADMIN consideration
  const connectedDevices = await prisma.device.groupBy({
    by: ['type'],
    where: {
      last_seen: {
        gte: twoHoursAgo,
      },
      zone: user.role === 'SUPER_ADMIN'
        ? undefined  // No organization filter for SUPER_ADMIN
        : {
            organizationId: user.organizationId,
          },
    },
    _count: {
      _all: true,
    },
  });

  return json(connectedDevices);
};
