import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
  const user = locals.user;

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const data = await request.json();

  const {
    eui,
    name,
    modelName,
    installationDate,
    installedDepth,
    location,
    reportingInterval,
    zoneId,
  } = data;

  if (
    !eui ||
    !name ||
    !modelName ||
    !installationDate ||
    !reportingInterval ||
    !zoneId
  ) {
    return new Response('Missing required fields', { status: 400 });
  }

  // Check if device exists and is unassigned
  const device = await prisma.device.findUnique({ where: { eui } });

  if (!device) {
    return new Response('Sensor not available', { status: 400 });
  }

  if (device.zoneId) {
    return new Response('Device is already registered to another user', { status: 400 });
  }

  // Check if the zone belongs to the user's organization
  const zone = await prisma.zone.findUnique({ where: { id: zoneId } });

  if (!zone || zone.organizationId !== user.organizationId) {
    return new Response('Invalid zone', { status: 400 });
  }

  // Assign device number
  const maxNumber = await prisma.device.aggregate({
    _max: {
      number: true,
    },
    where: {
      type: device.type,
      zone: {
        organizationId: user.organizationId,
      },
    },
  });

  const nextNumber = (maxNumber._max.number || 0) + 1;

  // Parse location
  let locationJson = null;
  if (location) {
    const [latStr, lngStr] = location.split(',');
    const latitude = parseFloat(latStr);
    const longitude = parseFloat(lngStr);
    if (isNaN(latitude) || isNaN(longitude)) {
      return new Response('Invalid location format', { status: 400 });
    }
    locationJson = { latitude, longitude };
  }

  // Update device
  try {
    await prisma.device.update({
      where: { eui },
      data: {
        name,
        modelName,
        installationDate: new Date(installationDate),
        installedDepth: installedDepth ? parseFloat(installedDepth) : null,
        location: locationJson,
        reportingInterval: parseInt(reportingInterval),
        zoneId,
        number: nextNumber,
      },
    });

    return new Response('Device registered', { status: 200 });
  } catch (error) {
    console.error('Error registering device:', error);
    return new Response('Server error', { status: 500 });
  }
};
