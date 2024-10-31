import dbConnect from '$lib/dbConnect';
import Device from '$lib/db-models/Device.js';
import DeviceData from '$lib/db-models/DeviceData.js'; // For soil data
import Co2Data from '$lib/db-models/Co2Data.js';       // For CO₂ data
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params, url }) => {
  try {
    await dbConnect();
    const device = await Device.findOne({ device_id: params.device_id });

    if (!device) {
      return new Response(JSON.stringify({ message: 'Device not found' }), { status: 404 });
    }

    // Map device_type to DataModel
    const dataModelMapping = {
      'soil_moisture': DeviceData,
      'co2_sensor': Co2Data,
      // Add more mappings as needed
    };

    const DataModel = dataModelMapping[device.device_type];

    if (!DataModel) {
      return new Response(JSON.stringify({ message: 'Unknown device type' }), { status: 400 });
    }

    const time_range = url.searchParams.get('time_range'); // e.g., '24h', '3d', etc.
    const start_date_param = url.searchParams.get('start_date');
    const end_date_param = url.searchParams.get('end_date');

    let startDate = null;
    let endDate = new Date(); // default to now

    if (start_date_param && end_date_param) {
      startDate = new Date(start_date_param);
      endDate = new Date(end_date_param);
    } else if (time_range) {
      endDate = new Date();
      startDate = new Date();
      switch (time_range) {
        case '24h':
          startDate.setHours(endDate.getHours() - 24);
          break;
        case '3d':
          startDate.setDate(endDate.getDate() - 3);
          break;
        case '1w':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '2w':
          startDate.setDate(endDate.getDate() - 14);
          break;
        case '1m':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case '3m':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
        case '6m':
          startDate.setMonth(endDate.getMonth() - 6);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        case 'all':
          startDate = null; // No start date
          break;
        default:
          return new Response(JSON.stringify({ message: 'Invalid time range' }), { status: 400 });
      }
    } else {
      // Default to last 24 hours
      endDate = new Date();
      startDate = new Date();
      startDate.setHours(endDate.getHours() - 24);
    }

    let query = { device_id: params.device_id };
    if (startDate) {
      query['received_at'] = { $gte: startDate, $lte: endDate };
    }

    const data = await DataModel.find(query).sort({ received_at: 1 });

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error fetching historical data:', error);
    return new Response(JSON.stringify({ message: error.message }), { status: 500 });
  }
};
