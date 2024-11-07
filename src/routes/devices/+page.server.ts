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
    throw redirect(303, '/'); // Or another appropriate route
  }

  try {
    // Fetch zones for the user's organization
    const zones = await prisma.zone.findMany({
      where: { organizationId: user.organizationId },
      select: { id: true, name: true }
    });

    // Optionally, fetch devices as well
    const devices = await prisma.device.findMany({
      where: { zone: { organizationId: user.organizationId } },
      select: { id: true, name: true }
    });

    return { zones, devices };
  } catch (error) {
    console.error('Error fetching zones or devices:', error);
    return { zones: [], devices: [] };
  }
};
