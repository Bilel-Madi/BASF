// src/routes/dashboard/+page.server.ts

import { redirect } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import type { PageServerLoad } from './$types';
import { subDays } from 'date-fns';

export const load: PageServerLoad = async ({ locals }) => {
  console.log('User:', locals.user);

  const user = locals.user;

  if (!user) {
    throw redirect(303, '/');
  }

  if (!user.organizationId) {
    console.error('User has no organizationId:', user.id);
    throw redirect(303, '/');
  }

  try {
    // Fetch zones with devices
    const zones = await prisma.zone.findMany({
      where: { organizationId: user.organizationId },
      include: {
        devices: true,
      },
    });
    console.log('Fetched zones:', JSON.stringify(zones, null, 2));

    // Fetch latest readings for devices
    const devicesWithReadings = await Promise.all(
      zones.flatMap(zone =>
        zone.devices.map(async device => {
          console.log('Processing device:', device.eui, 'Type:', device.type);
          
          let latestData = {};
          if (device.type === 'CO2_SENSOR') {
            const data = await prisma.air.findFirst({
              where: { deviceId: device.eui },
              orderBy: { receivedAt: 'desc' },
            });
            console.log('CO2 sensor latest data:', data);
            latestData = data || {};
          } else if (device.type === 'SOIL_MOISTURE') {
            const data = await prisma.soil.findFirst({
              where: { deviceId: device.eui },
              orderBy: { receivedAt: 'desc' },
            });
            console.log('Soil moisture latest data:', data);
            latestData = data || {};
          }
          return { ...device, latestData };
        })
      )
    );
    console.log('Final devices with readings:', JSON.stringify(devicesWithReadings, null, 2));

    return { zones, devices: devicesWithReadings };
  } catch (error) {
    console.error('Error fetching data:', error);
    return { zones: [], devices: [] };
  }
};
