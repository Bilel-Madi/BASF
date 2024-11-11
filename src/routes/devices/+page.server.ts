// src/routes/devices/+page.server.ts

import { redirect } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import { subDays } from 'date-fns';
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

  // Define the start date for 1 day's data
  const startDate = subDays(new Date(), 1);

  // Fetch devices for the user's organization
  const devices = await prisma.device.findMany({
    where: {
      zone: {
        organizationId: user.organizationId,
      },
    },
    include: {
      zone: true,
    },
    // Sort devices by type and then by number
    orderBy: [
      {
        type: 'asc',
      },
      {
        number: 'asc',
      },
    ],
  });

  // Fetch data for all devices
  const devicesWithData = await Promise.all(
    devices.map(async (device) => {
      let data = [];

      if (device.type === 'CO2_SENSOR') {
        data = await prisma.air.findMany({
          where: {
            deviceId: device.eui,
            receivedAt: {
              gte: startDate,
            },
          },
          orderBy: { receivedAt: 'asc' },
          select: {
            receivedAt: true,
            co2: true,
          },
        });

        // Extract the main readings
        const mainReadings = data.map((dp) => dp.co2);

        return {
          ...device,
          mainReadings,
        };
      } else if (device.type === 'SOIL_MOISTURE') {
        data = await prisma.soil.findMany({
          where: {
            deviceId: device.eui,
            receivedAt: {
              gte: startDate,
            },
          },
          orderBy: { receivedAt: 'asc' },
          select: {
            receivedAt: true,
            moisture: true,
          },
        });

        // Extract the main readings
        const mainReadings = data.map((dp) => dp.moisture);

        return {
          ...device,
          mainReadings,
        };
      } else {
        // If device type is unknown, return device without data
        return {
          ...device,
          mainReadings: [],
        };
      }
    })
  );

  return { devices: devicesWithData };
};
  