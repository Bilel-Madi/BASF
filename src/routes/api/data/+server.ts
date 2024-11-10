// src/routes/api/data/+server.ts
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/prisma';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    console.log('Received body:', JSON.stringify(body, null, 2));

    // Ensure the required data is present
    if (!body?.uplink_message?.decoded_payload || !body?.end_device_ids) {
      console.log('Validation failed:', {
        hasDecodedPayload: !!body?.uplink_message?.decoded_payload,
        hasDeviceIds: !!body?.end_device_ids
      });
      return new Response('Invalid data', { status: 400 });
    }

    const devEui = body.end_device_ids.dev_eui;
    const receivedAt = new Date(body.received_at || body.time);
    const decodedPayload = body.uplink_message.decoded_payload;

    // Ensure the device exists
    let device = await prisma.device.findUnique({ where: { eui: devEui } });

    if (!device) {
      // Determine sensor type based on dev_eui prefix
      const deviceType = devEui.startsWith('24E124126E') ? 'CO2_SENSOR' :
                        devEui.startsWith('24E124126C') ? 'SOIL_MOISTURE' : 'UNKNOWN';

      // Create the device with minimal data
      device = await prisma.device.create({
        data: {
          eui: devEui,
          type: deviceType,
          name: 'Unknown Device',
          modelName: 'Unknown Model',
          installationDate: new Date(),
          reportingInterval: 0,
         
        },
      });
    }

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
        console.log('Missing CO2 sensor data:', { co2, humidity, pressure, temperature });
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
        console.log('Missing soil moisture sensor data:', { ec, moisture, temperature });
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
      console.log('Unknown device EUI prefix:', devEui);
      return new Response('Unknown device EUI prefix', { status: 400 });
    }

    return new Response('Data saved', { status: 200 });
  } catch (error) {
    console.error('Error saving data:', error);
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return new Response('Server error', { status: 500 });
  }
};
