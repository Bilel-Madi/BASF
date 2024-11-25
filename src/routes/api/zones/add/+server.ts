// src/routes/api/zones/add/+server.ts

import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import type { RequestHandler } from '@sveltejs/kit';
import type { ZoneColor } from '@prisma/client';

export const POST: RequestHandler = async ({ request, locals }) => {
  const user = locals.user;

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (!user.activeProjectId) {
    return new Response('No active project selected', { status: 400 });
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
    color,
    devices,
  } = await request.json();

  // Basic validation for required fields
  if (
    !name ||
    !cropType ||
    !plantingDate ||
    !harvestDate ||
    !soilType ||
    !geometry ||
    !area ||
    !color
  ) {
    return new Response('Missing required fields', { status: 400 });
  }

  // Validate the color against the ZoneColor enum
  const validColors: ZoneColor[] = [
    'PASTEL_PINK',
    'PASTEL_ORANGE',
    'PASTEL_YELLOW',
    'PASTEL_GREEN',
    'PASTEL_BLUE',
    'PASTEL_PURPLE',
  ];

  if (!validColors.includes(color as ZoneColor)) {
    return new Response('Invalid color selected', { status: 400 });
  }

  try {
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
        color,
        organizationId: user.organizationId,
        projectId: user.activeProjectId,
        devices: {
          connect: devices.map((deviceId: string) => ({ id: deviceId })),
        },
      },
    });

    return json(zone, { status: 201 });
  } catch (error) {
    console.error('Error creating zone:', error);
    return new Response('Server error', { status: 500 });
  }
};

// **Existing GET handler (if any)**

export const GET: RequestHandler = async ({ locals }) => {
  const user = locals.user;

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const zones = await prisma.zone.findMany({
      where: { organizationId: user.organizationId },
      include: {
        devices: true, // Include related devices
        project: true,  // Optionally include project details
      },
    });

    return json(zones, { status: 200 });
  } catch (error) {
    console.error('Error fetching zones:', error);
    return new Response('Server error', { status: 500 });
  }
};
