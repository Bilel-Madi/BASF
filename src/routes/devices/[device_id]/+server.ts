// src/routes/devices/[device_id]/+server.ts

import { redirect } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ params, locals }) => {
  const deviceId = params.device_id;
  const user = locals.user;

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const device = await prisma.device.findUnique({
    where: { id: deviceId },
    include: { zone: true },
  });

  if (!device || device.zone.organizationId !== user.organizationId) {
    return new Response('Forbidden', { status: 403 });
  }

  try {
    // Delete the device
    await prisma.device.delete({
      where: { id: deviceId },
    });

    throw redirect(303, '/devices');
  } catch (error) {
    console.error('Error deleting device:', error);
    return new Response('Server error', { status: 500 });
  }
};
