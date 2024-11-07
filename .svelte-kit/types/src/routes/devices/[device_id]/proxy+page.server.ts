// @ts-nocheck
// src/routes/devices/[device_id]/+page.server.ts

import { redirect } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import type { PageServerLoad, Actions } from './$types';

export const load = async ({ params, locals }: Parameters<PageServerLoad>[0]) => {
  const deviceId = params.device_id;
  const user = locals.user;

  if (!user) {
    throw redirect(303, '/');
  }

  // Fetch the device ensuring it belongs to the user's organization via the zone
  const device = await prisma.device.findUnique({
    where: { id: deviceId },
    include: { zone: true },
  });

  if (!device || device.zone.organizationId !== user.organizationId) {
    throw redirect(303, '/devices');
  }

  return { device };
};

export const actions = {
  update: async ({ request, params, locals }: import('./$types').RequestEvent) => {
    const deviceId = params.device_id;
    const user = locals.user;

    if (!user) {
      return { status: 401, body: 'Unauthorized' };
    }

    const device = await prisma.device.findUnique({
      where: { id: deviceId },
      include: { zone: true },
    });

    if (!device || device.zone.organizationId !== user.organizationId) {
      return { status: 403, body: 'Forbidden' };
    }

    const {
      name,
      type,
      modelName,
      installationDate,
      installedDepth,
      reportingInterval,
      location,
      zoneId,
    } = await request.json();

    // Basic validation
    if (!name || !type || !modelName || !installationDate || !reportingInterval || !location || !zoneId) {
      return { status: 400, body: 'Missing required fields' };
    }

    try {
      // Verify that the new zone belongs to the user's organization
      const zone = await prisma.zone.findUnique({
        where: { id: zoneId },
      });

      if (!zone || zone.organizationId !== user.organizationId) {
        return { status: 400, body: 'Invalid zone assignment' };
      }

      // Update the device
      const updatedDevice = await prisma.device.update({
        where: { id: deviceId },
        data: {
          name,
          type,
          modelName,
          installationDate: new Date(installationDate),
          installedDepth: installedDepth || null,
          reportingInterval: parseInt(reportingInterval, 10),
          location,
          zoneId,
        },
      });

      return { status: 200, body: updatedDevice };
    } catch (error) {
      console.error('Error updating device:', error);
      return { status: 500, body: 'Server error' };
    }
  },
};
;null as any as Actions;