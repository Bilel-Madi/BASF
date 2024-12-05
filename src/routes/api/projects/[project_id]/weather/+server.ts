import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/prisma';

export const PATCH: RequestHandler = async ({ params, request }) => {
	const { weatherLocation } = await request.json();
	
	try {
		const updatedProject = await prisma.project.update({
			where: { id: params.project_id },
			data: { weatherLocation }
		});

		return json(updatedProject);
	} catch (error) {
		console.error('Error updating project weather location:', error);
		return new Response('Failed to update weather location', { status: 500 });
	}
}; 