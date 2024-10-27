import { writable } from 'svelte/store';

const selectedDeviceId = writable(null);

export default selectedDeviceId;