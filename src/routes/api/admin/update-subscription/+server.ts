import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import type { RequestHandler } from './$types';
import { SUBSCRIPTION_TIERS } from '$lib/constants/subscriptionTiers';

export const POST: RequestHandler = async ({ request, locals }) => {
  const user = locals.user;

  if (!user || user.role !== 'SUPER_ADMIN') {
    return new Response('Unauthorized', { status: 401 });
  }

  const { organizationId, status } = await request.json();

  try {
    const updatedOrg = await prisma.organization.update({
      where: { id: organizationId },
      data: { 
        subscriptionStatus: status,
        maxProjects: SUBSCRIPTION_TIERS[status].maxProjects,
        maxZones: SUBSCRIPTION_TIERS[status].maxZones,
        maxDevices: SUBSCRIPTION_TIERS[status].maxDevices
      }
    });

    return json(updatedOrg);
  } catch (error) {
    console.error('Error updating subscription:', error);
    return new Response('Server error', { status: 500 });
  }
}; 