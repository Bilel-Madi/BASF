// @ts-nocheck
// src/routes/devices/+page.server.ts

import { redirect } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import { subDays } from 'date-fns';
import type { PageServerLoad } from './$types';

export const load = async ({ locals }: Parameters<PageServerLoad>[0]) => {
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
      if (device.type === 'CO2_SENSOR') {
        const data = await prisma.air.findMany({
          where: {
            deviceId: device.eui,
            receivedAt: { gte: startDate },
          },
          orderBy: { receivedAt: 'asc' },
        });

        return {
          ...device,
          mainReadings: data.map(dp => dp.co2),
          humidityReadings: data.map(dp => dp.humidity),
          temperatureReadings: data.map(dp => dp.temperature),
          pressureReadings: data.map(dp => dp.pressure),
          latest_co2: data[data.length - 1]?.co2,
          latest_humidity: data[data.length - 1]?.humidity,
          latest_temperature: data[data.length - 1]?.temperature,
          latest_pressure: data[data.length - 1]?.pressure,
        };
      } else if (device.type === 'SOIL_MOISTURE') {
        const data = await prisma.soil.findMany({
          where: {
            deviceId: device.eui,
            receivedAt: { gte: startDate },
          },
          orderBy: { receivedAt: 'asc' },
        });

        return {
          ...device,
          mainReadings: data.map(dp => dp.moisture),
          ecReadings: data.map(dp => dp.ec),
          soilTempReadings: data.map(dp => dp.temperature),
          latest_moisture: data[data.length - 1]?.moisture,
          latest_ec: data[data.length - 1]?.ec,
          latest_soil_temperature: data[data.length - 1]?.temperature,
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
  