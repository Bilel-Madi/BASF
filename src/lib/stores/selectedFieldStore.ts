// $lib/stores/selectedFieldStore.js
import { writable } from 'svelte/store';

// Change the initial value to be an object with name and area properties
export const selectedFieldName = writable({ name: '', area: 0 });
