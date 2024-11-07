// src/routes/zones/[zone_id]/+page.server.ts

import { redirect } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
  const zoneId = params.zone_id;
  const user = locals.user;

  if (!user) {
    throw redirect(303, '/');
  }

  // Fetch the zone ensuring it belongs to the user's organization
  const zone = await prisma.zone.findUnique({
    where: { id: zoneId },
  });

  if (!zone || zone.organizationId !== user.organizationId) {
    throw redirect(303, '/zones');
  }

  return { zone };
};

export const actions: Actions = {
  update: async ({ request, params, locals }) => {
    const zoneId = params.zone_id;
    const user = locals.user;

    if (!user) {
      return { status: 401, body: 'Unauthorized' };
    }

    const zone = await prisma.zone.findUnique({
      where: { id: zoneId },
    });

    if (!zone || zone.organizationId !== user.organizationId) {
      return { status: 403, body: 'Forbidden' };
    }

    const {
      name,
      cropType,
      plantingDate,
      harvestDate,
      notes,
      soilType,
      geometry,
      area,
    } = await request.json();

    // Basic validation
    if (!name || !cropType || !plantingDate || !harvestDate || !soilType || !geometry || !area) {
      return { status: 400, body: 'Missing required fields' };
    }

    try {
      // Update the zone
      const updatedZone = await prisma.zone.update({
        where: { id: zoneId },
        data: {
          name,
          cropType,
          plantingDate: new Date(plantingDate),
          harvestDate: new Date(harvestDate),
          notes,
          soilType,
          geometry,
          area,
        },
      });

      return { status: 200, body: updatedZone };
    } catch (error) {
      console.error('Error updating zone:', error);
      return { status: 500, body: 'Server error' };
    }
  },
};

