// /api/data-fetch-latest.ts
import dbConnect from '$lib/dbConnect';
import { json } from '@sveltejs/kit';
import DeviceData from '$lib/db-models/DeviceData'; // Adjust the path as needed

export const GET = async () => {
    // Connect to the database
    await dbConnect();

    try {
        // Aggregate query to fetch the latest entries per device
        const latestEntries = await DeviceData.aggregate([
            // Sort documents by `received_at` descending (most recent first)
            { $sort: { received_at: -1 } },

            // Group by device_id and take the latest document in each group
            {
                $group: {
                    _id: "$device_id",
                    latest: { $first: "$$ROOT" } // `$$ROOT` contains the whole document
                }
            },

            // Replace the root with the latest document
            { $replaceRoot: { newRoot: "$latest" } }
        ]).exec();

        

        // Return the latest data entries as JSON
        return json(latestEntries);
    } catch (error) {
        console.error('Failed to fetch latest data from DB:', error);
        return new Response(undefined, { status: 500, statusText: 'Internal Server Error' });
    }
};
