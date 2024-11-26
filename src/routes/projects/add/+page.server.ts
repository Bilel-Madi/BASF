import { redirect } from "@sveltejs/kit";
import prisma from '$lib/prisma';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;

  if (!user) {
    throw redirect(303, '/');
  }

  // Prevent VIEWER role from accessing this page
  if (user.role === 'VIEWER') {
    throw redirect(303, '/projects');
  }

  // ... rest of the existing code ...
}; 