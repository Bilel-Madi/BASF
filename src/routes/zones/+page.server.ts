// src/routes/zones/+page.server.ts

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
    // Get the project for this organization
    const project = await prisma.project.findFirst({
      where: { organizationId: user.organizationId }
    });

    if (!project) {
      console.error('No project found for organization:', user.organizationId);
      throw redirect(303, '/');
    }

    // Get zones with their devices
    const zones = await prisma.zone.findMany({
      where: { organizationId: user.organizationId },
      include: {
        devices: true,
      },
    });

    return { 
      zones,
      project 
    };
  } catch (error) {
    console.error('Error fetching zones and project:', error);
    return { 
      zones: [],
      project: null 
    };
  }
};
