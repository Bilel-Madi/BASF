import { redirect } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;

  if (!user) {
    throw redirect(303, '/');
  }

  // Prevent VIEWER role from accessing this page
  if (user.role === 'VIEWER') {
    throw redirect(303, '/dashboard');
  }

  const organization = await prisma.organization.findUnique({
    where: { id: user.organizationId },
  });

  if (!organization) {
    throw redirect(303, '/');
  }

  // Get statistics
  const [projectCount, zoneCount, deviceCount] = await Promise.all([
    prisma.project.count({
      where: { organizationId: organization.id }
    }),
    prisma.zone.count({
      where: { organizationId: organization.id }
    }),
    prisma.device.count({
      where: {
        zone: {
          organizationId: organization.id
        }
      }
    })
  ]);

  return {
    organization,
    stats: {
      projectCount,
      zoneCount,
      deviceCount
    }
  };
};
