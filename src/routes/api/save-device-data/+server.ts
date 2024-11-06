// src/routes/api/save-device-data/+server.ts
import prisma from '$lib/prisma';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();

    const deviceEUI = body.end_device_ids.dev_eui;
    const decodedPayload = body.uplink_message.decoded_payload || {};
    const receivedAt = new Date(body.received_at);
    const rssi = body.uplink_message.rx_metadata[0]?.rssi;
    const snr = body.uplink_message.rx_metadata[0]?.snr;

    // Update Device metadata
    const deviceUpdate: any = {
      last_seen: receivedAt,
      latest_rssi: rssi,
      latest_snr: snr,
    };

    if (decodedPayload.battery !== undefined) {
      deviceUpdate.battery_status = decodedPayload.battery;
    }

    await prisma.device.upsert({
      where: { device_id: deviceEUI },
      update: deviceUpdate,
      create: { device_id: deviceEUI, ...deviceUpdate },
    });

    // Determine device type and save sensor data
    const SOIL_SENSOR_PREFIX = '24E124126C48';
    const CO2_SENSOR_PREFIX = '24E124126E03';

    if (deviceEUI.startsWith(SOIL_SENSOR_PREFIX)) {
      await prisma.deviceData.create({
        data: {
          received_at: receivedAt,
          device_id: deviceEUI,
          ec: decodedPayload.ec,
          temperature: decodedPayload.temperature,
          moisture: decodedPayload.moisture,
          battery: decodedPayload.battery,
        },
      });
    } else if (deviceEUI.startsWith(CO2_SENSOR_PREFIX)) {
      await prisma.co2Data.create({
        data: {
          received_at: receivedAt,
          device_id: deviceEUI,
          co2: decodedPayload.co2,
          humidity: decodedPayload.humidity,
          pressure: decodedPayload.pressure,
          temperature: decodedPayload.temperature,
          battery: decodedPayload.battery,
        },
      });
    } else {
      return new Response(JSON.stringify({ message: 'Unknown device type received' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    return new Response(JSON.stringify({ message: 'Data saved successfully' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ message: 'Failed to process data', error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
};
