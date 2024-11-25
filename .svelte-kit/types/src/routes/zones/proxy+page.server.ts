// @ts-nocheck
// src/routes/zones/+page.server.ts

import { redirect } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import type { PageServerLoad } from './$types';

export const load = async ({ locals }: Parameters<PageServerLoad>[0]) => {
  const user = locals.user;

  if (!user) {
    console.log('No user found, redirecting to home');
    throw redirect(303, '/');
  }

  // Debug log user data
  console.log('User data:', {
    id: user.id,
    activeProjectId: user.activeProjectId,
    organizationId: user.organizationId
  });

  if (!user.activeProjectId) {
    console.log('No active project ID found for user');
    throw redirect(303, '/projects');
  }

  try {
    // Get the active project for this user
    const project = await prisma.project.findUnique({
      where: { 
        id: user.activeProjectId,
        organizationId: user.organizationId
      }
    });

    // Debug log project lookup result
    console.log('Project lookup result:', project);

    if (!project) {
      console.log('No project found with ID:', user.activeProjectId);
      throw redirect(303, '/projects');
    }

    // Get zones for the active project
    const zones = await prisma.zone.findMany({
      where: { 
        projectId: project.id,
        organizationId: user.organizationId 
      },
      include: {
        devices: true,
      },
    });

    // Debug log zones count
    console.log('Found zones:', zones.length);

    return { 
      zones,
      project 
    };
  } catch (error) {
    console.error('Error fetching zones and project:', error);
    throw redirect(303, '/projects');
  }
};
