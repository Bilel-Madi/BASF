<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import Breadcrumbs from '$lib/ui/breadcrumbs.svelte';

	// Define TypeScript interfaces for better type safety
	interface DeviceLocation {
		coordinates: [string, string];
	}

	interface Device {
		device_id: string;
		model_name: string;
		assigned_number: number;
		name?: string;
		installed_date?: string;
		installed_depth?: number;
		field?: string;
		location?: DeviceLocation;
		picture_url?: string;
		battery_status?: number;
		last_seen?: string;
		latest_rssi?: number;
		latest_snr?: number;
	}

	interface SensorReading {
		temperature?: number;
		moisture?: number;
		ec?: number;
		humidity?: number;
		pressure?: number;
		co2?: number;
	}

	let device_id = '';
	let device: Device | null = null;
	let latestReading: SensorReading | null = null;

	// Get the device ID from the URL
	$: device_id = $page.params.device_id;

	// Fetch device details and latest readings
	onMount(async () => {
		if (device_id) {
			try {
				// Fetch device metadata
				const resDevice = await fetch(`/api/devices/${device_id}`);
				if (resDevice.ok) {
					device = await resDevice.json();
				} else {
					const error = await resDevice.json();
					alert('Error fetching device: ' + error.message);
				}

				// Fetch latest sensor reading
				const resReading = await fetch(`/api/devices/${device_id}/latest-reading`);
				if (resReading.ok) {
					latestReading = await resReading.json();
				} else {
					latestReading = null;
				}
			} catch (err) {
				console.error('Fetch error:', err);
				alert('An unexpected error occurred while fetching device details.');
			}
		}
	});

	// Define breadcrumbs for this page
	const crumbs = [
		{ name: 'Home', href: '/' },
		{ name: 'Devices', href: '/devices' },
		{
			name: device ? device.name || device.device_id : 'Device Detail',
			href: `/devices/${device_id}`
		}
	];
</script>

<main>
	<Breadcrumbs {crumbs} />
	{#if device}
		<header class="device-header">
			<h1>Device Details: {device.name || device.device_id}</h1>
			<a class="edit-button" href="/devices/{device_id}/edit">Edit Device</a>
		</header>

		<section class="device-info">
			{#if device.picture_url}
				<div class="device-image">
					<img src={device.picture_url} alt="Device Picture" />
				</div>
			{/if}

			<div class="device-metadata">
				<p><strong>Model Name:</strong> {device.model_name}</p>
				<p><strong>Assigned Number:</strong> {device.assigned_number}</p>
				<p>
					<strong>Installed Date:</strong>
					{device.installed_date ? new Date(device.installed_date).toLocaleDateString() : 'N/A'}
				</p>
				<p><strong>Installed Depth:</strong> {device.installed_depth || 'N/A'} cm</p>
				<p><strong>Field/Zone:</strong> {device.field || 'N/A'}</p>
				<p>
					<strong>Location:</strong>
					{device.location && device.location.coordinates.length === 2
						? `(${parseFloat(device.location.coordinates[1]).toFixed(4)}, ${parseFloat(
								device.location.coordinates[0]
						  ).toFixed(4)})`
						: 'N/A'}
				</p>
				<p>
					<strong>Battery Status:</strong>
					{device.battery_status !== undefined ? `${device.battery_status}%` : 'N/A'}
				</p>
				<p>
					<strong>Last Seen:</strong>
					{device.last_seen ? new Date(device.last_seen).toLocaleString() : 'N/A'}
				</p>
				<p>
					<strong>Latest RSSI:</strong>
					{device.latest_rssi !== undefined ? `${device.latest_rssi} dBm` : 'N/A'}
				</p>
				<p>
					<strong>Latest SNR:</strong>
					{device.latest_snr !== undefined ? `${device.latest_snr} dB` : 'N/A'}
				</p>
			</div>
		</section>

		{#if latestReading}
			<section class="sensor-reading">
				<h2>Latest Sensor Reading</h2>
				{#if device.model_name === 'Milesight EM500-SMTC Soil Moisture Sensor'}
					<p><strong>Temperature:</strong> {latestReading.temperature} °C</p>
					<p><strong>Moisture:</strong> {latestReading.moisture} %</p>
					<p><strong>EC:</strong> {latestReading.ec} μS/cm</p>
				{:else if device.model_name === 'Milesight EM500-CO2 Outdoor Environment Monitoring Sensor'}
					<p><strong>Temperature:</strong> {latestReading.temperature} °C</p>
					<p><strong>Humidity:</strong> {latestReading.humidity} %</p>
					<p><strong>Pressure:</strong> {latestReading.pressure} hPa</p>
					<p><strong>CO₂:</strong> {latestReading.co2} ppm</p>
				{/if}
			</section>
		{/if}
	{:else}
		<p class="loading">Loading device details...</p>
	{/if}
</main>

<style>
	/* Reset some default styles for consistency across browsers */
	* {
		box-sizing: border-box;
		margin: 0;
		padding: 0;
	}

	/* Base styles for the main container */
	main {
		max-width: 900px;
		margin: 50px auto;
		padding: 0 20px;
		font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
		color: #333;
	}

	/* Header styling */
	.header,
	.device-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 30px;
	}

	h1 {
		font-size: 2rem;
		font-weight: 600;
		color: #2c3e50;
	}

	/* Edit button styling */
	.edit-button {
		background-color: #e67e22;
		color: #fff;
		padding: 10px 18px;
		text-decoration: none;
		border-radius: 5px;
		font-size: 0.95rem;
		transition: background-color 0.3s ease;
	}

	.edit-button:hover {
		background-color: #d35400;
	}

	/* Device info section */
	.device-info {
		display: flex;
		flex-wrap: wrap;
		gap: 20px;
		margin-bottom: 30px;
	}

	.device-image img {
		max-width: 200px;
		border-radius: 8px;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}

	.device-metadata {
		flex: 1;
	}

	.device-metadata p {
		margin-bottom: 10px;
		font-size: 1rem;
		line-height: 1.5;
	}

	.device-metadata strong {
		color: #34495e;
	}

	/* Sensor reading section */
	.sensor-reading {
		margin-top: 20px;
		padding: 20px;
		background-color: #f9f9f9;
		border-left: 4px solid #3498db;
		border-radius: 5px;
	}

	.sensor-reading h2 {
		font-size: 1.5rem;
		color: #2c3e50;
		margin-bottom: 15px;
	}

	.sensor-reading p {
		margin-bottom: 8px;
		font-size: 1rem;
		line-height: 1.5;
	}

	.sensor-reading strong {
		color: #34495e;
	}

	/* Loading state */
	.loading {
		text-align: center;
		font-size: 1.2rem;
		color: #7f8c8d;
		margin-top: 50px;
	}

	/* Responsive design */
	@media (max-width: 768px) {
		.device-info {
			flex-direction: column;
			align-items: center;
		}

		.device-metadata {
			width: 100%;
		}

		.device-image img {
			max-width: 100%;
		}
	}
</style>
