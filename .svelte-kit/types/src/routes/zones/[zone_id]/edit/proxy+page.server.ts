// @ts-nocheck
import { error, redirect } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import type { PageServerLoad } from './$types';

export const load = async ({ params, locals }: Parameters<PageServerLoad>[0]) => {
    const user = locals.user;
    
    if (!user) {
        throw redirect(303, '/');
    }

    // Only allow ADMIN and SUPER_ADMIN to edit zones
    if (user.role === 'VIEWER') {
        throw error(403, 'Unauthorized: Viewers cannot edit zones');
    }

    const zone = await prisma.zone.findFirst({
        where: {
            id: params.zone_id,
            organizationId: user.organizationId
        },
        include: {
            waterWell: true,
            project: true
        }
    });

    if (!zone) {
        throw error(404, 'Zone not found');
    }

    console.log('Loading zone data:', zone); // Debug log

    return {
        zone,
        project: zone.project
    };
};
