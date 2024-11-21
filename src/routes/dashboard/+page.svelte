<!-- src/routes/dashboard/+page.svelte -->

<script lang="ts">
	import { writable } from 'svelte/store';
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

	// Thresholds definitions (copied from [eui] page)
	const moistureThresholds = [
		{ start: 0, end: 10, color: '#ff4d4d', label: 'Critical' },
		{ start: 10, end: 20, color: '#ffa500', label: 'Low' },
		{ start: 20, end: 40, color: '#00cc44', label: 'Good' },
		{ start: 40, end: 50, color: '#3399ff', label: 'High' },
		{ start: 50, end: 100, color: '#9933ff', label: 'Very High' }
	];

	const co2Thresholds = [
		{ start: 0, end: 400, color: '#00cc44', label: 'Good' },
		{ start: 400, end: 800, color: '#ffa500', label: 'Moderate' },
		{ start: 800, end: 1200, color: '#ff4d4d', label: 'High' },
		{ start: 1200, end: 2000, color: '#990000', label: 'Very High' }
	];

	const humidityThresholds = [
		{ start: 0, end: 30, color: '#ff4d4d', label: 'Low' },
		{ start: 30, end: 60, color: '#ffa500', label: 'Moderate' },
		{ start: 60, end: 90, color: '#00cc44', label: 'High' },
		{ start: 90, end: 100, color: '#3399ff', label: 'Very High' }
	];

	const pressureThresholds = [
		{ start: 900, end: 950, color: '#ff4d4d', label: 'Low' },
		{ start: 950, end: 1000, color: '#ffa500', label: 'Moderate' },
		{ start: 1000, end: 1050, color: '#00cc44', label: 'High' },
		{ start: 1050, end: 1100, color: '#3399ff', label: 'Very High' }
	];

	const temperatureThresholds = [
		{ start: -10, end: 0, color: '#00ccff', label: 'Very Cold' },
		{ start: 0, end: 15, color: '#66ccff', label: 'Cold' },
		{ start: 15, end: 25, color: '#00cc44', label: 'Comfortable' },
		{ start: 25, end: 35, color: '#ffa500', label: 'Warm' },
		{ start: 35, end: 50, color: '#ff4d4d', label: 'Hot' }
	];

	const ecThresholds = [
		{ start: 0, end: 500, color: '#ff4d4d', label: 'Low' },
		{ start: 500, end: 1000, color: '#ffa500', label: 'Moderate' },
		{ start: 1000, end: 1500, color: '#00cc44', label: 'High' },
		{ start: 1500, end: 2000, color: '#3399ff', label: 'Very High' }
	];

	// Subscribe to selectedDevice to reactively update selectedDeviceData
	let selectedDeviceData = null;

	selectedDevice.subscribe((device) => {
		if (device) {
			selectedDeviceData = device;
		} else {
			selectedDeviceData = null;
		}
	});

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
				<h2>Current Values</h2>
				{#if selectedDeviceData}
					<div class="device-reading">
						{#if selectedDeviceData.type === 'CO2_SENSOR'}
							<!-- Display CO2_SENSOR readings using ThresholdBar -->
							<div class="reading-item">
								<div class="reading-header">
									<div class="reading-title">
										<span class="label">CO₂:</span>
										<span class="current-value">{selectedDeviceData.latestData.co2} ppm</span>
									</div>
									<div
										class="status-tag"
										style="background-color: {co2Thresholds.find(
											(t) =>
												selectedDeviceData.latestData.co2 >= t.start &&
												selectedDeviceData.latestData.co2 <= t.end
										)?.color || '#f0f0f0'}"
									>
										{co2Thresholds.find(
											(t) =>
												selectedDeviceData.latestData.co2 >= t.start &&
												selectedDeviceData.latestData.co2 <= t.end
										)?.label || ''}
									</div>
								</div>
								<ThresholdBar
									value={selectedDeviceData.latestData.co2}
									min={0}
									max={2000}
									thresholds={co2Thresholds}
								/>
							</div>

							<div class="reading-item">
								<div class="reading-header">
									<div class="reading-title">
										<span class="label">Humidity:</span>
										<span class="current-value">{selectedDeviceData.latestData.humidity} %</span>
									</div>
									<div
										class="status-tag"
										style="background-color: {humidityThresholds.find(
											(t) =>
												selectedDeviceData.latestData.humidity >= t.start &&
												selectedDeviceData.latestData.humidity <= t.end
										)?.color || '#f0f0f0'}"
									>
										{humidityThresholds.find(
											(t) =>
												selectedDeviceData.latestData.humidity >= t.start &&
												selectedDeviceData.latestData.humidity <= t.end
										)?.label || ''}
									</div>
								</div>
								<ThresholdBar
									value={selectedDeviceData.latestData.humidity}
									min={0}
									max={100}
									thresholds={humidityThresholds}
								/>
							</div>

							<div class="reading-item">
								<div class="reading-header">
									<div class="reading-title">
										<span class="label">Pressure:</span>
										<span class="current-value">{selectedDeviceData.latestData.pressure} hPa</span>
									</div>
									<div
										class="status-tag"
										style="background-color: {pressureThresholds.find(
											(t) =>
												selectedDeviceData.latestData.pressure >= t.start &&
												selectedDeviceData.latestData.pressure <= t.end
										)?.color || '#f0f0f0'}"
									>
										{pressureThresholds.find(
											(t) =>
												selectedDeviceData.latestData.pressure >= t.start &&
												selectedDeviceData.latestData.pressure <= t.end
										)?.label || ''}
									</div>
								</div>
								<ThresholdBar
									value={selectedDeviceData.latestData.pressure}
									min={900}
									max={1100}
									thresholds={pressureThresholds}
								/>
							</div>

							<div class="reading-item">
								<div class="reading-header">
									<div class="reading-title">
										<span class="label">Temperature:</span>
										<span class="current-value">{selectedDeviceData.latestData.temperature} °C</span
										>
									</div>
									<div
										class="status-tag"
										style="background-color: {temperatureThresholds.find(
											(t) =>
												selectedDeviceData.latestData.temperature >= t.start &&
												selectedDeviceData.latestData.temperature <= t.end
										)?.color || '#f0f0f0'}"
									>
										{temperatureThresholds.find(
											(t) =>
												selectedDeviceData.latestData.temperature >= t.start &&
												selectedDeviceData.latestData.temperature <= t.end
										)?.label || ''}
									</div>
								</div>
								<ThresholdBar
									value={selectedDeviceData.latestData.temperature}
									min={-10}
									max={50}
									thresholds={temperatureThresholds}
								/>
							</div>
						{:else if selectedDeviceData.type === 'SOIL_MOISTURE'}
							<!-- Reordered: Moisture first, then EC, then Temperature -->
							<div class="reading-item">
								<div class="reading-header">
									<div class="reading-title">
										<span class="label">Moisture:</span>
										<span class="current-value">{selectedDeviceData.latestData.moisture} %</span>
									</div>
									<div
										class="status-tag"
										style="background-color: {moistureThresholds.find(
											(t) =>
												selectedDeviceData.latestData.moisture >= t.start &&
												selectedDeviceData.latestData.moisture <= t.end
										)?.color || '#f0f0f0'}"
									>
										{moistureThresholds.find(
											(t) =>
												selectedDeviceData.latestData.moisture >= t.start &&
												selectedDeviceData.latestData.moisture <= t.end
										)?.label || ''}
									</div>
								</div>
								<ThresholdBar
									value={selectedDeviceData.latestData.moisture}
									min={0}
									max={100}
									thresholds={moistureThresholds}
								/>
							</div>

							<!-- EC reading moved to second position -->
							<div class="reading-item">
								<div class="reading-header">
									<div class="reading-title">
										<span class="label">EC:</span>
										<span class="current-value">{selectedDeviceData.latestData.ec} µS/cm</span>
									</div>
									<div
										class="status-tag"
										style="background-color: {ecThresholds.find(
											(t) =>
												selectedDeviceData.latestData.ec >= t.start &&
												selectedDeviceData.latestData.ec <= t.end
										)?.color || '#f0f0f0'}"
									>
										{ecThresholds.find(
											(t) =>
												selectedDeviceData.latestData.ec >= t.start &&
												selectedDeviceData.latestData.ec <= t.end
										)?.label || ''}
									</div>
								</div>
								<ThresholdBar
									value={selectedDeviceData.latestData.ec}
									min={0}
									max={2000}
									thresholds={ecThresholds}
								/>
							</div>

							<!-- Temperature reading moved to last position -->
							<div class="reading-item">
								<div class="reading-header">
									<div class="reading-title">
										<span class="label">Temperature:</span>
										<span class="current-value">{selectedDeviceData.latestData.temperature} °C</span
										>
									</div>
									<div
										class="status-tag"
										style="background-color: {temperatureThresholds.find(
											(t) =>
												selectedDeviceData.latestData.temperature >= t.start &&
												selectedDeviceData.latestData.temperature <= t.end
										)?.color || '#f0f0f0'}"
									>
										{temperatureThresholds.find(
											(t) =>
												selectedDeviceData.latestData.temperature >= t.start &&
												selectedDeviceData.latestData.temperature <= t.end
										)?.label || ''}
									</div>
								</div>
								<ThresholdBar
									value={selectedDeviceData.latestData.temperature}
									min={-10}
									max={50}
									thresholds={temperatureThresholds}
								/>
							</div>
						{/if}
					</div>
				{:else}
					<p>Please select a device on the map to see its latest readings.</p>
				{/if}
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
		padding: 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		background-color: #f5f5f5;
		height: 100vh;
		overflow: hidden;
	}

	.top-row {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.5rem;
	}

	.info-card {
		background: white;
		border-radius: 8px;
		padding: 1rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.dashboard-grid {
		display: grid;
		grid-template-columns: 4fr 1fr;
		gap: 0.5rem;
		flex: 1;
		overflow: hidden;
	}

	.main-column {
		display: grid;
		grid-template-rows: 2fr 1fr;
		gap: 0.5rem;
	}

	.map-section {
		background: white;
		border-radius: 10px;
		padding: 1rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	.side-column {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		overflow: hidden;
	}

	.latest-readings,
	.metadata-section {
		background: white;
		border-radius: 10px;
		padding: 1.5rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		overflow-y: auto;
		max-height: 432px;
	}

	.latest-readings h2,
	.metadata-section h2 {
		margin-top: 0;
		margin-bottom: 1.5rem;
		font-size: 1rem;
	}

	.device-reading {
		margin-bottom: 1rem;
	}

	.device-reading h3 {
		margin-bottom: 0.5rem;
	}

	.card {
		display: flex;
		flex-direction: column;
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

	/* Latest Readings Styles */
	.reading-item {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.reading-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.reading-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.label {
		font-size: 0.875rem;
		color: #666;
		font-weight: 500;
	}

	.current-value {
		font-weight: 600;
		color: #111;
	}

	.status-tag {
		padding: 4px 8px;
		border-radius: 10px;
		color: white;
		font-size: 10px;
		font-weight: 500;
		opacity: 0.8;
		margin-left: auto;
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
	.metadata-section,
	.chart-section {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.metadata-section {
		flex-grow: 1;
	}
</style>
