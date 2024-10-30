// +server.ts
import dbConnect from '$lib/dbConnect';
import Device from '$lib/db-models/Device.js';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params }) => {
  try {
    await dbConnect();
    const device = await Device.findOne({ device_id: params.device_id });
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
    await dbConnect();
    const updateData = await request.json();

    const updatedDevice = await Device.findOneAndUpdate(
      { device_id: params.device_id },
      { $set: updateData },
      { upsert: true, new: true }
    );

    return new Response(JSON.stringify(updatedDevice), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ message: error.message }), { status: 500 });
  }
};