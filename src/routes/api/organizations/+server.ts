// src/routes/api/organizations/+server.ts

import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, locals }) => {
  const user = locals.user;

  if (!user || user.role !== 'SUPER_ADMIN') {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const data = await request.json();

    const { name, address, contactInfo } = data;

    if (!name) {
      return new Response('Missing required fields', { status: 400 });
    }

    const existingOrg = await prisma.organization.findUnique({ where: { name } });

    if (existingOrg) {
      return new Response('Organization with this name already exists', { status: 400 });
    }

    const organization = await prisma.organization.create({
      data: {
        name,
        address,
        contactInfo,
      },
    });

    return json(organization, { status: 201 });
  } catch (error) {
    console.error('Error creating organization:', error);
    return new Response('Server error', { status: 500 });
  }
};

// Existing GET handler to retrieve organizations
export const GET: RequestHandler = async ({ locals }) => {
  const user = locals.user;

  if (!user || user.role !== 'SUPER_ADMIN') {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const organizations = await prisma.organization.findMany();

    return json(organizations);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return new Response('Server error', { status: 500 });
  }
};
