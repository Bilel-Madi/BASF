// src/routes/api/zones/+server.ts

import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
  const user = locals.user;

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const zones = await prisma.zone.findMany({
    where: { organizationId: user.organizationId },
  });

  return json(zones);
};
