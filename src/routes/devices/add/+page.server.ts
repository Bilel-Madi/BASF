import prisma from '$lib/prisma';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;

  if (!user) {
    throw redirect(303, '/');
  }

  if (!user.activeProjectId) {
    throw redirect(303, '/projects');
  }

  const [zones, project] = await Promise.all([
    prisma.zone.findMany({
      where: { 
        organizationId: user.organizationId,
        projectId: user.activeProjectId
      }
    }),
    prisma.project.findUnique({
      where: { 
        id: user.activeProjectId,
        organizationId: user.organizationId 
      }
    })
  ]);

  if (!project) {
    throw redirect(303, '/projects');
  }

  return {
    zones,
    project
  };
}; 