import { writable } from 'svelte/store';

// Create a writable store to hold the valve toggle state and coordinates
export const valveToggleStore = writable({
  isValveOpen: false,
  coordinates: null
});