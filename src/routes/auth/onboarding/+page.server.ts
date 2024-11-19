// src/routes/auth/onboarding/+page.server.ts

import { fail, redirect } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Redirect to zones if user is already onboarded
	if (!locals.user) {
		throw redirect(302, '/auth/login');
	}

	if (locals.user.firstName && locals.user.lastName) {
		throw redirect(302, '/zones');
	}

	return {};
};

export const actions = {
	default: async ({ request, locals }) => {
		if (!locals.user) {
			throw redirect(302, '/auth/login');
		}

		const formData = await request.formData();
		const firstName = formData.get('firstName') as string;
		const lastName = formData.get('lastName') as string;
		const organizationName = formData.get('organizationName') as string;

		if (!firstName || !lastName || !organizationName) {
			return fail(400, { error: 'All fields are required' });
		}

		try {
			await prisma.user.update({
				where: { id: locals.user.id },
				data: {
					firstName,
					lastName,
					organization: {
						update: {
							name: organizationName
						}
					}
				}
			});
		} catch (error) {
			console.error('Onboarding Error:', error);
			return fail(500, { error: 'Internal server error' });
		}

		throw redirect(303, '/zones');
	}
}; 