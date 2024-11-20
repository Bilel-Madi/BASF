// src/routes/api/zones/add/+server.ts

import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import type { RequestHandler } from '@sveltejs/kit';
import type { ZoneColor } from '@prisma/client';

export const POST: RequestHandler = async ({ request, locals }) => {
  const user = locals.user;

  // Check if the user is authenticated
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Destructure and parse the incoming JSON data
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
    devices, // Array of device IDs to assign
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
    // **Fetch the user's project**
    // Assuming each organization has at least one project
    const project = await prisma.project.findFirst({
      where: { organizationId: user.organizationId },
    });

    // If no project is found, prompt the user to add one
    if (!project) {
      return new Response('No project found for the organization. Please add a project first.', { status: 400 });
    }

    // **Create the Zone with both organizationId and projectId**
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
        organizationId: user.organizationId, // Ensure this is correctly set
        projectId: project.id, // Include the fetched projectId
        devices: {
          connect: devices.map((deviceId: string) => ({ id: deviceId })),
        },
      },
    });

    // **Optionally, update devices to associate them with the new zone**
    // This depends on your schema and whether devices should be linked to zones
    // Uncomment the following block if needed

    /*
    await prisma.device.updateMany({
      where: {
        id: { in: devices },
        organizationId: user.organizationId, // Ensure devices belong to the organization
      },
      data: {
        zoneId: zone.id,
      },
    });
    */

    // Return the created zone as a JSON response
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
