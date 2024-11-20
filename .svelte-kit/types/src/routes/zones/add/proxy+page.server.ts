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

  if (!user.organizationId) {
    console.error('User has no organizationId:', user.id);
    throw redirect(303, '/');
  }

  // Fetch the user's project
  const project = await prisma.project.findFirst({
    where: { organizationId: user.organizationId },
  });

  if (!project) {
    throw redirect(303, '/projects/add');
  }

  return { project };
};
