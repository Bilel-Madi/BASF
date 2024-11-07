// src/routes/zones/+page.server.ts

import { redirect } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;

  if (!user) {
    throw redirect(303, '/');
  }

  // Ensure the user has an organizationId
  if (!user.organizationId) {
    console.error('User has no organizationId:', user.id);
    throw redirect(303, '/'); // Or another appropriate route
  }

  // Fetch zones for the user's organization
  try {
    const zones = await prisma.zone.findMany({
      where: { organizationId: user.organizationId },
    });

    return { zones };
  } catch (error) {
    console.error('Error fetching zones:', error);
    return { zones: [] }; // Or handle the error as needed
  }
};
