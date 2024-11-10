import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
  const user = locals.user;

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const data = await request.json();
  const eui = data.eui;

  if (!eui) {
    return new Response('Device EUI is required', { status: 400 });
  }

  // Check if device exists and is unassigned
  const device = await prisma.device.findUnique({ where: { eui } });

  if (!device) {
    return new Response('Sensor not available', { status: 400 });
  }

  if (device.zoneId) {
    return new Response('Device is already registered to another user', { status: 400 });
  }

  // Return device data to client
  return json(device);
};
