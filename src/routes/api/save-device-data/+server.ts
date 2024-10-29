// +server.ts
import dbConnect from '$lib/dbConnect';
import DeviceData from '$lib/db-models/DeviceData.js'; // Adjust the path based on your file structure
import Co2Data from '$lib/db-models/Co2Data.js';       // Import the Co2Data model
import { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
    try {
        await dbConnect(); // Ensure the database connection is open

        const body = await request.json();

        console.log('Incoming JSON:', body);

        // Extract the device EUI and application ID
        const deviceEUI = body.end_device_ids.dev_eui;
        const applicationID = body.end_device_ids.application_ids.application_id;

        // Define device type prefixes
        const SOIL_SENSOR_PREFIX = '24E124126C48'; // Prefix for soil moisture sensors
        const CO2_SENSOR_PREFIX = '24E124126E03';  // Prefix for CO₂ sensors

        // Handle soil moisture sensor data
        if (deviceEUI.startsWith(SOIL_SENSOR_PREFIX)) {
            // Extract the necessary data for soil moisture sensors
            const decodedPayload = body.uplink_message.decoded_payload || {};

            const deviceData = {
                received_at: new Date(body.received_at), // Ensure it's a Date object
                device_id: deviceEUI,                    // Using dev_eui as the device_id
                ec: decodedPayload.ec,
                temperature: decodedPayload.temperature,
                moisture: decodedPayload.moisture,
                battery: decodedPayload.battery,
            };

            // Create a new instance of the DeviceData model
            const newDeviceData = new DeviceData(deviceData);
            await newDeviceData.save(); // Save the data to the 'Soil' collection

            return new Response(JSON.stringify({ message: 'Soil data saved successfully' }), {
                headers: { 'Content-Type': 'application/json' },
                status: 200,
            });
        }
        // Handle CO₂ sensor data
        else if (deviceEUI.startsWith(CO2_SENSOR_PREFIX)) {
            // Extract the necessary data for CO₂ sensors
            const decodedPayload = body.uplink_message.decoded_payload || {};

            const co2Data = {
                received_at: new Date(body.received_at), // Ensure it's a Date object
                device_id: deviceEUI,
                co2: decodedPayload.co2,
                humidity: decodedPayload.humidity,
                pressure: decodedPayload.pressure,
                temperature: decodedPayload.temperature,
                battery: decodedPayload.battery,
            };

            // Create a new instance of the Co2Data model
            const newCo2Data = new Co2Data(co2Data);
            await newCo2Data.save(); // Save the data to the 'Air' collection

            return new Response(JSON.stringify({ message: 'CO₂ data saved successfully' }), {
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
        return new Response(JSON.stringify({ message: 'Failed to process data', error: error.message }), {
            headers: { 'Content-Type': 'application/json' },
            status: 500, // Internal Server Error
        });
    }
};
