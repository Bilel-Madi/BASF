// +server.ts
import dbConnect from '$lib/dbConnect';
import Device from '$lib/db-models/Device.js';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
  try {
    await dbConnect();
    const devices = await Device.find({});
    return new Response(JSON.stringify(devices), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ message: error.message }), { status: 500 });
  }
};
