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

  if (!user.activeProjectId) {
    throw redirect(303, '/projects');
  }

  const startDate = subDays(new Date(), 1);

  const devices = await prisma.device.findMany({
    where: user.role === 'SUPER_ADMIN'
      ? {
          zone: {
            projectId: user.activeProjectId
          }
        }
      : {
          zone: {
            organizationId: user.organizationId,
            projectId: user.activeProjectId
          }
        },
    include: {
      zone: true,
    },
    orderBy: [
      { type: 'asc' },
      { number: 'asc' },
    ],
  });

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
      } else if (device.type === 'LIQUID_LEVEL') {
        const data = await prisma.liquid.findMany({
          where: {
            deviceId: device.eui,
            receivedAt: { gte: startDate },
          },
          orderBy: { receivedAt: 'asc' },
        });

        return {
          ...device,
          mainReadings: data.map(dp => dp.liquid_level),
          temperatureReadings: data.map(dp => dp.temperature),
          latest_liquid_level: data[data.length - 1]?.liquid_level,
          latest_liquid_temperature: data[data.length - 1]?.temperature,
        };
      } else {
        return {
          ...device,
          mainReadings: [],
        };
      }
    })
  );

  return { devices: devicesWithData };
};
  