// +server.ts
import dbConnect from '$lib/dbConnect';
import { json } from '@sveltejs/kit';
import DeviceData from '$lib/db-models/DeviceData'; // Adjust the path as needed

export const GET = async ({ url }) => {
    await dbConnect();

    const device_id = url.searchParams.get('device_id');
    const startDate = url.searchParams.get('start') || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days ago
    const endDate = url.searchParams.get('end') || new Date().toISOString();

    try {
        const query = {
            received_at: { $gte: new Date(startDate), $lte: new Date(endDate) },
            ...(device_id && { device_id: device_id })
        };
        const dataEntries = await DeviceData.find(query).sort({ received_at: 1 }).exec();


        return json(dataEntries);
    } catch (error) {
        console.error('Failed to fetch data from DB:', error);
        return new Response(undefined, { status: 500, statusText: 'Internal Server Error' });
    }
};
