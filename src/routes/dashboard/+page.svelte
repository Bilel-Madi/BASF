<!-- src/routes/dashboard/+page.svelte -->

<script lang="ts">
	import { writable } from 'svelte/store';
	import { sensorThresholds, sensorRanges, sensorUnits } from '$lib/stores/thresholds';
	import SensorReading from '$lib/components/sensors/SensorReading.svelte';
	import ThresholdBar from '$lib/components/ui/ThresholdBar.svelte';
	import MapboxMap from '$lib/components/map/MapboxMap.svelte';
	import Chart from '$lib/components/chart/Chart.svelte';
	import LastActivity from '$lib/components/Activity/LastActivity.svelte';
	import type { Zone, Device, Project } from '@prisma/client';
	import { colorMap } from '$lib/colorMap';
	import type { ZoneColor } from '$lib/colorMap';

	export let data: {
		project: Project;
		zones: Array<Zone & { devices: Device[] }>;
		devices: Array<Device & { latestData: any }>;
	};

	console.log('Project data:', data.project);

	const MAPBOX_ACCESS_TOKEN =
		'pk.eyJ1IjoiYmlsZWxtYWRpIiwiYSI6ImNsbmJnM2ZrNTA1cXQybG56N2c0cjJ2bTcifQ.j-O_Igwc-2p3Na-mkusaDg';

	// Prepare GeoJSON data for the map
	$: mapFeatures = [
		// Project boundary feature
		{
			type: 'Feature',
			geometry: data.project.geometry,
			properties: {
				type: 'projectBoundary',
				id: data.project.id,
				name: data.project.name
			}
		},
		// Zone features with dynamic colors
		...data.zones.map((zone) => ({
			type: 'Feature',
			geometry: zone.geometry,
			properties: {
				type: 'zone',
				id: zone.id,
				name: zone.name,
				color: colorMap[zone.color as ZoneColor] || '#088' // Default color if mapping fails
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

	// Extract the project's center coordinates
	let projectCenter: [number, number] = [0, 0];

	$: if (data.project && data.project.center) {
		projectCenter = data.project.center.coordinates as [number, number];
	}

	// Store for selected devices
	const selectedDevice = writable<Device | null>(null);

	// Function to handle device selection from the map
	function handleDeviceClick(event) {
		const features = event.detail.features;
		if (features.length > 0) {
			const feature = features[0];
			if (feature.properties.type === 'device') {
				// Find the device in your devices data
				const eui = feature.properties.id;
				const device = data.devices.find((d) => d.eui === eui) || null;
				selectedDevice.set(device);
			}
		}
	}

	// Subscribe to selectedDevice to reactively update selectedDeviceData
	let selectedDeviceData = null;

	selectedDevice.subscribe((device) => {
		selectedDeviceData = device;
	});

	const CO2_SENSOR_READINGS = ['co2', 'humidity', 'pressure', 'temperature'];
	const SOIL_MOISTURE_READINGS = ['moisture', 'ec', 'temperature'];
</script>

<div class="dashboard">
	<div class="top-row">
		<div class="info-card last-seen">
			<LastActivity />
		</div>
		<div class="info-card alerts">
			<h3>Alerts</h3>
		</div>
		<div class="info-card weather">
			<h3>Weather</h3>
		</div>
	</div>

	<div class="dashboard-grid">
		<div class="main-column">
			<div class="map-section">
				<MapboxMap
					accessToken={MAPBOX_ACCESS_TOKEN}
					{mapFeatures}
					on:deviceClick={handleDeviceClick}
					center={projectCenter}
					zoom={17}
					height="100%"
					borderRadius="15px"
				/>
			</div>
			<div class="chart-container">
				<Chart {data} selectedDevice={$selectedDevice} />
			</div>
		</div>
		<div class="side-column">
			<div class="metadata-section card">
				<h2>Metadata</h2>
				<p><strong>Project Purpose:</strong> {data.project.purpose}</p>
				<p><strong>Created At:</strong> {new Date(data.project.createdAt).toLocaleDateString()}</p>
			</div>
			<div class="latest-readings card">
				<h2>Current Values</h2>
				{#if selectedDeviceData}
					<div class="device-reading">
						{#if selectedDeviceData.type === 'CO2_SENSOR'}
							{#each CO2_SENSOR_READINGS as sensorType}
								<SensorReading
									label={sensorType.charAt(0).toUpperCase() + sensorType.slice(1)}
									value={selectedDeviceData.latestData[sensorType]}
									unit={sensorUnits[sensorType]}
									thresholds={$sensorThresholds[sensorType]}
									min={$sensorRanges[sensorType].min}
									max={$sensorRanges[sensorType].max}
								/>
							{/each}
						{:else if selectedDeviceData.type === 'SOIL_MOISTURE'}
							{#each SOIL_MOISTURE_READINGS as sensorType}
								<SensorReading
									label={sensorType.charAt(0).toUpperCase() + sensorType.slice(1)}
									value={selectedDeviceData.latestData[sensorType]}
									unit={sensorUnits[sensorType]}
									thresholds={$sensorThresholds[sensorType]}
									min={$sensorRanges[sensorType].min}
									max={$sensorRanges[sensorType].max}
								/>
							{/each}
						{/if}
					</div>
				{:else}
					<p>Please select a device on the map to see its latest readings.</p>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.dashboard {
		position: relative;
		padding: 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		height: 100vh;
		max-height: 93vh;
		overflow: hidden;
	}

	.top-row {
		display: grid;
		grid-template-columns: 2fr 3fr 5fr;
		gap: 0.5rem;
		height: 50px;
		min-height: 50px;
	}

	.info-card {
		background: white;
		border-radius: 8px;
		padding: 0.5rem;
		border: 1px solid #d8d8d8;
	}

	.dashboard-grid {
		display: grid;
		grid-template-columns: 4fr 1fr;
		gap: 0.5rem;
		height: calc(96vh - 90px);
		overflow: hidden;
	}

	.main-column {
		display: grid;
		grid-template-rows: 3fr 1fr;
		gap: 0.5rem;
		overflow: hidden;
	}

	.map-section {
		background: white;
		border-radius: 10px;
		padding: 0.5rem;
		border: 1px solid #d8d8d8;
		overflow: hidden;
	}

	.chart-container {
		background: white;
		border-radius: 10px;
		overflow: hidden;
		height: auto;
		border: 1px solid #d8d8d8;
		max-height: 400px;
	}

	.side-column {
		display: grid;
		grid-template-rows: 1fr 1fr;
		gap: 0.5rem;
		overflow: hidden;
	}

	.latest-readings,
	.metadata-section {
		background: white;
		border-radius: 10px;
		padding: 1rem;
		border: 1px solid #d8d8d8;
		overflow-y: auto;
	}

	.latest-readings h2,
	.metadata-section h2 {
		margin-top: 0;
		margin-bottom: 1.5rem;
		font-size: 1rem;
	}

	.device-reading {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.card {
		display: flex;
		flex-direction: column;
	}

	/* Adjust card heights */
	.main-column,
	.side-column {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.map-section,
	.latest-readings,
	.metadata-section {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.metadata-section {
		flex-grow: 1;
	}
</style>
