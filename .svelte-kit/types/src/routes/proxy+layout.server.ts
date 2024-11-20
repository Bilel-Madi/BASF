// @ts-nocheck
import { redirect } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import type { LayoutServerLoad } from './$types';

export const load = async ({ locals }: Parameters<LayoutServerLoad>[0]) => {
  const user = locals.user;

  if (!user) {
    return {
      user: null,
      userDetails: null
    };
  }

  try {
    const [userDetails, deviceCount, zoneCount, projectCount, project] = await Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        include: {
          organization: true
        }
      }),
      prisma.device.count({
        where: {
          zone: {
            organizationId: user.organizationId
          }
        }
      }),
      prisma.zone.count({
        where: { organizationId: user.organizationId }
      }),
      prisma.project.count({
        where: { organizationId: user.organizationId }
      }),
      prisma.project.findFirst({
        where: { organizationId: user.organizationId }
      })
    ]);

    return {
      user,
      userDetails: {
        firstName: userDetails?.firstName || '',
        organizationName: userDetails?.organization?.name || '',
        deviceCount,
        zoneCount,
        projectCount,
        projectName: project?.name || ''
      }
    };
  } catch (error) {
    console.error('Error loading user details:', error);
    return {
      user,
      userDetails: null
    };
  }
};
