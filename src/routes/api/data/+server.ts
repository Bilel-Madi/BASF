.import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/prisma';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();

    // Ensure the required data is present
    if (!body?.data?.uplink_message?.decoded_payload || !body?.data?.end_device_ids) {
      return new Response('Invalid data', { status: 400 });
    }

    const deviceId = body.data.end_device_ids.dev_eui; // Using dev_eui as deviceId
    const devEui = body.data.end_device_ids.dev_eui;
    const receivedAt = new Date(body.data.received_at || body.time);
    const decodedPayload = body.data.uplink_message.decoded_payload;

    // Extract battery status if present
    const battery = decodedPayload.battery !== undefined ? decodedPayload.battery : null;

    // Determine sensor type based on dev_eui prefix
    if (devEui.startsWith('24E124126E')) {
      // CO2 Sensor Data
      const { co2, humidity, pressure, temperature } = decodedPayload;

      // Validate required fields
      if (
        co2 === undefined ||
        humidity === undefined ||
        pressure === undefined ||
        temperature === undefined
      ) {
        return new Response('Missing CO2 sensor data', { status: 400 });
      }

      await prisma.air.create({
        data: {
          receivedAt,
          deviceId: devEui,
          co2,
          humidity,
          pressure,
          temperature,
          battery, // Include battery if present
        },
      });
    } else if (devEui.startsWith('24E124126C')) {
      // Soil Moisture Sensor Data
      const { ec, moisture, temperature } = decodedPayload;

      // Validate required fields
      if (ec === undefined || moisture === undefined || temperature === undefined) {
        return new Response('Missing soil moisture sensor data', { status: 400 });
      }

      await prisma.soil.create({
        data: {
          receivedAt,
          deviceId: devEui,
          ec,
          moisture,
          temperature,
          battery, // Include battery if present
        },
      });
    } else {
      return new Response('Unknown device EUI prefix', { status: 400 });
    }

    return new Response('Data saved', { status: 200 });
  } catch (error) {
    console.error('Error saving data:', error);
    return new Response('Server error', { status: 500 });
  }
};
