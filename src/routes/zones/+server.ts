// src/routes/zones/+server.ts

import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, locals }) => {
  const user = locals.user;

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
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
  if (
    !name ||
    !cropType ||
    !plantingDate ||
    !harvestDate ||
    !soilType ||
    !geometry ||
    !area
  ) {
    return new Response('Missing required fields', { status: 400 });
  }

  try {
    // Create the zone
    const zone = await prisma.zone.create({
      data: {
        name,
        cropType,
        plantingDate: new Date(plantingDate),
        harvestDate: new Date(harvestDate),
        notes,
        soilType,
        geometry,
        area,
        organizationId: user.organizationId!,
      },
    });

    return json(zone, { status: 201 });
  } catch (error) {
    console.error('Error creating zone:', error);
    return new Response('Server error', { status: 500 });
  }
};
