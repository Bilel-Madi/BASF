<!-- src/routes/devices/[eui]/+page.svelte -->

<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { error } from '@sveltejs/kit';
	import MapboxMap from '$lib/components/map/MapboxMap.svelte';
	import MultiLineChart from '$lib/components/chart/MultiLineChart.svelte';
	import Breadcrumbs from '$lib/components/ui/Breadcrumbs.svelte';
	import BatteryIcon from '$lib/components/icons/BatteryIcon.svelte';
	import SignalIcon from '$lib/components/icons/SignalIcon.svelte';
	import Tabs from '$lib/components/ui/Tabs.svelte';
	import ThresholdBar from '$lib/components/ui/ThresholdBar.svelte'; // Import ThresholdBar
	import type { PageLoad } from './$types';

	export let data;

	const breadcrumbItems = [
		{ label: 'Home', href: '/' },
		{ label: 'Devices', href: '/devices' },
		{ label: data.device.name }
	];

	const MAPBOX_ACCESS_TOKEN =
		'pk.eyJ1IjoiYmlsZWxtYWRpIiwiYSI6ImNsbmJnM2ZrNTA1cXQybG56N2c0cjJ2bTcifQ.j-O_Igwc-2p3Na-mkusaDg';

	const deviceLocation = data.device.location; // { latitude, longitude }

	// Chart-related variables
	let datasets = [];
	let labels = [];
	let options = {};
	let chartTitle = 'Sensor Readings';
	let xAxisLabel = 'Time';
	let yAxisLabel = 'Values';

	// Date range
	let currentRange = '1d';
	let dateRange = { start: null, end: null };

	let activeTab = 'readings';
	const tabs = [
		{ id: 'readings', label: 'Latest Readings' },
		{ id: 'metadata', label: 'Metadata' },
		{ id: 'location', label: 'Location' },
		{ id: 'historical', label: 'Historical Data' }
	];

	// Define Thresholds
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

	// Fetch data for the chart
	async function fetchData(range) {
		let queryParams = '';

		if (range !== 'custom') {
			queryParams = `?range=${range}`;
		} else if (dateRange.start && dateRange.end) {
			queryParams = `?start=${dateRange.start.toISOString()}&end=${dateRange.end.toISOString()}`;
		}

		const res = await fetch(`/api/devices/${data.device.eui}/data${queryParams}`);
		if (res.ok) {
			const rawData = await res.json();
			console.log('Fetched sensor data:', rawData);
			processChartData(rawData);
		} else {
			console.error('Error fetching data');
		}
	}

	function processChartData(rawData) {
		// Process raw data to extract datasets and labels
		datasets = [];

		if (data.device.type === 'CO2_SENSOR') {
			datasets = [
				{
					label: 'CO₂ (ppm)',
					data: rawData.map((d) => ({ x: d.receivedAt, y: d.co2 })),
					color: '#FF0000'
				},
				{
					label: 'Humidity (%)',
					data: rawData.map((d) => ({ x: d.receivedAt, y: d.humidity })),
					color: '#0000FF'
				},
				{
					label: 'Temperature (°C)',
					data: rawData.map((d) => ({ x: d.receivedAt, y: d.temperature })),
					color: '#00FF00'
				},
				{
					label: 'Pressure (hPa)',
					data: rawData.map((d) => ({ x: d.receivedAt, y: d.pressure })),
					color: '#FFA500'
				}
			];
		} else if (data.device.type === 'SOIL_MOISTURE') {
			datasets = [
				{
					label: 'Moisture (%)',
					data: rawData.map((d) => ({ x: d.receivedAt, y: d.moisture })),
					color: '#1f52ed'
				},
				{
					label: 'Temperature (°C)',
					data: rawData.map((d) => ({ x: d.receivedAt, y: d.temperature })),
					color: '#ed1f5c'
				},
				{
					label: 'EC (µS/cm)',
					data: rawData.map((d) => ({ x: d.receivedAt, y: d.ec })),
					color: '#edb61f'
				}
			];
		}

		// Update the chart options if needed
		options = {
			scales: {
				y: {
					beginAtZero: true
				}
			}
		};
	}

	// Handle range change
	function handleRangeChange(event) {
		currentRange = event.detail.range;
		fetchData(currentRange);
	}

	// Handle custom date range change
	function handleDateRangeChange(event) {
		dateRange = event.detail.dateRange;
		fetchData('custom');
	}

	function getTimeAgo(timestamp: string) {
		const minutes = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);

		if (minutes < 1) return 'just now';
		if (minutes === 1) return '1 minute ago';
		if (minutes < 60) return `${minutes} minutes ago`;

		const hours = Math.floor(minutes / 60);
		if (hours === 1) return '1 hour ago';
		if (hours < 24) return `${hours} hours ago`;

		const days = Math.floor(hours / 24);
		if (days === 1) return '1 day ago';
		return `${days} days ago`;
	}

	onMount(() => {
		fetchData(currentRange);
	});
