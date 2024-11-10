// src/routes/devices/+page.server.ts

import { redirect } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;

  if (!user) {
    throw redirect(303, '/');
  }

  if (!user.organizationId) {
    console.error('User has no organizationId:', user.id);
    throw redirect(303, '/');
  }

  // Fetch devices for the user's organization, including zone and latest readings
  const devices = await prisma.device.findMany({
    where: {
      zone: {
        organizationId: user.organizationId,
      },
    },
    include: {
      zone: true,
      // Include latest readings fields
      // Ensure that these fields are present in your Prisma schema
    },
    orderBy: {
      last_seen: 'desc', // Optional: Order devices by last seen
    },
  });

  return { devices };
};
