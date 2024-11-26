// @ts-nocheck
// src/routes/devices/[eui]/+page.server.ts

import prisma from '$lib/prisma';
import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = async ({ params, locals }: Parameters<PageServerLoad>[0]) => {
  const user = locals.user;

  if (!user) {
    throw redirect(303, '/');
  }

  const eui = params.eui;

  const [device, project] = await Promise.all([
    prisma.device.findUnique({
      where: { eui },
      include: { zone: true },
    }),
    prisma.project.findFirst({
      where: user.role === 'SUPER_ADMIN'
        ? { id: user.activeProjectId }
        : { 
            id: user.activeProjectId,
            organizationId: user.organizationId 
          }
    })
  ]);

  if (!device || 
      (user.role !== 'SUPER_ADMIN' && device.zone?.organizationId !== user.organizationId) ||
      device.zone?.projectId !== user.activeProjectId) {
    throw error(404, 'Device not found');
  }

  return { 
    device,
    project 
  };
};
