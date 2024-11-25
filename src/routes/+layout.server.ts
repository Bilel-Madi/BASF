import { redirect } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  const user = locals.user;

  if (!user) {
    return {
      user: null,
      userDetails: null
    };
  }

  try {
    const [userDetails, deviceCount, projects] = await Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        include: {
          organization: true,
          activeProject: true
        }
      }),
      prisma.device.count({
        where: {
          zone: {
            organizationId: user.organizationId,
            projectId: user.activeProjectId || undefined
          }
        }
      }),
      prisma.project.findMany({
        where: { organizationId: user.organizationId },
        include: {
          _count: {
            select: { zones: true }
          }
        }
      })
    ]);

    const activeProject = projects.find(p => p.id === user.activeProjectId) || projects[0];

    return {
      user,
      userDetails: {
        firstName: userDetails?.firstName || '',
        organizationName: userDetails?.organization?.name || '',
        deviceCount,
        zoneCount: activeProject?._count.zones || 0,
        projectCount: projects.length,
        projectName: activeProject?.name || '',
        projects: projects,
        projectId: activeProject?.id || ''
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
