// src/routes/api/devices/+server.ts

import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals }) => {
  const user = locals.user;

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const devices = await prisma.device.findMany({
      select: {
        id: true,
        name: true,
        eui: true,
        type: true,
      }
    });

    return json(devices);
  } catch (error) {
    console.error('Error fetching devices:', error);
    return new Response('Server error', { status: 500 });
  }
};