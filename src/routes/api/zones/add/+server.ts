// src/routes/api/zones/add/+server.ts

import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import type { RequestHandler } from '@sveltejs/kit';
import type { ZoneColor, ZoneType } from '@prisma/client';

export const POST: RequestHandler = async ({ request, locals }) => {
  const user = locals.user;

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (!user.activeProjectId) {
    return new Response('No active project selected', { status: 400 });
  }

  const data = await request.json();
  const {
    name,
    geometry,
    area,
    color,
    zoneType,
    // Crop specific fields
    cropType,
    plantingDate,
    harvestDate,
    notes,
    soilType,
    // Water well specific fields
    waterWell
  } = data;

  // Basic validation for common required fields
  if (!name || !geometry || !area || !color || !zoneType) {
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
    // Validate zone-type specific fields
    if (zoneType === 'CROP') {
      if (!cropType || !plantingDate || !harvestDate || !soilType) {
        return new Response('Missing required crop fields', { status: 400 });
      }
    } else if (zoneType === 'WATER_WELL') {
      if (!waterWell || !waterWell.depth || !waterWell.wellDiameter || !waterWell.constructionDate) {
        return new Response('Missing required water well fields', { status: 400 });
      }
    }

    // Create the zone with the appropriate data
    const zone = await prisma.zone.create({
      data: {
        name,
        geometry,
        area,
        color,
        zoneType,
        organizationId: user.organizationId,
        projectId: user.activeProjectId,
        // Conditional fields based on zone type
        ...(zoneType === 'CROP' && {
          cropType,
          plantingDate: new Date(plantingDate),
          harvestDate: new Date(harvestDate),
          notes,
          soilType,
        }),
        ...(zoneType === 'WATER_WELL' && {
          waterWell: {
            create: {
              depth: waterWell.depth,
              wellDiameter: waterWell.wellDiameter,
              constructionDate: new Date(waterWell.constructionDate)
            }
          }
        })
      },
      include: {
        waterWell: true // Include water well data in the response
      }
    });

    return json(zone, { status: 201 });
  } catch (error) {
    console.error('Error creating zone:', error);
    return new Response('Server error', { status: 500 });
  }
};

export const GET: RequestHandler = async ({ locals }) => {
  const user = locals.user;

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const zones = await prisma.zone.findMany({
      where: { organizationId: user.organizationId },
      include: {
        devices: true,
        project: true,
        waterWell: true // Include water well data
      },
    });

    return json(zones, { status: 200 });
  } catch (error) {
    console.error('Error fetching zones:', error);
    return new Response('Server error', { status: 500 });
  }
};
