// +server.ts
import dbConnect from '$lib/dbConnect';
import Device from '$lib/db-models/Device.js';
import DeviceData from '$lib/db-models/DeviceData.js'; // For soil data
import Co2Data from '$lib/db-models/Co2Data.js';       // For CO₂ data
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params }) => {
  try {
    await dbConnect();
    const device = await Device.findOne({ device_id: params.device_id });

    if (!device) {
      return new Response(JSON.stringify({ message: 'Device not found' }), { status: 404 });
    }

    let latestReading = null;

    if (device.model_name === 'Milesight EM500-SMTC Soil Moisture Sensor' || device.device_id.startsWith('24E124126C48')) {
      latestReading = await DeviceData.findOne({ device_id: params.device_id }).sort({ received_at: -1 });
    } else if (device.model_name === 'Milesight EM500-CO2 Outdoor Environment Monitoring Sensor' || device.device_id.startsWith('24E124126E03')) {
      latestReading = await Co2Data.findOne({ device_id: params.device_id }).sort({ received_at: -1 });
    }

    if (!latestReading) {
      return new Response(JSON.stringify({ message: 'No sensor data found' }), { status: 404 });
    }

    return new Response(JSON.stringify(latestReading), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error fetching latest reading:', error);
    return new Response(JSON.stringify({ message: error.message }), { status: 500 });
  }
};
