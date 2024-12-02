// @ts-nocheck
import { error } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import type { PageServerLoad } from './$types';

export const load = async ({ params }: Parameters<PageServerLoad>[0]) => {
    const { slug } = params;

    const project = await prisma.project.findUnique({
        where: {
            publicSlug: slug,
            isPublic: true
        },
        include: {
            organization: {
                select: {
                    name: true
                }
            }
        }
    });

    if (!project) {
        throw error(404, 'Project not found');
    }

    // Fetch zones with devices (same as dashboard)
    const zones = await prisma.zone.findMany({
        where: { 
            projectId: project.id
        },
        include: {
            devices: true,
        },
    });

    // Fetch device readings (same as dashboard)
    const devicesWithReadings = await Promise.all(
        zones.flatMap((zone) =>
            zone.devices.map(async (device) => {
                let latestData = {};
                
                if (device.type === 'CO2_SENSOR') {
                    const data = await prisma.air.findMany({
                        where: { deviceId: device.eui },
                        orderBy: { receivedAt: 'desc' },
                        take: 100
                    });
                    latestData = {
                        ...data[0] || {},
                        history: data
                    };
                } else if (device.type === 'SOIL_MOISTURE') {
                    const data = await prisma.soil.findMany({
                        where: { deviceId: device.eui },
                        orderBy: { receivedAt: 'desc' },
                        take: 100
                    });
                    latestData = {
                        ...data[0] || {},
                        history: data
                    };
                } else if (device.type === 'LIQUID_LEVEL') {
                    const data = await prisma.liquid.findMany({
                        where: { deviceId: device.eui },
                        orderBy: { receivedAt: 'desc' },
                        take: 100
                    });
                    latestData = {
                        ...data[0] || {},
                        history: data
                    };
                }
                
                return { 
                    ...device, 
                    latestData,
                    zoneName: zone.name
                };
            })
        )
    );

    return {
        project,
        zones,
        devices: devicesWithReadings,
        organization: project.organization
    };
}; 