// +server.ts
import dbConnect from '$lib/dbConnect';
import DeviceData from '$lib/db-models/DeviceData.js'; // For soil data
import Co2Data from '$lib/db-models/Co2Data.js';       // For CO₂ data
import Device from '$lib/db-models/Device.js';
import { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
  try {
    await dbConnect();
    const body = await request.json();

    const deviceEUI = body.end_device_ids.dev_eui;
    const decodedPayload = body.uplink_message.decoded_payload || {};
    const receivedAt = new Date(body.received_at);
    const rssi = body.uplink_message.rx_metadata[0]?.rssi;
    const snr = body.uplink_message.rx_metadata[0]?.snr;

    // Update Device metadata
    const deviceUpdate = {
      last_seen: receivedAt,
      latest_rssi: rssi,
      latest_snr: snr,
    };

    if (decodedPayload.battery !== undefined) {
      deviceUpdate.battery_status = decodedPayload.battery;
    }

    await Device.findOneAndUpdate(
      { device_id: deviceEUI },
      { $set: deviceUpdate },
      { upsert: true }
    );

    // Determine device type and save sensor data
    const SOIL_SENSOR_PREFIX = '24E124126C48';
    const CO2_SENSOR_PREFIX = '24E124126E03';

    if (deviceEUI.startsWith(SOIL_SENSOR_PREFIX)) {
      const deviceData = new DeviceData({
        received_at: receivedAt,
        device_id: deviceEUI,
        ec: decodedPayload.ec,
        temperature: decodedPayload.temperature,
        moisture: decodedPayload.moisture,
        battery: decodedPayload.battery,
      });
      await deviceData.save();
    } else if (deviceEUI.startsWith(CO2_SENSOR_PREFIX)) {
      const co2Data = new Co2Data({
        received_at: receivedAt,
        device_id: deviceEUI,
        co2: decodedPayload.co2,
        humidity: decodedPayload.humidity,
        pressure: decodedPayload.pressure,
        temperature: decodedPayload.temperature,
        battery: decodedPayload.battery,
      });
      await co2Data.save();
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
    return new Response(JSON.stringify({ message: 'Failed to process data', error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
};
