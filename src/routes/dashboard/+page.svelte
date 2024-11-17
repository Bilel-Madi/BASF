<!-- src/routes/dashboard/+page.svelte -->

<script lang="ts">
	import MapboxMap from '$lib/components/map/MapboxMap.svelte';
	import MultiChart from '$lib/components/chart/MultiChart.svelte';
	import { onMount } from 'svelte';
	import { writable, get } from 'svelte/store';
	import type { Zone, Device } from '@prisma/client';
	import { clickOutside } from '$lib/actions/clickOutside';

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

	async function handleTimeFrameChange(event: CustomEvent<string>) {
		selectedTimeFrame = event.detail;
		await fetchChartData();
	}

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
			<h3>Last Seen</h3>
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
				/>
			</div>
			<div class="chart-section">
				<h2>Data Analysis</h2>
				<div class="device-selector">
					<button class="dropdown-trigger" on:click={() => (isDropdownOpen = !isDropdownOpen)}>
						Select Devices ({$selectedDevices.length})
					</button>

					{#if isDropdownOpen}
						<div
							class="dropdown-menu"
							use:clickOutside
							on:outclick={() => (isDropdownOpen = false)}
						>
							<div class="search-container">
								<input type="text" placeholder="Search devices..." bind:value={searchQuery} />
							</div>

							<div class="device-list">
								{#each filteredDevices as device}
									<div
										class="device-item"
										class:selected={$selectedDevices.find((d) => d.eui === device.eui)}
										on:click={() => toggleDevice(device)}
									>
										<div class="device-image">
											<img
												src={deviceImagePath[device.type] || deviceImagePath.UNKNOWN}
												alt={device.type}
											/>
										</div>
										<div class="device-info">
											<span class="device-name">{device.name}</span>
											<span class="device-eui">{device.eui}</span>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>
				<MultiChart
					data={$chartData}
					devices={data.devices}
					bind:selectedDevices={$selectedDevices}
					bind:selectedReadings={$selectedReadings}
					bind:timeFrame={selectedTimeFrame}
					{timeFrames}
					on:timeFrameChange={handleTimeFrameChange}
				/>
			</div>
		</div>
		<div class="side-column">
			<div class="latest-readings">
				<h2>Latest Readings</h2>
			</div>
			<div class="metadata-section">
				<h2>Metadata</h2>
			</div>
		</div>
	</div>
</div>

<style>
	.dashboard {
		position: fixed;
		top: 4rem;
		left: 0;
		right: 0;
		bottom: 0;
		padding: 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		overflow: hidden;
		background-color: #f5f5f5;
		z-index: 1;
	}

	.top-row {
		flex: 0 0 auto;
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 0.5rem;
		height: 50px;
	}

	.info-card {
		background: white;
		border-radius: 8px;
		padding: 0.5rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		height: 50px; /* Reduced height */
	}

	.dashboard-grid {
		flex: 1;
		display: grid;
		grid-template-columns: 3fr 1fr;
		gap: 0.5rem;
		min-height: 0;
	}

	.main-column,
	.side-column {
		display: grid;
		grid-template-rows: 1fr 1fr;
		gap: 0.5rem;
		min-height: 0;
	}

	.map-section,
	.chart-section,
	.latest-readings,
	.metadata-section {
		background: white;
		border-radius: 8px;
		padding: 1rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		overflow: hidden;
		display: flex;
		flex-direction: column;
		min-height: 0;
	}

	h1 {
		margin: 0;
		font-size: 1.5rem;
	}

	h2 {
		margin: 0 0 0.5rem 0;
		font-size: 1.2rem;
	}

	h3 {
		margin: 0;
		font-size: 1rem;
	}

	.last-seen {
		grid-column: span 1; /* Takes 1/6 of the space */
	}

	.alerts {
		grid-column: span 2; /* Takes 2/6 of the space */
	}

	.weather {
		grid-column: span 3; /* Takes 3/6 of the space */
	}

	@media (max-width: 1024px) {
		.dashboard-grid {
			grid-template-columns: 1fr;
		}

		.top-row {
			grid-template-columns: 1fr;
		}

		.last-seen,
		.alerts,
		.weather {
			grid-column: 1;
		}
	}

	.device-selector {
		position: relative;
		margin-bottom: 1rem;
	}

	.dropdown-trigger {
		padding: 0.5rem 1rem;
		background: white;
		border: 1px solid #ddd;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.875rem;
	}

	.dropdown-menu {
		position: absolute;
		top: 100%;
		left: 0;
		width: 300px;
		background: white;
		border: 1px solid #ddd;
		border-radius: 4px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		z-index: 1000;
	}

	.search-container {
		padding: 0.5rem;
		border-bottom: 1px solid #ddd;
	}

	.search-container input {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 0.875rem;
	}

	.device-list {
		max-height: 300px;
		overflow-y: auto;
	}

	.device-item {
		display: grid;
		grid-template-columns: 60px 1fr;
		gap: 0.5rem;
		padding: 0.5rem;
		cursor: pointer;
		border-bottom: 1px solid #f5f5f5;
	}

	.device-item:hover {
		background: #f5f5f5;
	}

	.device-item.selected {
		background: #e3f2fd;
	}

	.device-image {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.device-image img {
		width: 40px;
		height: 40px;
		object-fit: contain;
	}

	.device-info {
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	.device-name {
		font-weight: 500;
		font-size: 0.875rem;
	}

	.device-eui {
		font-size: 0.75rem;
		color: #666;
	}
</style>
