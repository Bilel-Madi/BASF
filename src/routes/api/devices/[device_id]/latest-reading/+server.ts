// src/routes/api/devices/[device_id]/latest-reading/+server.ts
import prisma from '$lib/prisma';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params }) => {
  try {
    const device = await prisma.device.findUnique({
      where: { device_id: params.device_id },
    });

    if (!device) {
      return new Response(JSON.stringify({ message: 'Device not found' }), { status: 404 });
    }

    let latestReading = null;

    if (
      device.model_name === 'Milesight EM500-SMTC Soil Moisture Sensor' ||
      device.device_id.startsWith('24E124126C48')
    ) {
      latestReading = await prisma.deviceData.findFirst({
        where: { device_id: params.device_id },
        orderBy: { received_at: 'desc' },
      });
    } else if (
      device.model_name === 'Milesight EM500-CO2 Outdoor Environment Monitoring Sensor' ||
      device.device_id.startsWith('24E124126E03')
    ) {
      latestReading = await prisma.co2Data.findFirst({
        where: { device_id: params.device_id },
        orderBy: { received_at: 'desc' },
      });
    }

    if (!latestReading) {
      return new Response(JSON.stringify({ message: 'No sensor data found' }), { status: 404 });
    }

    return new Response(JSON.stringify(latestReading), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error fetching latest reading:', error);
    return new Response(JSON.stringify({ message: error.message }), { status: 500 });
  }
};
