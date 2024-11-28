// @ts-nocheck
import { redirect } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import type { PageServerLoad } from './$types';

export const load = async ({ params, locals }: Parameters<PageServerLoad>[0]) => {
    const user = locals.user;
    const zoneId = params.zone_id;

    if (!user) {
        throw redirect(303, '/');
    }

    if (!user.activeProjectId) {
        throw redirect(303, '/projects');
    }

    try {
        const [zone, project] = await Promise.all([
            prisma.zone.findFirst({
                where: { 
                    id: zoneId,
                    organizationId: user.organizationId 
                }
            }),
            prisma.project.findUnique({
                where: { 
                    id: user.activeProjectId,
                    organizationId: user.organizationId 
                }
            })
        ]);

        if (!zone) {
            throw redirect(303, '/zones');
        }

        if (!project) {
            throw redirect(303, '/projects');
        }

        return {
            zone,
            project
        };
    } catch (error) {
        console.error('Error loading zone for editing:', error);
        throw redirect(303, '/zones');
    }
};