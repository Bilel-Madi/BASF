// src/routes/api/devices/[device_id]/historical/+server.ts
import prisma from '$lib/prisma';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params, url }) => {
  try {
    const device = await prisma.device.findUnique({
      where: { device_id: params.device_id },
    });

    if (!device) {
      return new Response(JSON.stringify({ message: 'Device not found' }), { status: 404 });
    }

    const dataModelMapping = {
      soil_moisture: 'deviceData',
      co2_sensor: 'co2Data',
    };

    const dataModelName = dataModelMapping[device.device_type];

    if (!dataModelName) {
      return new Response(JSON.stringify({ message: 'Unknown device type' }), { status: 400 });
    }

    const time_range = url.searchParams.get('time_range');
    const start_date_param = url.searchParams.get('start_date');
    const end_date_param = url.searchParams.get('end_date');

    let startDate: Date | null = null;
    let endDate = new Date();

    if (start_date_param && end_date_param) {
      startDate = new Date(start_date_param);
      endDate = new Date(end_date_param);
    } else if (time_range) {
      endDate = new Date();
      startDate = new Date();
      switch (time_range) {
        case '24h':
          startDate.setHours(endDate.getHours() - 24);
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
          startDate = null;
          break;
        default:
          return new Response(JSON.stringify({ message: 'Invalid time range' }), { status: 400 });
      }
    } else {
      endDate = new Date();
      startDate = new Date();
      startDate.setHours(endDate.getHours() - 24);
    }

    const whereClause: any = { device_id: params.device_id };
    if (startDate) {
      whereClause.received_at = { gte: startDate, lte: endDate };
    }

    const data = await prisma[dataModelName].findMany({
      where: whereClause,
      orderBy: { received_at: 'asc' },
    });

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error fetching historical data:', error);
    return new Response(JSON.stringify({ message: error.message }), { status: 500 });
  }
};
