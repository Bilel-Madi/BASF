<!-- src/routes/devices/[eui]/+page.svelte -->

<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { error } from '@sveltejs/kit';
	import MapboxMap from '$lib/components//map/MapboxMap.svelte';
	import MultiLineChart from '$lib/components/chart/MultiLineChart.svelte';
	import Breadcrumbs from '$lib/components/ui/Breadcrumbs.svelte';
	import BatteryIcon from '$lib/components/icons/BatteryIcon.svelte';
	import SignalIcon from '$lib/components/icons/SignalIcon.svelte';
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

	onMount(() => {
		fetchData(currentRange);
	});
</script>

<div class="page-container">
	<Breadcrumbs items={breadcrumbItems} />
	<div class="header">
		<h1 class="title">{data.device.name}</h1>
	</div>

	<div class="content-grid">
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

		{#if deviceLocation?.latitude && deviceLocation?.longitude}
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

		{#if data.device.type === 'CO2_SENSOR' || data.device.type === 'SOIL_MOISTURE'}
			<div class="card readings-card">
				<h2>Latest Readings</h2>
				<div class="readings-grid">
					{#if data.device.type === 'CO2_SENSOR'}
						<div class="reading-item">
							<span class="label">CO₂</span>
							<span class="value">{data.device.latest_co2}<span class="unit">ppm</span></span>
						</div>
						<div class="reading-item">
							<span class="label">Humidity</span>
							<span class="value">{data.device.latest_humidity}<span class="unit">%</span></span>
						</div>
						<div class="reading-item">
							<span class="label">Pressure</span>
							<span class="value">{data.device.latest_pressure}<span class="unit">hPa</span></span>
						</div>
						<div class="reading-item">
							<span class="label">Temperature</span>
							<span class="value">{data.device.latest_temperature}<span class="unit">°C</span></span
							>
						</div>
					{:else}
						<div class="reading-item">
							<span class="label">EC</span>
							<span class="value">{data.device.latest_ec}<span class="unit">µS/cm</span></span>
						</div>
						<div class="reading-item">
							<span class="label">Moisture</span>
							<span class="value">{data.device.latest_moisture}<span class="unit">%</span></span>
						</div>
						<div class="reading-item">
							<span class="label">Temperature</span>
							<span class="value"
								>{data.device.latest_soil_temperature}<span class="unit">°C</span></span
							>
						</div>
					{/if}
				</div>
			</div>
		{/if}

		<!-- Add the chart component -->
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
	</div>
</div>

<style>
	.page-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	.header {
		margin-bottom: 2rem;
	}

	.title {
		font-size: 2rem;
		font-weight: 600;
		color: var(--color-text-primary);
		margin: 1rem 0;
	}

	.content-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
	}

	.card {
		background: white;
		border-radius: 12px;
		box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
		padding: 1.5rem;
		height: fit-content;
	}

	.card h2 {
		font-size: 1.25rem;
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
		gap: 1.25rem;
	}

	.info-item,
	.reading-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
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
		grid-column: 1 / -1;
	}

	:global(.mapboxgl-map) {
		border-radius: 8px;
		height: 400px;
	}

	.chart-card {
		grid-column: 1 / -1;
	}

	@media (max-width: 768px) {
		.page-container {
			padding: 1rem;
		}

		.content-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
