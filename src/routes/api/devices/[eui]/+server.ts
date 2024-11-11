// src/routes/api/devices/[deviceId]/+server.ts

import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ params, locals }) => {
  const user = locals.user;

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const deviceId = params.deviceId;

  // Validate device ownership
  const device = await prisma.device.findUnique({
    where: { id: deviceId },
    include: {
      zone: true,
    },
  });

  if (!device || device.zone?.organizationId !== user.organizationId) {
    return new Response('Device not found or access denied', { status: 404 });
  }

  // Unlink the device from its zone and delete metadata
  await prisma.device.update({
    where: { id: deviceId },
    data: {
      zoneId: null,
      number: null,
      name: 'Unassigned Device',
      // Optionally, reset other metadata fields
    },
  });

  return new Response('Device unlinked successfully', { status: 200 });
};
