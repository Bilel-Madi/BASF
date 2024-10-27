import dbConnect from '$lib/dbConnect';
import DeviceData from '$lib/db-models/DeviceData.js'; // Adjust the path based on your file structure
import ControllerData from '$lib/db-models/ControllerData.js';

export const POST: RequestHandler = async ({ request }) => {
    try {
        await dbConnect(); // Ensure the database connection is open

        const body = await request.json();

        console.log('Incoming JSON:', body);
        const deviceEUI = body.end_device_ids.dev_eui;


        // Determine the message type by device EUI
        if (deviceEUI.startsWith('24E124126C48')) {
            // Handle sensor data

        // Extracting the necessary data based on your structure
        const deviceData = {
            received_at: body.received_at, // Using the top-level received_at for the document's timestamp
            device_id: deviceEUI, // Using dev_eui as the device_id as per your instructions
            ec: body.uplink_message.decoded_payload.ec,
            temperature: body.uplink_message.decoded_payload.temperature.toString(),
            moisture: body.uplink_message.decoded_payload.moisture.toString(),
        };

        // Create a new instance of the model with the extracted data
        const newDeviceData = new DeviceData(deviceData);
        await newDeviceData.save(); // Save the data to the database

        return new Response(JSON.stringify({ message: 'Data saved successfully' }), {
            headers: {'Content-Type': 'application/json'},
            status: 200,
        });
    } else if (deviceEUI.startsWith('24E124460C48')) {
        // Handle controller data
        const controllerData = {
            received_at: body.received_at,
            device_id: deviceEUI,
            valve_1: body.uplink_message.decoded_payload.valve_1
        };

        // Save or handle controller data
        const newControllerData = new ControllerData(controllerData); // Assuming you have a similar model or handling logic for controller data
        await newControllerData.save();
        return new Response(JSON.stringify({ message: 'Controller data saved successfully' }), {
            headers: {'Content-Type': 'application/json'},
            status: 200,
        });
    } else {
        // Unknown device type
        return new Response(JSON.stringify({ message: 'Unknown device type received' }), {
            headers: {'Content-Type': 'application/json'},
            status: 400, // Bad Request
        });
    }
} catch (error) {
    console.error('Error processing request:', error);
    return new Response(JSON.stringify({ message: 'Failed to process data' }), {
        headers: {'Content-Type': 'application/json'},
        status: 500, // Internal Server Error
    });
}
};
