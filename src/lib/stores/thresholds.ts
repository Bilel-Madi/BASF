import { readable } from 'svelte/store';

export type Threshold = {
  start: number;
  end: number;
  color: string;
  label: string;
};

export type SensorRange = {
  min: number;
  max: number;
};

export const sensorThresholds = readable<Record<string, Threshold[]>>({
  moisture: [
    { start: 0, end: 10, color: '#ff4d4d', label: 'Critical' },
    { start: 10, end: 20, color: '#ffa500', label: 'Low' },
    { start: 20, end: 40, color: '#00cc44', label: 'Good' },
    { start: 40, end: 50, color: '#3399ff', label: 'High' },
    { start: 50, end: 100, color: '#9933ff', label: 'Very High' }
  ],
  co2: [
    { start: 400, end: 800, color: '#99cc00', label: 'Good' },
    { start: 800, end: 1200, color: '#00cc44', label: 'Optimum' },
    { start: 1200, end: 2000 , color: '#ff5f4d', label: 'High' },
    { start: 2000, end: 3000, color: '#1c0000', label: 'Dangerous' }
  ],
  humidity: [
    { start: 0, end: 30, color: '#ff4d4d', label: 'Low' },
    { start: 30, end: 60, color: '#ffa500', label: 'Moderate' },
    { start: 60, end: 90, color: '#00cc44', label: 'High' },
    { start: 90, end: 100, color: '#3399ff', label: 'Very High' }
  ],
  pressure: [
    { start: 900, end: 950, color: '#ff4d4d', label: 'Low' },
    { start: 950, end: 1000, color: '#ffa500', label: 'Moderate' },
    { start: 1000, end: 1050, color: '#00cc44', label: 'High' },
    { start: 1050, end: 1100, color: '#3399ff', label: 'Very High' }
  ],
  temperature: [
    { start: -10, end: 0, color: '#00ccff', label: 'Very Cold' },
    { start: 0, end: 15, color: '#66ccff', label: 'Cold' },
    { start: 15, end: 25, color: '#00cc44', label: 'Comfortable' },
    { start: 25, end: 35, color: '#ffa500', label: 'Warm' },
    { start: 35, end: 50, color: '#ff4d4d', label: 'Hot' }
  ],
  ec: [
    { start: 0, end: 500, color: '#ff4d4d', label: 'Low' },
    { start: 500, end: 1000, color: '#ffa500', label: 'Moderate' },
    { start: 1000, end: 1500, color: '#00cc44', label: 'High' },
    { start: 1500, end: 2000, color: '#3399ff', label: 'Very High' }
  ]
});

export const sensorRanges = readable<Record<string, SensorRange>>({
  moisture: { min: 0, max: 100 },
  co2: { min: 0, max: 3000 },
  humidity: { min: 0, max: 100 },
  pressure: { min: 900, max: 1100 },
  temperature: { min: -10, max: 50 },
  ec: { min: 0, max: 2000 }
});

export const sensorUnits: Record<string, string> = {
  moisture: '%',
  co2: 'ppm',
  humidity: '%',
  pressure: 'hPa',
  temperature: '°C',
  ec: 'µS/cm'
}; 