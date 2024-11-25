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
    // First check for active project
    if (!user.activeProjectId) {
      console.log('No active project, redirecting to projects');
      throw redirect(303, '/projects');
    }

    // Fetch the user's active project
    const project = await prisma.project.findUnique({
      where: { 
        id: user.activeProjectId,
        organizationId: user.organizationId 
      },
    });

    if (!project) {
      console.log('Active project not found, redirecting to projects');
      throw redirect(303, '/projects');
    }

    // Fetch zones associated with the active project
    const zones = await prisma.zone.findMany({
      where: { 
        projectId: project.id,
        organizationId: user.organizationId 
      },
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

    return { 
      project, 
      zones, 
      devices: devicesWithReadings 
    };
  } catch (error) {
    if (error instanceof Response) {
      throw error; // Re-throw redirect responses
    }
    console.error('Error fetching dashboard data:', error);
    return { 
      project: null, 
      zones: [], 
      devices: [] 
    };
  }
};
