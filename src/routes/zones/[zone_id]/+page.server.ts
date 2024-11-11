// src/routes/zones/[zone_id]/+page.server.ts

import { redirect } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
  const zoneId = params.zone_id;
  const user = locals.user;

  if (!user) {
    throw redirect(303, '/');
  }

  // Fetch the zone ensuring it belongs to the user's organization
  const zone = await prisma.zone.findUnique({
    where: { id: zoneId },
    include: {
      devices: true, // Include all devices assigned to this zone
    },
  });

  if (!zone || zone.organizationId !== user.organizationId) {
    throw redirect(303, '/zones');
  }

  return { zone };
};