</script>

<div class="page-container">
	<Breadcrumbs items={breadcrumbItems} />
	<div class="header">
		<h1 class="title">{data.device.name}</h1>
		<div class="device-meta">
			<div class="meta-item">
				<span class="meta-label">EUI:</span>
				<code class="meta-value">{data.device.eui}</code>
			</div>
			<div class="meta-item">
				<span class="meta-label">Last Seen:</span>
				<code class="meta-value">{getTimeAgo(data.device.last_seen)}</code>
			</div>
		</div>
	</div>

	<Tabs {tabs} bind:activeTab />

	<div class="tab-content">
		{#if activeTab === 'metadata'}
			<div class="card device-info">
				<div class="card-header">
					<h2>Device Information</h2>
					<div class="status-indicators">
						<BatteryIcon level={data.device.battery_status} />
						<SignalIcon strength={data.device.snr} label="SNR" />
						<SignalIcon strength={data.device.rssi} label="RSSI" />
					</div>
				</div>
				<div class="card-content">
					<div class="info-grid">
						<div class="info-item">
							<span class="label">EUI</span>
							<span class="value">{data.device.eui}</span>
						</div>
						<div class="info-item">
							<span class="label">Type</span>
							<span class="value">{data.device.type}</span>
						</div>
						<div class="info-item">
							<span class="label">Zone</span>
							<span class="value">{data.device.zone.name}</span>
						</div>
						<div class="info-item">
							<span class="label">Last Seen</span>
							<span class="value">{new Date(data.device.last_seen).toLocaleString()}</span>
						</div>
					</div>
				</div>
			</div>
		{/if}

		{#if activeTab === 'readings'}
			<div class="card readings-card">
				<h2>Latest Readings</h2>
				<div class="readings-grid">
					{#if data.device.type === 'CO2_SENSOR'}
						<div class="reading-item">
							<div class="reading-header">
								<div class="reading-title">
									<span class="label">CO₂:</span>
									<span class="current-value">{data.device.latest_co2} ppm</span>
								</div>
								<div
									class="status-tag"
									style="background-color: {co2Thresholds.find(
										(t) => data.device.latest_co2 >= t.start && data.device.latest_co2 <= t.end
									)?.color || '#f0f0f0'}"
								>
									{co2Thresholds.find(
										(t) => data.device.latest_co2 >= t.start && data.device.latest_co2 <= t.end
									)?.label || ''}
								</div>
							</div>
							<ThresholdBar
								value={data.device.latest_co2}
								min={0}
								max={2000}
								thresholds={co2Thresholds}
							/>
						</div>

						<div class="reading-item">
							<div class="reading-header">
								<div class="reading-title">
									<span class="label">Humidity:</span>
									<span class="current-value">{data.device.latest_humidity} %</span>
								</div>
								<div
									class="status-tag"
									style="background-color: {humidityThresholds.find(
										(t) =>
											data.device.latest_humidity >= t.start && data.device.latest_humidity <= t.end
									)?.color || '#f0f0f0'}"
								>
									{humidityThresholds.find(
										(t) =>
											data.device.latest_humidity >= t.start && data.device.latest_humidity <= t.end
									)?.label || ''}
								</div>
							</div>
							<ThresholdBar
								value={data.device.latest_humidity}
								min={0}
								max={100}
								thresholds={humidityThresholds}
							/>
						</div>

						<div class="reading-item">
							<div class="reading-header">
								<div class="reading-title">
									<span class="label">Pressure:</span>
									<span class="current-value">{data.device.latest_pressure} hPa</span>
								</div>
								<div
									class="status-tag"
									style="background-color: {pressureThresholds.find(
										(t) =>
											data.device.latest_pressure >= t.start && data.device.latest_pressure <= t.end
									)?.color || '#f0f0f0'}"
								>
									{pressureThresholds.find(
										(t) =>
											data.device.latest_pressure >= t.start && data.device.latest_pressure <= t.end
									)?.label || ''}
								</div>
							</div>
							<ThresholdBar
								value={data.device.latest_pressure}
								min={900}
								max={1100}
								thresholds={pressureThresholds}
							/>
						</div>

						<div class="reading-item">
							<div class="reading-header">
								<div class="reading-title">
									<span class="label">Temperature:</span>
									<span class="current-value">{data.device.latest_temperature} °C</span>
								</div>
								<div
									class="status-tag"
									style="background-color: {temperatureThresholds.find(
										(t) =>
											data.device.latest_temperature >= t.start &&
											data.device.latest_temperature <= t.end
									)?.color || '#f0f0f0'}"
								>
									{temperatureThresholds.find(
										(t) =>
											data.device.latest_temperature >= t.start &&
											data.device.latest_temperature <= t.end
									)?.label || ''}
								</div>
							</div>
							<ThresholdBar
								value={data.device.latest_temperature}
								min={-10}
								max={50}
								thresholds={temperatureThresholds}
							/>
						</div>
					{:else if data.device.type === 'SOIL_MOISTURE'}
						<div class="reading-item">
							<div class="reading-header">
								<div class="reading-title">
									<span class="label">EC:</span>
									<span class="current-value">{data.device.latest_ec} µS/cm</span>
								</div>
								<div
									class="status-tag"
									style="background-color: {ecThresholds.find(
										(t) => data.device.latest_ec >= t.start && data.device.latest_ec <= t.end
									)?.color || '#f0f0f0'}"
								>
									{ecThresholds.find(
										(t) => data.device.latest_ec >= t.start && data.device.latest_ec <= t.end
									)?.label || ''}
								</div>
							</div>
							<ThresholdBar
								value={data.device.latest_ec}
								min={0}
								max={2000}
								thresholds={ecThresholds}
							/>
						</div>

						<div class="reading-item">
							<div class="reading-header">
								<div class="reading-title">
									<span class="label">Moisture:</span>
									<span class="current-value">{data.device.latest_moisture} %</span>
								</div>
								<div
									class="status-tag"
									style="background-color: {moistureThresholds.find(
										(t) =>
											data.device.latest_moisture >= t.start && data.device.latest_moisture <= t.end
									)?.color || '#f0f0f0'}"
								>
									{moistureThresholds.find(
										(t) =>
											data.device.latest_moisture >= t.start && data.device.latest_moisture <= t.end
									)?.label || ''}
								</div>
							</div>
							<ThresholdBar
								value={data.device.latest_moisture}
								min={0}
								max={100}
								thresholds={moistureThresholds}
							/>
						</div>

						<div class="reading-item">
							<div class="reading-header">
								<div class="reading-title">
									<span class="label">Temperature:</span>
									<span class="current-value">{data.device.latest_soil_temperature} °C</span>
								</div>
								<div
									class="status-tag"
									style="background-color: {temperatureThresholds.find(
										(t) =>
											data.device.latest_soil_temperature >= t.start &&
											data.device.latest_soil_temperature <= t.end
									)?.color || '#f0f0f0'}"
								>
									{temperatureThresholds.find(
										(t) =>
											data.device.latest_soil_temperature >= t.start &&
											data.device.latest_soil_temperature <= t.end
									)?.label || ''}
								</div>
							</div>
							<ThresholdBar
								value={data.device.latest_soil_temperature}
								min={-10}
								max={50}
								thresholds={temperatureThresholds}
							/>
						</div>
					{/if}
				</div>
			</div>
		{/if}

		{#if activeTab === 'location' && deviceLocation?.latitude && deviceLocation?.longitude}
			<div class="card map-card">
				<h2>Location</h2>
				<MapboxMap
					accessToken={MAPBOX_ACCESS_TOKEN}
					center={[deviceLocation.longitude, deviceLocation.latitude]}
					zoom={12}
					markerPosition={[deviceLocation.longitude, deviceLocation.latitude]}
					allowMarkerPlacement={false}
					showControls={true}
				/>
			</div>
		{/if}

		{#if activeTab === 'historical'}
			<div class="card chart-card">
				<h2>Sensor Readings</h2>
				<MultiLineChart
					{datasets}
					{options}
					title={chartTitle}
					{xAxisLabel}
					{yAxisLabel}
					initialRange={currentRange}
					on:rangeChange={handleRangeChange}
					on:dateRangeChange={handleDateRangeChange}
				/>
			</div>
		{/if}
	</div>
</div>

<style>
	.page-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 1rem;
	}

	.header {
		margin-bottom: 2rem;
	}

	.title {
		font-size: 2rem;
		font-weight: 700;
		margin: 0;
	}

	.content-grid {
		display: block;
	}

	.card {
		border-radius: 12px;

		padding: 0.5rem;
		height: fit-content;
	}

	.card h2 {
		font-size: 1.5rem;
		font-weight: 600;
		margin-bottom: 1.5rem;
		color: var(--color-text-primary);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.status-indicators {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.info-grid,
	.readings-grid {
		display: grid;
		gap: 1.5rem;
	}

	.info-item,
	.reading-item {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.label {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		font-weight: 500;
	}

	.value {
		font-size: 1.125rem;
		color: var(--color-text-primary);
		font-weight: 500;
	}

	.unit {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		margin-left: 0.25rem;
	}

	.map-card {
		grid-column: auto;
	}

	:global(.mapboxgl-map) {
		border-radius: 8px;
		height: 400px;
	}

	.chart-card {
		grid-column: auto;
	}

	@media (max-width: 768px) {
		.page-container {
			padding: 1rem;
		}

		.content-grid {
			grid-template-columns: 1fr;
		}
	}

	.device-meta {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 2rem;
		margin: 1rem 0 2rem;
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.meta-label {
		color: var(--color-text-secondary);
		font-weight: 500;
		white-space: nowrap;
	}

	.meta-value {
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
		font-size: 0.875rem;
		padding: 0.25rem 0.5rem;
		background: var(--color-background-secondary);
		border-radius: 4px;
		flex: 1;
	}

	/* Mobile styles */
	@media (max-width: 640px) {
		.device-meta {
			grid-template-columns: 1fr;
			gap: 1rem;
		}

		.meta-item {
			justify-content: space-between;
		}

		.meta-value {
			flex: none;
			max-width: 60%;
			overflow-x: auto;
		}
	}

	.tab-content {
		margin-top: 2rem;
	}

	.readings-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.reading-item {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.reading-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
		padding-right: 0; /* Ensures alignment with bar end */
	}

	.reading-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.label {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		font-weight: 500;
	}

	.current-value {
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.status-tag {
		padding: 4px 8px;
		border-radius: 10px;
		color: white;
		font-size: 10px;
		font-weight: 500;
		opacity: 0.6;
		margin-left: auto; /* Pushes tag to the right */
	}

	@media (max-width: 640px) {
		.readings-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
