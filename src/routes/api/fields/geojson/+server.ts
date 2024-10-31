import dbConnect from '$lib/dbConnect';
import Field from '$lib/db-models/Field.js';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
  try {
    await dbConnect();
    const fields = await Field.find({});

    // Map fields to GeoJSON Features
    const features = fields.map((field) => {
      return {
        type: 'Feature',
        geometry: field.location,
        properties: {
          _id: field._id,
          name: field.name,
          crop_type: field.crop_type,
          soil_type: field.soil_type,
          size_hectares: field.size_hectares,
          // Add any other properties you need
        },
      };
    });

    const geojson = {
      type: 'FeatureCollection',
      features: features,
    };

    return new Response(JSON.stringify(geojson), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error fetching fields GeoJSON:', error);
    return new Response(JSON.stringify({ message: error.message }), { status: 500 });
  }
};
