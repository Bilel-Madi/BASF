import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	const user = locals.user;

	if (!user) {
		return new Response('Unauthorized', { status: 401 });
	}

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

	return json(organization);
};
