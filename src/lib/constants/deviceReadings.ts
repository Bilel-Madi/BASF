export const DEVICE_READINGS = {
  SOIL_MOISTURE: [
    { value: 'moisture', label: 'Soil Moisture' },
    { value: 'temperature', label: 'Soil Temperature' },
    { value: 'ec', label: 'Soil EC' }
  ],
  CO2_SENSOR: [
    { value: 'co2', label: 'CO2' },
    { value: 'humidity', label: 'Air Humidity' },
    { value: 'temperature', label: 'Air Temperature' },
    { value: 'pressure', label: 'Air Pressure' }
  ]
} as const; 