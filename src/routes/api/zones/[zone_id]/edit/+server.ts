import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import type { RequestHandler } from './$types';
import type { ZoneColor, ZoneType } from '@prisma/client';

export const PUT: RequestHandler = async ({ params, request, locals }) => {
    const user = locals.user;
    const zoneId = params.zone_id;

    if (!user) {
        return new Response('Unauthorized', { status: 401 });
    }

    const data = await request.json();
    const {
        name,
        geometry,
        area,
        color,
        zoneType,
        cropType,
        plantingDate,
        harvestDate,
        notes,
        soilType,
        waterWell
    } = data;

    try {
        // Check if zone exists and belongs to user's organization
        const existingZone = await prisma.zone.findFirst({
            where: {
                id: zoneId,
                organizationId: user.organizationId
            },
            include: {
                waterWell: true
            }
        });

        if (!existingZone) {
            return new Response('Zone not found', { status: 404 });
        }

        // Prepare update data based on zone type
        const updateData: any = {
            name,
            geometry,
            area,
            color,
            zoneType
        };

        if (zoneType === 'CROP') {
            Object.assign(updateData, {
                cropType,
                plantingDate: new Date(plantingDate),
                harvestDate: new Date(harvestDate),
                notes,
                soilType
            });
        }

        // Update the zone
        const updatedZone = await prisma.zone.update({
            where: { id: zoneId },
            data: updateData,
            include: {
                waterWell: true
            }
        });

        // Handle water well data separately if needed
        if (zoneType === 'WATER_WELL' && waterWell) {
            if (existingZone.waterWell) {
                await prisma.waterWell.update({
                    where: { zoneId },
                    data: {
                        depth: waterWell.depth,
                        wellDiameter: waterWell.wellDiameter,
                        constructionDate: new Date(waterWell.constructionDate)
                    }
                });
            } else {
                await prisma.waterWell.create({
                    data: {
                        depth: waterWell.depth,
                        wellDiameter: waterWell.wellDiameter,
                        constructionDate: new Date(waterWell.constructionDate),
                        zoneId
                    }
                });
            }
        }

        return json(updatedZone);
    } catch (error) {
        console.error('Error updating zone:', error);
        return new Response('Server error', { status: 500 });
    }
};
