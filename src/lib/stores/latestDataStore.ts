// latestDataStore.ts
import { writable } from 'svelte/store';

export type LatestDataEntry = {
    device_id: string;
    received_at: Date;
    ec: number;
    temperature: number;
    moisture: number;
};


// Create a writable store to hold the latest data entries
export const latestDataStore = writable<LatestDataEntry[]>([]);