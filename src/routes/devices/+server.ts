// src/routes/devices/+server.ts

import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, locals }) => {
  const user = locals.user;

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const {
    eui,
    name,
    type,
    modelName,
    installationDate,
    installedDepth,
    reportingInterval,
    location,
    zoneId,
  } = await request.json();

  // Basic validation
  if (!eui || !name || !type || !modelName || !installationDate || !reportingInterval || !location || !zoneId) {
    return new Response('Missing required fields', { status: 400 });
  }

  try {
    // Check if device exists in the database (assuming devices are pre-registered)
    const existingDevice = await prisma.device.findUnique({ where: { eui } });
    if (existingDevice) {
      return new Response('Device already exists', { status: 400 });
    }

    // Optionally, check if the EUI exists in a device catalog or similar

    // Assign the device to the user's organization via the zone
    const zone = await prisma.zone.findUnique({
      where: { id: zoneId },
    });

    if (!zone || zone.organizationId !== user.organizationId) {
      return new Response('Invalid zone assignment', { status: 400 });
    }

    // Create the device
    const device = await prisma.device.create({
      data: {
        eui,
        name,
        type,
        modelName,
        installationDate: new Date(installationDate),
        installedDepth: installedDepth || null,
        reportingInterval,
        location,
        zoneId,
      },
    });

    return json(device, { status: 201 });
  } catch (error) {
    console.error('Error adding device:', error);
    return new Response('Server error', { status: 500 });
  }
};
