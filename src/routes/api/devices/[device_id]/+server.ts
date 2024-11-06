// src/routes/api/devices/[device_id]/+server.ts
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
    return new Response(JSON.stringify(device), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ message: error.message }), { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request, params }) => {
  try {
    const updateData = await request.json();

    // Exclude 'id' and '_id' from updateData if they exist
    const { id, _id, ...data } = updateData;

    // Convert 'installed_date' to a Date object
    if (data.installed_date) {
      data.installed_date = new Date(data.installed_date);
    }

    const updatedDevice = await prisma.device.upsert({
      where: { device_id: params.device_id },
      update: data,
      create: { ...data, device_id: params.device_id },
    });

    return new Response(JSON.stringify(updatedDevice), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error updating device:', error);
    return new Response(JSON.stringify({ message: error.message }), { status: 500 });
  }
};
