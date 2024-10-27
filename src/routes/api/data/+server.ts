// src/routes/api/data/+server.ts
import { RequestHandler } from '@sveltejs/kit';
import dbConnect from '$lib/dbConnect';
import DeviceData from '$lib/db-models/DeviceData.js'; // Adjust the path based on your file structure
import ControllerData from '$lib/db-models/ControllerData.js';

function readUInt32LE(bytes: Uint8Array): number {
    const value = (bytes[3] << 24) + (bytes[2] << 16) + (bytes[1] << 8) + bytes[0];
    return (value & 0xffffffff) >>> 0;
}

function milesight(bytes: Uint8Array): Record<string, any> {
    const decoded: Record<string, any> = {};

    for (let i = 0; i < bytes.length;) {
        const channel_id = bytes[i++];
        const channel_type = bytes[i++];

        if (channel_id === 0x01 && channel_type === 0x75) {
            decoded.battery = bytes[i];
            i += 1;
        } else if (channel_id === 0x03 && channel_type == 0x01) {
            decoded.valve_1 = bytes[i] === 0 ? "off" : "on";
            i += 1;
        } else if (channel_id === 0x05 && channel_type == 0x01) {
            decoded.valve_2 = bytes[i] === 0 ? "close" : "on";
            i += 1;
        } else if (channel_id === 0x04 && channel_type === 0xc8) {
            decoded.valve_1_pulse = readUInt32LE(bytes.slice(i, i + 4));
            i += 4;
        } else if (channel_id === 0x06 && channel_type === 0xc8) {
            decoded.valve_2_pulse = readUInt32LE(bytes.slice(i, i + 4));
            i += 4;
        } else if (channel_id === 0x07 && channel_type == 0x01) {
            decoded.gpio_1 = bytes[i] === 0 ? "off" : "on";
            i += 1;
        } else if (channel_id === 0x08 && channel_type == 0x01) {
            decoded.gpio_2 = bytes[i] === 0 ? "off" : "on";
            i += 1;
        } else if (channel_id === 0x20 && channel_type === 0xce) {
            if (decoded.history === undefined) {
                decoded.history = [];
            }

            const timestamp = readUInt32LE(bytes.slice(i, i + 4));
            const data = bytes[i + 4];
            const status = (data & 0x01) === 0 ? "off" : "on";
            const mode = ((data >> 1) & 0x01) === 0 ? "counter" : "gpio";
            const gpio = ((data >> 2) & 0x01) === 0 ? "off" : "on";
            const index = ((data >> 4) & 0x01) === 0 ? "1" : "2";
            const pulse = readUInt32LE(bytes.slice(i + 5, i + 9));

            const payload: Record<string, any> = {};
            if (mode == "gpio") {
                payload["valve_" + index] = status;
                payload["gpio_" + index] = gpio;
                payload.mode = mode;
                payload.timestamp = timestamp;
            } else if (mode == "counter") {
                payload["valve_" + index] = status;
                payload["valve_" + index + "_pulse"] = pulse;
                payload.mode = mode;
                payload.timestamp = timestamp;
            }
            decoded.history.push(payload);
            i += 9;
        } else {
            break;
        }
    }

    return decoded;
}

function Decoder(bytes: Uint8Array, port: number): Record<string, any> {
    return milesight(bytes);
}

export const POST: RequestHandler = async ({ request }) => {
    try {
        await dbConnect(); // Ensure the database connection is open

        // Parse the JSON data received
        const body = await request.json();
        console.log('Incoming JSON:', body);

        if (Array.isArray(body) && body.length > 0 && body[0].bn) {
            // Check if it's DeviceData
            const eui = body[0].bn.split('_')[1];
            if (eui.startsWith('18000')) {
                const deviceData = {
                    device_id: eui, // Extracting the `device_id` from the `bn` field
                    received_at: new Date(body[0].bt * 1000), // Convert `bt` Unix timestamp to a JS Date object
                    ec: null, // Since no `ec` is present, keep it as null or empty
                    temperature: body.find((item: any) => item.u === 'Cel')?.v.toString() || "", // Finds the item with unit 'Cel' and converts value to a string
                    moisture: body.find((item: any) => item.u === '%vol')?.v.toString() || "", // Finds the item with unit '%vol' and converts value to a string
                };

                const newDeviceData = new DeviceData(deviceData);
                await newDeviceData.save();

                return new Response(JSON.stringify({ message: 'Device data saved successfully' }), {
                    headers: { 'Content-Type': 'application/json' },
                    status: 200,
                });
            }
        } else if (body.cmd && body.EUI) {
            // Check if it's ControllerData
            if (body.cmd === 'rx' && body.EUI.startsWith('24E124460C')) {
                const bytes = Buffer.from(body.data, 'hex');
                const decoded = Decoder(bytes, body.port);

                const controllerData = {
                    device_id: body.EUI,
                    valve_1: decoded.valve_1 || "",
                    received_at: body.ts ? new Date(body.ts) : new Date(),
                    battery: decoded.battery || null // Extract and include the battery status
                };

                const newControllerData = new ControllerData(controllerData);
                await newControllerData.save();

                return new Response(JSON.stringify({ message: 'Controller data saved successfully' }), {
                    headers: { 'Content-Type': 'application/json' },
                    status: 200,
                });
            }
        }

        // If the request does not match any condition, return a bad request response
        return new Response(JSON.stringify({ message: 'Invalid data format' }), {
            headers: { 'Content-Type': 'application/json' },
            status: 400, // Bad Request
        });

    } catch (error) {
        console.error('Error processing request:', error);
        return new Response(JSON.stringify({ message: 'Failed to process data' }), {
            headers: { 'Content-Type': 'application/json' },
            status: 500, // Internal Server Error
        });
    }
};
