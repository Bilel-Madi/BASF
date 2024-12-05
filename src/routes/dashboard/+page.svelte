<!-- src/routes/dashboard/+page.svelte -->
<script lang="ts">
	import { writable } from 'svelte/store';
	import { sensorThresholds, sensorRanges, sensorUnits } from '$lib/stores/thresholds';
	import SensorReading from '$lib/components/sensors/SensorReading.svelte';
	import MapboxMap from '$lib/components/map/MapboxMap.svelte';
	import Chart from '$lib/components/chart/Chart.svelte';
	import LastActivity from '$lib/components/Activity/LastActivity.svelte';
	import type { Zone, Device, Project } from '@prisma/client';
	import { colorMap } from '$lib/colorMap';
	import type { ZoneColor } from '$lib/colorMap';
	import BatteryIcon from '$lib/components/icons/BatteryIcon.svelte';
	import SignalIcon from '$lib/components/icons/SignalIcon.svelte';
	import StatusDot from '$lib/components/ui/StatusDot.svelte';
	import { onMount } from 'svelte';
	import Weather from '$lib/components/weather/+page.svelte';
	import DeviceInfo from '$lib/components/cards/DeviceInfo.svelte';
	import { page } from '$app/stores';
	import LiquidLevelIndicator from '$lib/components/visualizations/LiquidLevelIndicator.svelte';

	// Add loading state
	let isLoading = true;

	// Update the data prop to handle loading state
	export let data: {
		project: Project;
		organization?: { name: string } | null;
		zones: Array<Zone & { devices: Device[] }>;
		devices: Array<Device & { latestData: any }>;
	};
	// Log the latest data
	console.log(data.devices.map((device) => device.latestData));

	// Initialize the selectedDevice with the first soil moisture sensor if available
	const selectedDevice = writable<Device | null>(null);

	onMount(() => {
		if (data.project && data.zones && data.devices) {
			isLoading = false;

			// Check for a soil moisture sensor
			const soilMoistureDevice = data.devices.find((device) => device.type === 'SOIL_MOISTURE');
			selectedDevice.set(soilMoistureDevice || (data.devices.length > 0 ? data.devices[0] : null));
		}
	});

	const MAPBOX_ACCESS_TOKEN =
		'pk.eyJ1IjoiYmlsZWxtYWRpIiwiYSI6ImNsbmJnM2ZrNTA1cXQybG56N2c0cjJ2bTcifQ.j-O_Igwc-2p3Na-mkusaDg';

	// Prepare GeoJSON data for the map
	$: mapFeatures = data.project
		? [
				// Project boundary feature
				...(data.project.geometry
					? [
							{
								type: 'Feature',
								geometry: data.project.geometry,
								properties: {
									type: 'projectBoundary',
									id: data.project.id,
									name: data.project.name
								}
							}
					  ]
					: []),
				// Zone features
				...(data.zones?.map((zone) => ({
					type: 'Feature',
					geometry: zone.geometry,
					properties: {
						type: 'zone',
						id: zone.id,
						name: zone.name,
						color: colorMap[zone.color as ZoneColor] || '#088'
					}
				})) || []),
				// Device features
				...(data.devices
					?.filter((device) => device.location)
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
					})) || [])
		  ]
		: [];

	// Extract project center with null check
	$: projectCenter = (data.project?.center?.coordinates as [number, number]) || [0, 0];

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
	const LIQUID_LEVEL_READINGS = ['level', 'temperature'];

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
	{#if data.project}
		<div class="top-row">
			<!-- {#if $page.data.user?.role === 'SUPER_ADMIN' && data.organization}
				<div class="info-card organization">
					<h3>Organization:</h3>
					<span class="org-name">{data.organization.name}</span>
				</div>
			{/if} -->
			<div class="info-card last-seen">
				<h3>Last Activity:</h3>
				{#if isLoading}
					<div class="skeleton skeleton-text" style="width: 60%;" />
				{:else}
					<LastActivity />
				{/if}
			</div>
			<div class="info-card alerts">
				<h3>Alerts</h3>
				{#if isLoading}
					<div class="skeleton skeleton-text" style="width: 90%;" />
				{:else}
					<span class="no-alerts">No alerts</span>
				{/if}
			</div>
			<div class="info-card weather">
				<h3>Weather</h3>
				{#if isLoading}
					<div class="skeleton skeleton-text" style="width: 90%;" />
				{:else}
					<div class="weather-wrapper">
						<Weather location={data.project.weatherLocation || 'Yarqa'} />
					</div>
				{/if}
			</div>
		</div>
	{:else}
		<div class="loading">Loading dashboard data...</div>
	{/if}

	<div class="dashboard-grid">
		<div class="map-section">
			{#if isLoading}
				<div class="skeleton skeleton-map" />
			{:else}
				<MapboxMap
					accessToken={MAPBOX_ACCESS_TOKEN}
					{mapFeatures}
					on:deviceClick={handleDeviceClick}
					center={projectCenter}
					zoom={17}
					height="100%"
					borderRadius="15px"
					maxZoom={19}
					minZoom={1}
				/>
			{/if}
		</div>
		<div class="metadata-section">
			<DeviceInfo {selectedDeviceData} {isLoading} />
		</div>
		<div class="chart-container">
			{#if isLoading}
				<div class="skeleton-card">
					<div class="skeleton skeleton-chart" />
				</div>
			{:else}
				<Chart {data} selectedDevice={$selectedDevice} />
			{/if}
		</div>
		<div class="latest-readings card">
			<h2>Current Values</h2>
			{#if isLoading}
				<div class="skeleton-card">
					<div class="skeleton skeleton-reading" />
					<div class="skeleton skeleton-reading" />
					<div class="skeleton skeleton-reading" />
					<div class="skeleton skeleton-reading" />
				</div>
			{:else if selectedDeviceData}
				<div class="readings-container">
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
						{:else if selectedDeviceData.type === 'LIQUID_LEVEL'}
							<div class="liquid-level-container">
								<LiquidLevelIndicator
									level={selectedDeviceData?.latestData?.liquid_level}
									maxLevel={10}
									width="100%"
									height="100%"
									showLabels={true}
									showAnimation={true}
								/>
								<SensorReading
									label="Water Temperature"
									value={selectedDeviceData.latestData.temperature}
									unit={sensorUnits.temperature}
									thresholds={$sensorThresholds.temperature}
									min={$sensorRanges.temperature.min}
									max={$sensorRanges.temperature.max}
								/>
							</div>
						{/if}
					</div>
				</div>
			{:else}
				<div class="readings-container">
					<p>Please select a device on the map to see its latest readings.</p>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	@keyframes shimmer {
		0% {
			background-position: -1000px 0;
		}
		100% {
			background-position: 1000px 0;
		}
	}

	.skeleton {
		background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
		background-size: 1000px 100%;
		animation: shimmer 2s infinite linear;
		border-radius: 8px;
		width: 100%;
	}

	.skeleton-text {
		height: 1rem;
		border-radius: 4px;
		margin: 0.5rem 0;
	}

	.skeleton-card {
		background: white;
		border: 1px solid #d8d8d8;
		height: 100%;
		overflow: hidden;
	}

	.skeleton-chart {
		height: 100%;
	}

	.skeleton-map {
		height: 100%;
	}

	.skeleton-reading {
		height: 60px;
		margin: 1rem 0;
	}

	.dashboard {
		position: relative;
		padding: 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		height: calc(100vh - 4rem); /* Adjust for header height */
		overflow: hidden;
	}

	.top-row {
		display: grid;
		grid-template-columns: 2fr 3fr 5fr;
		gap: 0.5rem;
		height: 50px;
		min-height: 50px;
	}

	h3 {
		font-size: 1rem;
		font-weight: 600;
		margin-left: 0.5rem;
	}

	.info-card {
		display: flex;
		flex-direction: row;
		background: white;
		border-radius: 8px;
		padding: 0.5rem 1rem;
		border: 1px solid #d8d8d8;
		justify-content: flex-start;
		align-items: center;
		gap: 1rem;
	}

	.dashboard-grid {
		flex-grow: 1;
		display: grid;
		grid-template-columns: 4fr 1fr;
		grid-template-rows: 1fr 1fr;
		gap: 0.5rem;
		overflow: hidden;
	}

	.map-section {
		grid-column: 1 / 2;
		grid-row: 1 / 2;
		background: white;
		border-radius: 10px;
		padding: 0.5rem;
		border: 1px solid #d8d8d8;
		overflow: hidden;
		height: 100%;
	}

	.metadata-section {
		grid-column: 2 / 3;
		grid-row: 1 / 2;
		background: white;
		border-radius: 10px;
		padding: 0;
		border: 1px solid #d8d8d8;
		overflow: hidden;
		height: 100%;
	}

	.chart-container {
		grid-column: 1 / 2;
		grid-row: 2 / 3;
		background: white;
		border-radius: 10px;
		border: 1px solid #d8d8d8;
		overflow: hidden;
		height: 100%;
	}

	.latest-readings {
		grid-column: 2 / 3;
		grid-row: 2 / 3;
		background: white;
		border-radius: 10px;

		border: 1px solid #d8d8d8;
		overflow-y: auto;
		height: 100%;
	}

	.metadata-section h2,
	.latest-readings h2 {
		padding: 0.75rem 1rem;
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		border-bottom: 1px solid rgba(0, 0, 0, 0.1);
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
		right: 1rem;
		padding: 0.5rem;
	}

	.device-link {
		color: rgb(0, 20, 136);
		text-decoration: none;
		font-size: 0.875rem;
		display: flex;
		align-items: center;
	}

	.device-link:hover {
		text-decoration: underline;
		color: rgb(0, 100, 200);
	}

	.arrow-icon {
		margin-left: 0.5rem;
		transition: transform 0.2s;
	}

	.device-link:hover .arrow-icon {
		transform: translateX(4px);
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

	/* Responsive design adjustments */
	@media (max-width: 768px) {
		.dashboard {
			padding: 0.25rem;
			height: auto;
			overflow: visible;
			display: flex;
			flex-direction: column;
		}

		.top-row {
			order: 2; /* Move top-row after dashboard-grid */
			grid-template-columns: 1fr;
			height: auto;
			min-height: auto;
			gap: 0.5rem;
		}

		.dashboard-grid {
			order: 1; /* Move dashboard-grid before top-row */
			grid-template-columns: 1fr;
			grid-template-rows: auto auto auto auto;
			height: auto;
			overflow: visible;
			gap: 1rem;
		}

		.map-section {
			grid-column: 1 / -1;
			grid-row: 1;
			background: white;
			border-radius: 10px;
			padding: 0.5rem;
			margin: -1.1rem -1rem;
			width: calc(100% + 2rem);
			border: 0;
			overflow: hidden;
		}

		.metadata-section {
			grid-column: 1 / -1;
			grid-row: 2;
		}

		.chart-container {
			grid-column: 1 / -1;
			grid-row: 3;
		}

		.latest-readings {
			grid-column: 1 / -1;
			grid-row: 4;
		}

		/* Ensure consistent heights for components */
		.map-section,
		.chart-container,
		.metadata-section,
		.latest-readings {
			min-height: 300px;
		}
	}

	/* Smaller screen optimizations */
	@media (max-width: 768px) {
		.map-section,
		.chart-container,
		.metadata-section,
		.latest-readings {
			min-height: 400px;
		}
	}

	.status-right {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		transform: scale(0.8);
		transform-origin: right center;
	}

	.readings-container {
		display: flex;
		flex-direction: column;
		height: calc(100% - 2.5rem);
		position: relative;
		padding: 1rem;
	}

	.device-reading {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.weather-wrapper {
		flex: 1;
		display: flex;
		align-items: center;
		padding: 0.2rem 1rem;
		padding-left: 1rem;
		background: #ecf8e2;
		border-radius: 10px;
	}

	h3 {
		font-size: 1rem;
		font-weight: 600;
		margin: 0;
		white-space: nowrap;
	}

	.no-alerts {
		flex: 1;
		display: flex;
		justify-content: center;
		align-items: center;
		color: #666;
	}

	.liquid-level-container {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		justify-content: center;
		align-items: center;
		padding: 0.5rem;
		background: #fafafa;
		border-radius: 8px;
	}

	/* Add this new style to make the sensor reading take full width */
	.liquid-level-container :global(.sensor-reading) {
		width: 100%;
		max-width: none; /* Override any max-width constraints */
	}
</style>
