// src/routes/zones/[zone_id]/+server.ts

import { redirect } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ params, locals }) => {
  const zoneId = params.zone_id;
  const user = locals.user;

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const zone = await prisma.zone.findUnique({
    where: { id: zoneId },
  });

  if (!zone || zone.organizationId !== user.organizationId) {
    return new Response('Forbidden', { status: 403 });
  }

  try {
    // Delete the zone and cascade to devices
    await prisma.zone.delete({
      where: { id: zoneId },
    });

    throw redirect(303, '/zones');
  } catch (error) {
    console.error('Error deleting zone:', error);
    return new Response('Server error', { status: 500 });
  }
};
