// @ts-nocheck
import { redirect } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import type { PageServerLoad } from './$types';

export const load = async ({ locals }: Parameters<PageServerLoad>[0]) => {
  const user = locals.user;

  if (!user) {
    throw redirect(303, '/');
  }

  // Check if user is SUPER_ADMIN
  if (user.role !== 'SUPER_ADMIN') {
    throw redirect(303, '/dashboard');
  }

  // Fetch all organizations with their details
  const organizations = await prisma.organization.findMany({
    include: {
      _count: {
        select: {
          Project: true,
          zones: true,
          users: true
        }
      },
      Project: {
        include: {
          zones: {
            include: {
              devices: true
            }
          }
        }
      },
      users: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true
        }
      }
    }
  });

  // Calculate total devices for each organization
  const organizationsWithDeviceCount = organizations.map(org => ({
    ...org,
    _count: {
      ...org._count,
      devices: org.Project.reduce((total, project) => 
        total + project.zones.reduce((zoneTotal, zone) => 
          zoneTotal + zone.devices.length, 0
        ), 0
      )
    }
  }));

  return {
    organizations: organizationsWithDeviceCount
  };
};
