import { writable } from 'svelte/store';

const chartPreferences = writable({
    showMoisture: true,
    showTemperature: true,
    showEC: true,
    showMoistureAxis: true,
    showTemperatureAxis: true,
    showECAxis: true
});

export default chartPreferences;