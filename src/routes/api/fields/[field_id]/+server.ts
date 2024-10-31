import dbConnect from '$lib/dbConnect';
import Field from '$lib/db-models/Field.js';
import type { RequestHandler } from '@sveltejs/kit';

// Get field by ID
export const GET: RequestHandler = async ({ params }) => {
  try {
    await dbConnect();
    const field = await Field.findById(params.field_id);
    if (!field) {
      return new Response(JSON.stringify({ message: 'Field not found' }), { status: 404 });
    }
    return new Response(JSON.stringify(field), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ message: error.message }), { status: 500 });
  }
};

// Update field
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    await dbConnect();
    const updateData = await request.json();
    const updatedField = await Field.findByIdAndUpdate(params.field_id, updateData, { new: true });
    if (!updatedField) {
      return new Response(JSON.stringify({ message: 'Field not found' }), { status: 404 });
    }
    return new Response(JSON.stringify(updatedField), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ message: error.message }), { status: 500 });
  }
};

// Delete field
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    await dbConnect();
    const deletedField = await Field.findByIdAndDelete(params.field_id);
    if (!deletedField) {
      return new Response(JSON.stringify({ message: 'Field not found' }), { status: 404 });
    }
    return new Response(JSON.stringify({ message: 'Field deleted' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ message: error.message }), { status: 500 });
  }
};
