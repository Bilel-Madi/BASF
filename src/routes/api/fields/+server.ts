import dbConnect from '$lib/dbConnect';
import Field from '$lib/db-models/Field.js';
import type { RequestHandler } from '@sveltejs/kit';

// Get list of fields
export const GET: RequestHandler = async () => {
  try {
    await dbConnect();
    const fields = await Field.find({});
    return new Response(JSON.stringify(fields), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ message: error.message }), { status: 500 });
  }
};

// Create new field
export const POST: RequestHandler = async ({ request }) => {
  try {
    await dbConnect();
    const fieldData = await request.json();
    const newField = new Field(fieldData);
    await newField.save();
    return new Response(JSON.stringify(newField), {
      headers: { 'Content-Type': 'application/json' },
      status: 201,
    });
  } catch (error) {
    return new Response(JSON.stringify({ message: error.message }), { status: 500 });
  }
};
