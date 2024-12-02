import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import type { RequestHandler } from './$types';

function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 50); // Limit length
}

export const POST: RequestHandler = async ({ params, request, locals }) => {
  const user = locals.user;
  
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { isPublic, publicTitle, publicDescription } = await request.json();
  const projectId = params.project_id;

  try {
    // Get the project first to access its name
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!existingProject) {
      return new Response('Project not found', { status: 404 });
    }

    // Generate base slug from project name
    let slug = createSlug(existingProject.name);
    
    // Check if slug exists and append number if needed
    let counter = 1;
    let finalSlug = slug;
    
    while (true) {
      const existing = await prisma.project.findUnique({
        where: { publicSlug: finalSlug }
      });
      
      if (!existing || existing.id === projectId) {
        break;
      }
      
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    const project = await prisma.project.update({
      where: { 
        id: projectId,
        organizationId: user.organizationId 
      },
      data: {
        isPublic,
        publicSlug: isPublic ? finalSlug : null,
        publicTitle,
        publicDescription
      }
    });

    return json({
      success: true,
      publicUrl: isPublic ? `/demo/${project.publicSlug}` : null
    });
  } catch (error) {
    console.error('Error updating public access:', error);
    return new Response('Server error', { status: 500 });
  }
}; 