// src/routes/api/data/+server.ts
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/prisma';

export const POST: RequestHandler = async ({ request }) => {
  try {
    // Parse the incoming request body
    const body = await request.json();
    console.log('Received body:', JSON.stringify(body, null, 2));

    // Ensure the required data is present
    if (!body?.uplink_message?.decoded_payload || !body?.end_device_ids) {
      console.log('Validation failed:', {
        hasDecodedPayload: !!body?.uplink_message?.decoded_payload,
        hasDeviceIds: !!body?.end_device_ids,
      });
      return new Response('Invalid data', { status: 400 });
    }

    // Extract the device EUI (try both 'dev_eui' and 'device_id')
    let devEui = body.end_device_ids.dev_eui || body.end_device_ids.device_id;
    if (!devEui) {
      console.log('Device EUI not found in end_device_ids');
      return new Response('Device EUI not found', { status: 400 });
    }

    // Ensure the device EUI is in uppercase without whitespace
    devEui = devEui.trim().toUpperCase();

    // Extract the received timestamp
    const receivedAtString = body.received_at || body.uplink_message.received_at || body.time;
    const receivedAt = receivedAtString ? new Date(receivedAtString) : new Date();

    const decodedPayload = body.uplink_message.decoded_payload;

    // Extract battery status if present
    const battery = decodedPayload.battery !== undefined ? decodedPayload.battery : null;

    // Determine sensor type based on the device EUI prefix
    let deviceType: 'CO2_SENSOR' | 'SOIL_MOISTURE' | 'UNKNOWN' = 'UNKNOWN';
    if (devEui.startsWith('24E124126E')) {
      deviceType = 'CO2_SENSOR';
    } else if (devEui.startsWith('24E124126C')) {
      deviceType = 'SOIL_MOISTURE';
    } else {
      console.log('Unknown device EUI prefix:', devEui);
      // Continue with UNKNOWN type
    }

    // Ensure the device exists in the database
    let device = await prisma.device.findUnique({ where: { eui: devEui } });

    if (!device) {
      // Create the device with minimal data if it doesn't exist
      device = await prisma.device.create({
        data: {
          eui: devEui,
          type: deviceType,
          name: 'Unknown Device',
          modelName: 'Unknown Model',
          installationDate: new Date(),
          reportingInterval: 0,
          location: {}, // Provide a minimal JSON object
          zoneId: undefined, // No zone assigned yet
        },
      });
      console.log(`Device with EUI ${devEui} created with minimal data.`);
    }

    // Process the sensor data based on the device type
    if (deviceType === 'CO2_SENSOR') {
      // Extract CO2 sensor data
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

      // Save the data to the 'Air' collection
      await prisma.air.create({
        data: {
          receivedAt,
          deviceId: devEui,
          co2,
          humidity,
          pressure,
          temperature,
          battery,
        },
      });
      console.log(`CO2 sensor data saved for device ${devEui}.`);
    } else if (deviceType === 'SOIL_MOISTURE') {
      // Extract soil moisture sensor data
      const { ec, moisture, temperature } = decodedPayload;

      // Validate required fields
      if (ec === undefined || moisture === undefined || temperature === undefined) {
        console.log('Missing soil moisture sensor data:', { ec, moisture, temperature });
        return new Response('Missing soil moisture sensor data', { status: 400 });
      }

      // Save the data to the 'Soil' collection
      await prisma.soil.create({
        data: {
          receivedAt,
          deviceId: devEui,
          ec,
          moisture,
          temperature,
          battery,
        },
      });
      console.log(`Soil moisture sensor data saved for device ${devEui}.`);
    } else {
      console.log(`Device type UNKNOWN for EUI ${devEui}. Data not saved.`);
      return new Response('Unknown device type. Data not saved.', { status: 400 });
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
