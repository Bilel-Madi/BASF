<!-- src/lib/components/chart/Chart.svelte -->

<script lang="ts">
	import MultiChart from './MultiChart.svelte';
	import ChartControls from './ChartControls.svelte';
	import { writable, get } from 'svelte/store';
	import type { Device } from '@prisma/client';

	export let data: {
		zones: Array<Zone & { devices: Device[] }>;
		devices: Device[];
	};
	export let selectedDevice: Device | null;

	// Stores for selected devices and readings
	const selectedDevices = writable<Device[]>([]);
	const selectedReadings = writable<string[]>([]);
	const chartData = writable([]);

	// Set default time frame
	const DEFAULT_TIME_FRAME = '2w';
	const timeFrames = ['1d', '3d', '1w', '2w', '1m', '3m', '6m', '1y', 'all'];
	let selectedTimeFrame = DEFAULT_TIME_FRAME;

	// Add state for active datasets
	let activeDatasets = new Set();

	// Watch for changes in selectedDevice
	$: if (selectedDevice) {
		// Update selectedDevices store with the new device
		selectedDevices.set([selectedDevice]);

		// Set default readings based on device type
		if (selectedDevice.type === 'CO2_SENSOR') {
			selectedReadings.set(['co2', 'temperature']);
		} else if (selectedDevice.type === 'SOIL_MOISTURE') {
			selectedReadings.set(['moisture', 'temperature', 'ec']);
		} else if (selectedDevice.type === 'LIQUID_LEVEL') {
			selectedReadings.set(['liquid_level', 'liquid_temperature']);
		}

		// Fetch data for the selected device
		handleSelectionChange();
	}

	// Function to handle selection changes
	async function handleSelectionChange() {
		const devices = get(selectedDevices);
		const readings = get(selectedReadings);

		if (devices.length > 0 && readings.length > 0) {
			await fetchChartData();
		}
	}

	// Function to fetch data for selected devices
	async function fetchChartData() {
		const devices = get(selectedDevices);
		const readings = get(selectedReadings);

		if (devices.length === 0 || readings.length === 0) {
			chartData.set([]);
			return;
		}

		const params = new URLSearchParams();
		params.set('range', selectedTimeFrame);

		try {
			const dataPromises = devices.map(async (device) => {
				const res = await fetch(`/api/devices/${device.eui}/data?${params.toString()}`);
				if (!res.ok) throw new Error(`Failed to fetch data for device ${device.eui}`);
				const deviceData = await res.json();
				return { device, data: deviceData };
			});

			const results = await Promise.all(dataPromises);
			chartData.set(results);
		} catch (error) {
			console.error('Error fetching chart data:', error);
			chartData.set([]);
		}
	}

	// Function to handle time frame changes
	async function handleTimeFrameChange(event: CustomEvent<string>) {
		selectedTimeFrame = event.detail;
		await fetchChartData();
	}

	function handleDatasetToggle(event: CustomEvent<string>) {
		const datasetLabel = event.detail;
		if (activeDatasets.has(datasetLabel)) {
			activeDatasets.delete(datasetLabel);
		} else {
			activeDatasets.add(datasetLabel);
		}
		activeDatasets = activeDatasets; // trigger reactivity
	}
</script>

<div class="chart-section">
	<ChartControls
		devices={data.devices}
		bind:selectedDevices={$selectedDevices}
		bind:selectedReadings={$selectedReadings}
		bind:timeFrame={selectedTimeFrame}
		chartDatasets={$chartData.flatMap((d) => d.data.datasets)}
		{timeFrames}
		on:selectionChange={handleSelectionChange}
		on:timeFrameChange={handleTimeFrameChange}
		on:toggleDataset={handleDatasetToggle}
	/>

	<MultiChart
		data={$chartData}
		devices={data.devices}
		bind:selectedDevices={$selectedDevices}
		bind:selectedReadings={$selectedReadings}
		bind:timeFrame={selectedTimeFrame}
		{activeDatasets}
	/>
</div>

<style>
	.chart-section {
		padding: 1rem;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		min-height: 0;
		height: 100%;
	}
</style>
