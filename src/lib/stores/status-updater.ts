
import { writable } from 'svelte/store';

export const statusStore = writable({
    temperature: '',
    ec: '',
    moisture: ''
});
