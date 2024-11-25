import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
  const user = locals.user;
  
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { projectId } = await request.json();
  console.log('Updating active project:', { userId: user.id, projectId });

  if (!projectId) {
    return new Response('Project ID is required', { status: 400 });
  }

  try {
    // Update user's active project
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { 
        activeProjectId: projectId,
        projectId: projectId  // Update both fields
      },
      include: {
        activeProject: true
      }
    });

    console.log('Updated user:', {
      id: updatedUser.id,
      activeProjectId: updatedUser.activeProjectId
    });

    return json({ 
      success: true, 
      user: updatedUser 
    });
  } catch (error) {
    console.error('Error updating active project:', error);
    return new Response('Failed to update active project', { status: 500 });
  }
};
