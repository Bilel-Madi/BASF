// @ts-nocheck
import prisma from '$lib/prisma';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = async ({ locals }: Parameters<PageServerLoad>[0]) => {
  const user = locals.user;

  if (!user) {
    throw redirect(303, '/');
  }

  const [zones, project] = await Promise.all([
    prisma.zone.findMany({
      where: { organizationId: user.organizationId }
    }),
    prisma.project.findFirst({
      where: { organizationId: user.organizationId }
    })
  ]);

  return {
    zones,
    project
  };
}; 