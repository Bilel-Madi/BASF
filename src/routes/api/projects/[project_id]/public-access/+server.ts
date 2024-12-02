import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import type { RequestHandler } from './$types';
import { nanoid } from 'nanoid';

export const POST: RequestHandler = async ({ params, request, locals }) => {
  const user = locals.user;
  
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { isPublic, publicTitle, publicDescription } = await request.json();
  const projectId = params.project_id;

  try {
    const project = await prisma.project.update({
      where: { 
        id: projectId,
        organizationId: user.organizationId 
      },
      data: {
        isPublic,
        publicSlug: isPublic ? nanoid(10) : null,
        publicTitle,
        publicDescription
      }
    });

    return json({
      success: true,
      publicUrl: isPublic ? `/public/${project.publicSlug}` : null
    });
  } catch (error) {
    console.error('Error updating public access:', error);
    return new Response('Server error', { status: 500 });
  }
}; 