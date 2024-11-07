// @ts-nocheck
// src/routes/admin/+page.server.ts

import prisma from '$lib/prisma';
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }: Parameters<PageServerLoad>[0]) => {
  const user = locals.user;

  if (!user) {
    throw redirect(303, '/');
  }

  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    throw redirect(303, '/');
  }

  // Fetch admin-specific data, e.g., all organizations
  const organizations = await prisma.organization.findMany();

  return { organizations };
};
