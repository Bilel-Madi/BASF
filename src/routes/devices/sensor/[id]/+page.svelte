<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { latestDataStore, type LatestDataEntry } from '$lib/stores/latestDataStore';
	import { DEVICES, deviceHardcodedNames, deviceCoordinates } from '$lib/devices';
	import { get } from 'svelte/store';

	let sensorData: LatestDataEntry | null = null;
	let depth = 0;
	let installationDate = 'Unknown';
	let uplinkInterval = 'Unknown';
	let latestData: LatestDataEntry[] = [];

	// Retrieve the latest data from the store
	onMount(() => {
		latestData = get(latestDataStore);
	});

	// Watch for changes to the page store to get the device ID
	$: {
		const { params } = $page;
		const deviceId = params.id;
		sensorData = latestData.find((d) => d.device_id === deviceId) || null;

		if (sensorData) {
			depth = deviceCoordinates[deviceId]?.[2] || 0; // Example: Depth info
			installationDate = '2023-01-01'; // Example: Hardcoded installation date
			uplinkInterval = '15 minutes'; // Example: Hardcoded uplink interval
		}
	}
</script>

<nav class="breadcrumbs">
	<a href="/">Dashboard</a> &gt; <a href="/devices">Devices</a> &gt;
	<span>Sensor Details</span>
</nav>

{#if sensorData}
	<h2>{deviceHardcodedNames[sensorData.device_id]}</h2>
	<p><strong>EUI:</strong> {sensorData.device_id}</p>
	<p><strong>Depth:</strong> {depth} cm</p>
	<p><strong>Installation Date:</strong> {installationDate}</p>
	<p><strong>Uplink Interval:</strong> {uplinkInterval}</p>
	<p><strong>Moisture:</strong> {sensorData.moisture}%</p>
	<p><strong>EC:</strong> {sensorData.ec}</p>
	<p><strong>Temperature:</strong> {sensorData.temperature}°C</p>
	<p><strong>Last Seen:</strong> {new Date(sensorData.received_at).toLocaleString()}</p>
	<!-- Add more details and historical data visualization as needed -->
{:else}
	<p>Loading sensor data...</p>
{/if}

<style>
	.breadcrumbs {
		margin-bottom: 1em;
		font-size: 1rem;
		color: #333;
	}

	.breadcrumbs a {
		color: #007bff;
		text-decoration: none;
	}

	.breadcrumbs a:hover {
		text-decoration: underline;
	}

	h2 {
		margin-top: 1rem;
	}

	p {
		margin: 0.5rem 0;
	}

	strong {
		font-weight: bold;
	}
</style>
