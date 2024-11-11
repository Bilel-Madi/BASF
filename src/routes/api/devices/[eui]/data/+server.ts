// src/routes/api/devices/[eui]/data/+server.ts

import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import type { RequestHandler } from './$types';

// Helper function to calculate date ranges
function getDateRange(range: string): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  let startDate = new Date();

  switch (range) {
    case '1d':
      startDate.setDate(endDate.getDate() - 1);
      break;
    case '3d':
      startDate.setDate(endDate.getDate() - 3);
      break;
    case '1w':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case '2w':
      startDate.setDate(endDate.getDate() - 14);
      break;
    case '1m':
      startDate.setMonth(endDate.getMonth() - 1);
      break;
    case '3m':
      startDate.setMonth(endDate.getMonth() - 3);
      break;
    case '6m':
      startDate.setMonth(endDate.getMonth() - 6);
      break;
    case '1y':
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    case 'all':
      startDate = new Date('1970-01-01');
      break;
    default:
      throw new Error('Invalid date range');
  }

  return { startDate, endDate };
}

export const GET: RequestHandler = async ({ params, url, locals }) => {
  const user = locals.user;

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const eui = params.eui;

  // Validate device ownership
  const device = await prisma.device.findUnique({
    where: { eui },
    include: {
      zone: true,
    },
  });

  if (!device || device.zone?.organizationId !== user.organizationId) {
    return new Response('Device not found or access denied', { status: 404 });
  }

  // Get query parameters
  const range = url.searchParams.get('range') || '1d';
  const start = url.searchParams.get('start');
  const end = url.searchParams.get('end');

  let startDate: Date;
  let endDate: Date;

  if (start && end) {
    startDate = new Date(start);
    endDate = new Date(end);
  } else {
    try {
      const dates = getDateRange(range);
      startDate = dates.startDate;
      endDate = dates.endDate;
    } catch (error) {
      return new Response('Invalid date range', { status: 400 });
    }
  }

  // Fetch data based on device type
  let data = [];
  if (device.type === 'CO2_SENSOR') {
    data = await prisma.air.findMany({
      where: {
        deviceId: eui,
        receivedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { receivedAt: 'asc' },
    });
  } else if (device.type === 'SOIL_MOISTURE') {
    data = await prisma.soil.findMany({
      where: {
        deviceId: eui,
        receivedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { receivedAt: 'asc' },
    });
  } else {
    return new Response('Unknown device type', { status: 400 });
  }

  return json(data);
};
