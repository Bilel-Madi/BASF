// latestDataFetch.ts
import { latestDataStore, type LatestDataEntry } from '$lib/stores/latestDataStore';

export async function fetchLatestData(): Promise<void> {
    try {
        // Make a request to the `/api/data-fetch-latest` endpoint
        const response = await fetch('/api/data-fetch-latest');
        const data: LatestDataEntry[] = await response.json();

        // Update the store with the fetched data
        latestDataStore.set(data);
    } catch (error) {
        console.error('Error fetching the latest data:', error);
    }
}
