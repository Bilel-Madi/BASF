import { writable } from 'svelte/store';
import { fetchData } from '$lib/utils/dataFetch';
import type { DataEntry } from '$lib/utils/dataFetch';

const datastore = writable<DataEntry[]>([]);

export async function updateDatastore(device_id?: string, startDate?: string, endDate?: string) {
    const fetchedData = await fetchData(device_id, startDate, endDate);
    datastore.set(fetchedData);
}

export { datastore };
