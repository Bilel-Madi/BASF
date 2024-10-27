// dataFetch.ts

export type DataEntry = {
    device_id: string;
    received_at: Date;
    ec: number;
    temperature: number;
    moisture: number;
};

export async function fetchData(device_id?: string, startDate?: string, endDate?: string): Promise<DataEntry[]> {
    try {
        // Calculate default dates if not provided
        const defaultStartDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const defaultEndDate = new Date().toISOString();

        let url = `/api/data-fetch?start=${startDate || defaultStartDate}&end=${endDate || defaultEndDate}`;

        if (device_id) {
            url += `&device_id=${device_id}`;
        }

        const response = await fetch(url);
        const fetchedDataArray = await response.json();

        const parsedData: DataEntry[] = fetchedDataArray.map((entry) => ({
            device_id: entry.device_id,
            received_at: new Date(entry.received_at),
            ec: entry.ec / 1000, // Convert µS/cm to mS/cm
            temperature: parseFloat(entry.temperature),
            moisture: parseFloat(entry.moisture)
        }));

        return parsedData;
    } catch (error) {
        console.error('Error fetching or parsing data:', error);
        return []; // Return an empty array on error
    }
}
