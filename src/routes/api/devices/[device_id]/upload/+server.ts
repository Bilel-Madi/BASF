// src/routes/api/devices/[device_id]/upload/+server.ts
import prisma from '$lib/prisma';
import type { RequestHandler } from '@sveltejs/kit';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export const POST: RequestHandler = async ({ request, params }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('picture') as File;

    if (!file || file.size === 0) {
      return new Response(JSON.stringify({ message: 'No file uploaded' }), { status: 400 });
    }

    const filename = `${params.device_id}_${Date.now()}_${file.name}`;
    const filepath = join('static/uploads', filename);

    const arrayBuffer = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(arrayBuffer));

    const picture_url = `/uploads/${filename}`;

    await prisma.device.upsert({
      where: { device_id: params.device_id },
      update: { picture_url },
      create: { device_id: params.device_id, picture_url },
    });

    return new Response(JSON.stringify({ picture_url }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return new Response(JSON.stringify({ message: error.message }), { status: 500 });
  }
};
