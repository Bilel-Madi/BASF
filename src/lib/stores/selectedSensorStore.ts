import { writable } from 'svelte/store';

export const selectedSensorStore = writable<{
    device_id: string;
    name: string;
    device_type: string;
    // Add other relevant properties as needed
  } | null>(null);

// Subscribe to store changes and log them
selectedSensorStore.subscribe(value => {
    console.log('Selected sensor:', value);
});
