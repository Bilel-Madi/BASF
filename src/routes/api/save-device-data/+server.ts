import dbConnect from '$lib/dbConnect';
import DeviceData from '$lib/db-models/DeviceData.js'; // Adjust the path based on your file structure


export const POST: RequestHandler = async ({ request }) => {
    try {
        await dbConnect(); // Ensure the database connection is open

        const body = await request.json();

        console.log('Incoming JSON:', body);
        const deviceEUI = body.end_device_ids.dev_eui;

        // Handle sensor data
        if (deviceEUI.startsWith('24E124126C48')) {
            // Extracting the necessary data based on your structure
            const decodedPayload = body.uplink_message.decoded_payload || {};

            const deviceData = {
                received_at: body.received_at, // Using the top-level received_at for the document's timestamp
                device_id: deviceEUI,          // Using dev_eui as the device_id
                ec: decodedPayload.ec,
                temperature: decodedPayload.temperature?.toString(),
                moisture: decodedPayload.moisture?.toString(),
                battery: decodedPayload.battery
            };

            // Create a new instance of the model with the extracted data
            const newDeviceData = new DeviceData(deviceData);
            await newDeviceData.save(); // Save the data to the database

            return new Response(JSON.stringify({ message: 'Data saved successfully' }), {
                headers: { 'Content-Type': 'application/json' },
                status: 200,
            });
        } else {
            // Unknown device type
            return new Response(JSON.stringify({ message: 'Unknown device type received' }), {
                headers: { 'Content-Type': 'application/json' },
                status: 400, // Bad Request
            });
        }
    } catch (error) {
        console.error('Error processing request:', error);
        return new Response(JSON.stringify({ message: 'Failed to process data' }), {
            headers: { 'Content-Type': 'application/json' },
            status: 500, // Internal Server Error
        });
    }
};
