// @ts-nocheck
// src/routes/zones/[zone_id]/+page.server.ts

import { redirect } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import type { PageServerLoad } from './$types';
import { subDays } from 'date-fns';

export const load = async ({ params, locals }: Parameters<PageServerLoad>[0]) => {
  const zoneId = params.zone_id;
  const user = locals.user;

  if (!user) {
    throw redirect(303, '/');
  }

  // Define the start date for 1 day's data
  const startDate = subDays(new Date(), 1);

  // Fetch the zone with devices
  const zone = await prisma.zone.findUnique({
    where: { id: zoneId },
    include: {
      devices: {
        include: {
          zone: true,
        }
      }
    }
  });

  if (!zone || zone.organizationId !== user.organizationId) {
    throw redirect(303, '/zones');
  }

  // Fetch data for all devices
  const enhancedDevices = await Promise.all(
    zone.devices.map(async (device) => {
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
      }

      return {
        ...device,
        mainReadings: [],
      };
    })
  );

  return {
    zone: {
      ...zone,
      devices: enhancedDevices
    }
  };
};
