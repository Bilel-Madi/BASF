import { redirect } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
  const user = locals.user;
  const projectId = params.project_id;

  if (!user) {
    throw redirect(303, '/');
  }

  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    }
  });

  if (!project || (user.role !== 'SUPER_ADMIN' && project.organizationId !== user.organizationId)) {
    throw redirect(303, '/projects');
  }

  return {
    project
  };
}; 