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
	import BatteryIcon from '$lib/components/icons/BatteryIcon.svelte';
	import SignalIcon from '$lib/components/icons/SignalIcon.svelte';
	import StatusDot from '$lib/components/ui/StatusDot.svelte';

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

	// Initialize the selectedDevice with the first device in the list, if available
	const selectedDevice = writable<Device | null>(data.devices.length > 0 ? data.devices[0] : null);

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

	// Helper function to calculate time since last message in minutes
	function timeSinceLastMessage(receivedAt: string): number {
		const receivedDate = new Date(receivedAt);
		const now = new Date();
		const diffMs = now.getTime() - receivedDate.getTime();
		return Math.floor(diffMs / 60000); // Convert milliseconds to minutes
	}

	// Function to determine status color
	function getStatusColor(receivedAt: string): string {
		const minutes = timeSinceLastMessage(receivedAt);
		return minutes < 120 ? '#00d87e' : '#f44336';
	}

	// Function to format time since last message
	function formatTimeSince(minutes: number): string {
		if (minutes < 60) {
			return `${minutes} minutes ago`;
		} else {
			const hours = Math.floor(minutes / 60);
			const remainingMinutes = minutes % 60;
			return `${hours}h ${remainingMinutes}m ago`;
		}
	}

	// Dynamic Battery Level (0-100)
	function getBatteryLevel(batteryStatus: number | null): number {
		if (batteryStatus === null || batteryStatus === undefined) return 0;
		// Assuming battery_status is a percentage
		return Math.min(Math.max(batteryStatus, 0), 100);
	}
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
				<h2>Device Information</h2>
				{#if selectedDeviceData}
					<div class="device-info-container">
						<div class="device-image-section">
							<div class="status-bar">
								<div class="status-left">
									<StatusDot color={getStatusColor(selectedDeviceData.last_seen)} size="8px" />
									<span class="status-time"
										>{formatTimeSince(timeSinceLastMessage(selectedDeviceData.last_seen))}</span
									>
								</div>
								<div class="status-right">
									<SignalIcon strength={selectedDeviceData.rssi} label="RSSI" />
									<SignalIcon strength={selectedDeviceData.snr} label="SNR" />
									<BatteryIcon level={getBatteryLevel(selectedDeviceData.battery_status)} />
								</div>
							</div>
							<div class="device-preview">
								<img
									src={selectedDeviceData.type === 'SOIL_MOISTURE'
										? '/images/soil.png'
										: selectedDeviceData.type === 'CO2_SENSOR'
										? '/images/co2_sensor.png'
										: '/images/unknown_device.png'}
									alt="Device"
								/>
							</div>
						</div>
						<div class="device-details-section">
							<div class="device-identifier">
								<span class="label">Device ID</span>
								<code class="eui">{selectedDeviceData.eui}</code>
								{#if selectedDeviceData.type === 'SOIL_MOISTURE' && selectedDeviceData.installedDepth}
									<span class="depth"
										>Installed at {selectedDeviceData.installedDepth} cm depth</span
									>
								{/if}
							</div>
							<div class="device-footer">
								<a href="/devices/{selectedDeviceData.eui}" class="device-link"
									>View device details</a
								>
							</div>
						</div>
					</div>
				{:else}
					<p>Select a device on the map to view details</p>
				{/if}
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
		padding: 0;
		overflow: hidden;
	}

	.metadata-section h2 {
		padding: 0.75rem 1rem;
		margin: 0;
		font-size: 0.875rem;
		border-bottom: 1px solid rgba(0, 0, 0, 0.1);
	}

	.device-info-container {
		display: flex;
		flex-direction: column;
		height: calc(100% - 2.5rem);
		position: relative;
	}

	.device-image-section {
		display: flex;
		flex-direction: column;
		background: #eef5f3;
		border-radius: 15px;
		padding: 0.5rem;
		width: 95%;
		margin: 0.5rem auto;
		min-height: 180px;
		position: relative;
	}

	.status-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.25rem 0.5rem;
		font-size: 0.8rem;
	}

	.status-left,
	.status-right {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.status-time {
		color: #666;
	}

	.device-preview {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -45%);
		width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.device-preview img {
		width: 80px;
		height: auto;
	}

	.device-footer {
		position: absolute;
		bottom: 0;
		right: 0;
		padding: 0.5rem;
	}

	.device-link {
		color: rgb(0, 20, 136);
		text-decoration: none;
		font-size: 0.875rem;
	}

	.device-link:hover {
		text-decoration: underline;
	}

	.device-details-section {
		padding: 1rem;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.25rem;
		width: 100%;
		padding: 0 0.5rem;
	}

	.device-identifier {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.25rem;
		width: 100%;
		padding: 0 0.5rem;
	}

	.label {
		font-size: 0.75rem;
		color: #666;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	code.eui {
		font-family: ui-monospace, monospace;
		font-size: 0.875rem;
		color: #333;
		background: rgba(0, 0, 0, 0.05);
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		width: 100%;
	}

	.depth {
		font-size: 0.75rem;
		color: #666;
		width: 100%;
	}

	/* Add media queries for responsive design */
	@media (max-width: 768px) {
		.dashboard {
			padding: 0.25rem;
			max-height: initial;
			height: auto;
			overflow: visible;
		}

		.dashboard-grid {
			grid-template-columns: 1fr;
			height: auto;
			overflow: visible;
			gap: 1rem;
		}

		.main-column {
			grid-template-rows: auto auto;
			gap: 1rem;
		}

		.map-section {
			height: 70vh;
			min-height: 400px;
		}

		.chart-container {
			height: 60vh;
			min-height: 400px;
			max-height: initial;
		}

		.side-column {
			grid-template-rows: auto auto;
			gap: 1rem;
		}

		.latest-readings,
		.metadata-section {
			height: auto;
			min-height: 400px;
			overflow-y: visible;
		}

		.device-reading {
			gap: 2rem;
			padding-bottom: 1rem;
		}
	}

	/* Add smaller screen optimizations */
	@media (max-width: 480px) {
		.map-section {
			height: 80vh;
			min-height: 500px;
		}

		.chart-container {
			height: 70vh;
			min-height: 450px;
		}

		.latest-readings,
		.metadata-section {
			min-height: 450px;
		}
	}

	.status-right {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		transform: scale(0.8);
		transform-origin: right center;
	}
</style>
