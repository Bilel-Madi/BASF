// src/routes/api/devices/last-activity/+server.ts

import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, url }) => {
  const user = locals.user;
  const projectSlug = url.searchParams.get('projectSlug');

  // If no user, check if requesting for a public project
  if (!user && !projectSlug) {
    return new Response('Unauthorized', { status: 401 });
  }

  let whereClause = {};

  if (user) {
    // Existing logic for authenticated users
    whereClause = {
      zone: user.role === 'SUPER_ADMIN'
        ? {
            projectId: user.activeProjectId || undefined
          }
        : {
            organizationId: user.organizationId,
            projectId: user.activeProjectId || undefined
          }
    };
  } else {
    // Public access logic
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
      zone: {
        projectId: project.id
      }
    };
  }

  // Get the latest 'last_seen' timestamp
  const lastActivity = await prisma.device.findFirst({
    where: {
      ...whereClause,
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
