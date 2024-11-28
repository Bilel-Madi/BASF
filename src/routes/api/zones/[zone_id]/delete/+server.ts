import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ params, locals }) => {
    const user = locals.user;
    const zoneId = params.zone_id;

    if (!user) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        // First check if the zone exists and belongs to the user's organization
        const zone = await prisma.zone.findFirst({
            where: {
                id: zoneId,
                organizationId: user.organizationId
            }
        });

        if (!zone) {
            return new Response('Zone not found', { status: 404 });
        }

        // Delete the zone
        await prisma.zone.delete({
            where: { id: zoneId }
        });

        return json({ success: true });
    } catch (error) {
        console.error('Error deleting zone:', error);
        return new Response('Server error', { status: 500 });
    }
}; 