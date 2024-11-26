// @ts-nocheck
// src/routes/dashboard/+page.server.ts

import { redirect } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import type { PageServerLoad } from './$types';

export const load = async ({ locals }: Parameters<PageServerLoad>[0]) => {
  const user = locals.user;

  if (!user) {
    throw redirect(303, '/');
  }

  try {
    if (!user.activeProjectId) {
      console.log('No active project, redirecting to projects');
      throw redirect(303, '/projects');
    }

    // Fetch the project with organization
    const project = await prisma.project.findUnique({
      where: user.role === 'SUPER_ADMIN' 
        ? { id: user.activeProjectId }
        : { 
            id: user.activeProjectId,
            organizationId: user.organizationId 
          },
      include: {
        organization: {
          select: {
            name: true
          }
        }
      }
    });

    if (!project) {
      console.log('Active project not found, redirecting to projects');
      throw redirect(303, '/projects');
    }

    // Fetch zones with devices
    const zones = await prisma.zone.findMany({
      where: { 
        projectId: project.id,
        ...(user.role !== 'SUPER_ADMIN' && { organizationId: user.organizationId })
      },
      include: {
        devices: true,
      },
    });

    // Fetch device readings
    const devicesWithReadings = await Promise.all(
      zones.flatMap((zone) =>
        zone.devices.map(async (device) => {
          let latestData = {};
          
          if (device.type === 'CO2_SENSOR') {
            const data = await prisma.air.findMany({
              where: { 
                deviceId: device.eui,
                Device: {
                  zoneId: zone.id,
                  zone: {
                    projectId: project.id
                  }
                }
              },
              orderBy: { receivedAt: 'desc' },
              take: 100
            });
            latestData = {
              ...data[0] || {},
              history: data
            };
          } else if (device.type === 'SOIL_MOISTURE') {
            const data = await prisma.soil.findMany({
              where: { 
                deviceId: device.eui,
                Device: {
                  zoneId: zone.id,
                  zone: {
                    projectId: project.id
                  }
                }
              },
              orderBy: { receivedAt: 'desc' },
              take: 100
            });
            latestData = {
              ...data[0] || {},
              history: data
            };
          }
          
          return { 
            ...device, 
            latestData,
            zoneName: zone.name,
            organizationId: zone.organizationId // Include organizationId for SUPER_ADMIN
          };
        })
      )
    );

    return { 
      project, 
      zones, 
      devices: devicesWithReadings, 
      organization: project.organization 
    };
  } catch (error) {
    if (error instanceof Response) {
      throw error; // Re-throw redirect responses
    }
    console.error('Error fetching dashboard data:', error);
    return { 
      project: null, 
      zones: [], 
      devices: [], 
      organization: null 
    };
  }
};
