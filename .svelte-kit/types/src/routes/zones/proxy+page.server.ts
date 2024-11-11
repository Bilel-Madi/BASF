// @ts-nocheck
// src/routes/zones/+page.server.ts

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

  try {
    const zones = await prisma.zone.findMany({
      where: { organizationId: user.organizationId },
      include: {
        devices: true, // Include assigned devices
      },
    });

    return { zones };
  } catch (error) {
    console.error('Error fetching zones:', error);
    return { zones: [] };
  }
};
