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
    // Get organization details including project count
    const organization = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      include: {
        _count: {
          select: { Project: true }
        }
      }
    });

    if (!organization) {
      return new Response('Organization not found', { status: 404 });
    }

    // Check if project limit is reached
    if (organization._count.Project >= organization.maxProjects) {
      return new Response(
        'Project limit reached. Please upgrade your subscription to add more projects.',
        { status: 403 }
      );
    }

    const project = await prisma.project.create({
      data: {
        name,
        purpose,
        geometry,
        center,
        organizationId: user.organizationId!,
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { 
        activeProjectId: project.id,
        projectId: project.id
      }
    });

    return json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return new Response('Server error', { status: 500 });
  }
};
