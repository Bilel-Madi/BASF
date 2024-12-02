// src/routes/api/devices/connected-count/+server.ts

import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import { subHours } from 'date-fns';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, url }) => {
  const user = locals.user;
  const projectSlug = url.searchParams.get('projectSlug');

  if (!user && !projectSlug) {
    return new Response('Unauthorized', { status: 401 });
  }

  const twoHoursAgo = subHours(new Date(), 2);
  let whereClause = {};

  if (user) {
    whereClause = {
      last_seen: {
        gte: twoHoursAgo,
      },
      zone: user.role === 'SUPER_ADMIN'
        ? undefined
        : {
            organizationId: user.organizationId,
          },
    };
  } else {
    const project = await prisma.project.findUnique({
      where: {
        publicSlug: projectSlug,
        isPublic: true
      }
    });

    if (!project) {
      return new Response('Project not found', { status: 404 });
    }

    whereClause = {
      last_seen: {
        gte: twoHoursAgo,
      },
      zone: {
        projectId: project.id
      }
    };
  }

  const connectedDevices = await prisma.device.groupBy({
    by: ['type'],
    where: whereClause,
    _count: {
      _all: true,
    },
  });

  return json(connectedDevices);
};
