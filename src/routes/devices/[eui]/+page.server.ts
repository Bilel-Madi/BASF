// src/routes/devices/[eui]/+page.server.ts

import prisma from '$lib/prisma';
import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
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
      where: { organizationId: user.organizationId }
    })
  ]);

  if (!device || device.zone?.organizationId !== user.organizationId) {
    throw error(404, 'Device not found');
  }

  return { 
    device,
    project 
  };
};
