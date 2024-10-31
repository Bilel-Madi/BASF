import dbConnect from '$lib/dbConnect';
import Field from '$lib/db-models/Field.js';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ params, request }) => {
  try {
    await dbConnect();
    const field = await Field.findById(params.field_id);
    if (!field) {
      return new Response(JSON.stringify({ message: 'Field not found' }), { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('geojson');

    if (!file || typeof file === 'string') {
      return new Response(JSON.stringify({ message: 'No file uploaded' }), { status: 400 });
    }

    const text = await file.text();
    const geojson = JSON.parse(text);

    // Validate geojson if necessary

    field.location = geojson;
    await field.save();

    return new Response(JSON.stringify({ message: 'GeoJSON uploaded successfully' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error uploading GeoJSON:', error);
    return new Response(JSON.stringify({ message: error.message }), { status: 500 });
  }
};
