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
    const projectsQuery = user.role === 'SUPER_ADMIN'
      ? prisma.project.findMany({
          include: {
            _count: {
              select: { zones: true }
            },
            organization: {
              select: { name: true }
            }
          }
        })
      : prisma.project.findMany({
          where: { organizationId: user.organizationId },
          include: {
            _count: {
              select: { zones: true }
            }
          }
        });

    const deviceCountQuery = user.role === 'SUPER_ADMIN'
      ? {
          where: {
            zone: {
              projectId: user.activeProjectId || undefined
            }
          }
        }
      : {
          where: {
            zone: {
              organizationId: user.organizationId,
              projectId: user.activeProjectId || undefined
            }
          }
        };

    const [userDetails, deviceCount, projects] = await Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          organization: true,
          activeProject: true
        }
      }),
      prisma.device.count(deviceCountQuery),
      projectsQuery
    ]);

    const activeProject = projects.find(p => p.id === user.activeProjectId) || projects[0];

    const displayName = userDetails?.role === 'VIEWER' 
      ? 'Viewer'
      : userDetails?.firstName || userDetails?.email?.split('@')[0] || 'User';

    return {
      user,
      userDetails: {
        firstName: displayName,
        organizationName: userDetails?.organization?.name || '',
        role: userDetails?.role || '',
        deviceCount,
        zoneCount: activeProject?._count.zones || 0,
        projectCount: projects.length,
        projectName: activeProject?.name || '',
        projects: projects.map(p => ({
          ...p,
          name: user.role === 'SUPER_ADMIN' 
            ? `${p.name} (${p.organization.name})`
            : p.name
        })),
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
