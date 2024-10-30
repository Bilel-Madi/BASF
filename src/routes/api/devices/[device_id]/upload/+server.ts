// +server.ts
import dbConnect from '$lib/dbConnect';
import Device from '$lib/db-models/Device.js';
import type { RequestHandler } from '@sveltejs/kit';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export const POST: RequestHandler = async ({ request, params }) => {
  try {
    await dbConnect();
    const formData = await request.formData();
    const file = formData.get('picture') as File;

    if (!file || file.size === 0) {
      return new Response(JSON.stringify({ message: 'No file uploaded' }), { status: 400 });
    }

    // Save the file to a directory (e.g., static/uploads)
    const filename = `${params.device_id}_${Date.now()}_${file.name}`;
    const filepath = join('static/uploads', filename);

    const arrayBuffer = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(arrayBuffer));

    // Update the device with the picture URL
    const picture_url = `/uploads/${filename}`;

    await Device.findOneAndUpdate(
      { device_id: params.device_id },
      { $set: { picture_url } },
      { upsert: true }
    );

    return new Response(JSON.stringify({ picture_url }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return new Response(JSON.stringify({ message: error.message }), { status: 500 });
  }
};
