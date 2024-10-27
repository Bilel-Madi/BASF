import { writable } from 'svelte/store';

export const scheduleStore = writable({
    duration: 0,
    startTime: '',
    days: []
});
