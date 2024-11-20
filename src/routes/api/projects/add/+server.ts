// src/routes/api/projects/add/+server.ts

import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, locals }) => {
  const user = locals.user;

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { name, purpose, geometry, center } = await request.json();

  if (!name || !purpose || !geometry || !center) {
    return new Response('Missing required fields', { status: 400 });
  }

  try {
    const project = await prisma.project.create({
      data: {
        name,
        purpose,
        geometry,
        center,
        organizationId: user.organizationId!,
      },
    });

    return json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return new Response('Server error', { status: 500 });
  }
};
