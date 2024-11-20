<!-- src/routes/dashboard/+page.svelte -->

<script lang="ts">
	import MapboxMap from '$lib/components/map/MapboxMap.svelte';
	import Chart from '$lib/components/chart/Chart.svelte';
	import Breadcrumbs from '$lib/components/ui/Breadcrumbs.svelte';
	import Button from '$lib/components/ui/Button.svelte';
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

	// Function to handle device selection from the map
	function handleDeviceClick(event) {
		const features = event.detail.features;
		if (features.length > 0) {
			const feature = features[0];
			if (feature.properties.type === 'device') {
				// Handle device click (e.g., show device details)
				alert(`Device Clicked: ${feature.properties.name}`);
			}
		}
	}

	// State for selected devices (for potential future use)
	import { writable } from 'svelte/store';
	const selectedDevices = writable<Device[]>([]);

	let isDropdownOpen = false;
	let searchQuery = '';

	const deviceImagePath = {
		SOIL_MOISTURE: '/images/soil.png',
		CO2_SENSOR: '/images/co2_sensor.png',
		UNKNOWN: '/images/unknown_device.png'
	};

	function toggleDevice(device: Device) {
		selectedDevices.update((devices) => {
			if (devices.find((d) => d.eui === device.eui)) {
				return devices.filter((d) => d.eui !== device.eui);
			} else {
				return [...devices, device];
			}
		});
	}

	$: filteredDevices = data.devices.filter(
		(device) =>
			device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			device.eui.toLowerCase().includes(searchQuery.toLowerCase())
	);
</script>

<div class="dashboard">
	<div class="top-row">
		<div class="info-card last-seen">
			<LastActivity />
		</div>
		<div class="info-card alerts">
			<h3>Alerts</h3>
			<!-- Implement alerts logic here -->
		</div>
		<div class="info-card weather">
			<h3>Weather</h3>
			<!-- Implement weather logic here -->
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
					zoom={15}
				/>
			</div>
			<Chart {data} />
		</div>
		<div class="side-column">
			<div class="latest-readings card">
				<h2>Latest Readings</h2>
				<!-- Implement latest readings display here -->
				{#each data.devices as device}
					<div class="device-reading">
						<h3>{device.name}</h3>
						{#if device.latestData.co2 !== undefined}
							<p>CO2: {device.latestData.co2}</p>
						{/if}
						{#if device.latestData.moisture !== undefined}
							<p>Moisture: {device.latestData.moisture}</p>
						{/if}
						<!-- Add more readings as needed -->
					</div>
				{/each}
			</div>
			<div class="metadata-section card">
				<h2>Metadata</h2>
				<p><strong>Project Purpose:</strong> {data.project.purpose}</p>
				<p><strong>Created At:</strong> {new Date(data.project.createdAt).toLocaleDateString()}</p>
				<!-- Add more metadata as needed -->
			</div>
		</div>
	</div>
</div>

<style>
	.dashboard {
		position: relative;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		background-color: #f5f5f5;
		height: 100vh;
		overflow: hidden;
	}

	.top-row {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
	}

	.info-card {
		background: white;
		border-radius: 8px;
		padding: 1rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.dashboard-grid {
		display: grid;
		grid-template-columns: 3fr 1fr;
		gap: 1rem;
		flex: 1;
		overflow: hidden;
	}

	.main-column {
		display: grid;
		grid-template-rows: 1fr 1fr;
		gap: 1rem;
	}

	.map-section {
		background: white;
		border-radius: 10px;
		padding: 1rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	.side-column {
		display: grid;
		grid-template-rows: 1fr 1fr;
		gap: 1rem;
		overflow: hidden;
	}

	.latest-readings,
	.metadata-section {
		background: white;
		border-radius: 10px;
		padding: 1.5rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		overflow-y: auto;
	}

	.latest-readings h2,
	.metadata-section h2 {
		margin-top: 0;
		margin-bottom: 1rem;
		font-size: 1.5rem;
	}

	.device-reading {
		margin-bottom: 1rem;
	}

	.device-reading h3 {
		margin-bottom: 0.5rem;
	}

	.dashboard-grid,
	.main-column,
	.side-column {
		overflow: hidden;
	}

	@media (max-width: 1024px) {
		.dashboard-grid {
			grid-template-columns: 1fr;
		}

		.main-column,
		.side-column {
			grid-template-rows: auto;
		}
	}
</style>
