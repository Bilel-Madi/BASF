<!-- src/routes/dashboard/+page.svelte -->

<script lang="ts">
	import MapboxMap from '$lib/components/map/MapboxMap.svelte';
	import MultiChart from '$lib/components/chart/MultiChart.svelte';
	import { onMount } from 'svelte';
	import { writable, get } from 'svelte/store';
	import type { Zone, Device } from '@prisma/client';

	export let data: {
		zones: Array<Zone & { devices: Device[] }>;
		devices: Device[];
	};

	const MAPBOX_ACCESS_TOKEN =
		'pk.eyJ1IjoiYmlsZWxtYWRpIiwiYSI6ImNsbmJnM2ZrNTA1cXQybG56N2c0cjJ2bTcifQ.j-O_Igwc-2p3Na-mkusaDg';

	// Stores for selected devices and readings
	const selectedDevices = writable<Device[]>([]);
	const selectedReadings = writable<string[]>([]);
	const chartData = writable([]);

	// Time frame selection
	const timeFrames = ['1d', '3d', '1w', '2w', '1m', '3m', '6m', '1y', 'all'];
	let selectedTimeFrame = '1w';

	// Prepare GeoJSON data for the map
	$: mapFeatures = [
		// Zone features
		...data.zones.map((zone) => ({
			type: 'Feature',
			geometry: zone.geometry,
			properties: {
				type: 'zone',
				id: zone.id,
				name: zone.name
			}
		})),
		// Device features
		...data.devices
			.filter((device) => device.location)
			.map((device) => ({
				type: 'Feature',
				geometry: {
					type: 'Point',
					coordinates: [device.location.longitude, device.location.latitude]
				},
				properties: {
					type: 'device',
					id: device.eui,
					name: device.name,
					deviceType: device.type
				}
			}))
	];

	// Function to handle device selection from the map
	function handleDeviceClick(event) {
		const features = event.detail.features;
		if (features.length > 0) {
			const feature = features[0];
			if (feature.properties.type === 'device') {
				const device = data.devices.find((d) => d.eui === feature.properties.id);
				if (device) {
					selectedDevices.update((devices) => {
						if (devices.find((d) => d.eui === device.eui)) {
							return devices.filter((d) => d.eui !== device.eui);
						} else {
							return [...devices, device];
						}
					});
				}
			}
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

	// Reactive statement to fetch data when selection changes
	$: {
		if (get(selectedDevices).length > 0 && get(selectedReadings).length > 0) {
			fetchChartData();
		}
	}

	// Function to handle time frame change
	function setTimeFrame(frame: string) {
		selectedTimeFrame = frame;
		if (get(selectedDevices).length > 0 && get(selectedReadings).length > 0) {
			fetchChartData();
		}
	}
</script>

<div class="dashboard">
	<div class="dashboard-header">
		<h1>Dashboard</h1>
		<div class="timeframe-controls">
			{#each timeFrames as frame}
				<button class:selected={selectedTimeFrame === frame} on:click={() => setTimeFrame(frame)}>
					{frame}
				</button>
			{/each}
		</div>
	</div>

	<div class="dashboard-grid">
		<div class="map-section">
			<h2>Map View</h2>
			<MapboxMap
				accessToken={MAPBOX_ACCESS_TOKEN}
				{mapFeatures}
				on:deviceClick={handleDeviceClick}
			/>
		</div>

		<div class="chart-section">
			<h2>Data Analysis</h2>
			<MultiChart
				data={$chartData}
				devices={data.devices}
				bind:selectedDevices={$selectedDevices}
				bind:selectedReadings={$selectedReadings}
			/>
		</div>
	</div>
</div>

<style>
	.dashboard {
		padding: 1rem;
		max-width: 1600px;
		margin: 0 auto;
	}

	.dashboard-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	h1 {
		margin: 0;
		font-size: 1.5rem;
	}

	h2 {
		margin: 0 0 1rem 0;
		font-size: 1.2rem;
	}

	.timeframe-controls {
		display: flex;
		gap: 0.5rem;
	}

	.timeframe-controls button {
		padding: 0.5rem 1rem;
		border: 1px solid #ddd;
		background: white;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.timeframe-controls button.selected {
		background: #007bff;
		color: white;
		border-color: #0056b3;
	}

	.dashboard-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
		margin-top: 1rem;
	}

	.map-section,
	.chart-section {
		background: white;
		border-radius: 8px;
		padding: 1rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.map-section {
		height: 600px;
	}

	.chart-section {
		height: 600px;
	}

	@media (max-width: 1024px) {
		.dashboard-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
