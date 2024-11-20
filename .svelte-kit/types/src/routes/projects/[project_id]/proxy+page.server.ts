// @ts-nocheck
// src/routes/projects/[project_id]/+page.server.ts

import { redirect } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import type { PageServerLoad } from './$types';

export const load = async ({ params, locals }: Parameters<PageServerLoad>[0]) => {
  console.log('Params:', params);
  const projectId = params.project_id;
  console.log('Project ID:', projectId);
  const user = locals.user;
  


  if (!user) {
    throw redirect(303, '/');
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project || project.organizationId !== user.organizationId) {
    throw redirect(303, '/projects');
  }

  return { project };
};
