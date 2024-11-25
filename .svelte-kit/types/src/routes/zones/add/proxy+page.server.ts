// @ts-nocheck
// src/routes/zones/add/+page.server.ts

import { redirect } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import type { PageServerLoad } from './$types';

export const load = async ({ locals }: Parameters<PageServerLoad>[0]) => {
  const user = locals.user;

  if (!user) {
    throw redirect(303, '/');
  }

  if (!user.activeProjectId) {
    throw redirect(303, '/projects');
  }

  // Fetch the active project
  const project = await prisma.project.findUnique({
    where: { 
      id: user.activeProjectId,
      organizationId: user.organizationId 
    },
  });

  if (!project) {
    throw redirect(303, '/projects');
  }

  return { project };
};
