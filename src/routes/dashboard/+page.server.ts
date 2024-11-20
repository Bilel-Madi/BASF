// src/routes/dashboard/+page.server.ts

import { redirect } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;

  if (!user) {
    throw redirect(303, '/');
  }

  if (!user.organizationId) {
    console.error('User has no organizationId:', user.id);
    throw redirect(303, '/');
  }

  try {
    // Fetch the user's project
    const project = await prisma.project.findFirst({
      where: { organizationId: user.organizationId },
    });

    if (!project) {
      throw redirect(303, '/projects/add');
    }

    // Fetch zones associated with the project
    const zones = await prisma.zone.findMany({
      where: { projectId: project.id },
      include: {
        devices: true,
      },
    });

    // Fetch latest readings for devices
    const devicesWithReadings = await Promise.all(
      zones.flatMap((zone) =>
        zone.devices.map(async (device) => {
          let latestData = {};
          if (device.type === 'CO2_SENSOR') {
            const data = await prisma.air.findFirst({
              where: { deviceId: device.eui },
              orderBy: { receivedAt: 'desc' },
            });
            latestData = data || {};
          } else if (device.type === 'SOIL_MOISTURE') {
            const data = await prisma.soil.findFirst({
              where: { deviceId: device.eui },
              orderBy: { receivedAt: 'desc' },
            });
            latestData = data || {};
          }
          return { ...device, latestData };
        })
      )
    );

    return { project, zones, devices: devicesWithReadings };
  } catch (error) {
    console.error('Error fetching data:', error);
    return { project: null, zones: [], devices: [] };
  }
};
