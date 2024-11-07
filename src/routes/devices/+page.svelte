<!-- src/routes/devices/+page.svelte -->

<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import MapboxMap from '$lib/components/MapboxMap.svelte';
	import { page } from '$app/stores';
	import type { PageData } from './$types';

	let eui = '';
	let name = '';
	let type = '';
	let modelName = '';
	let installationDate = '';
	let installedDepth: number | null = null;
	let reportingInterval = '';
	let zoneId = '';
	let location: GeoJSON.Geometry | null = null;
	let error: string = '';

	// Removed mapComponent and onMount since showMap() does not exist

	const handleLocationUpdate = (event) => {
		location = event.detail.geometry;
	};

	const handleSubmit = async (event) => {
		event.preventDefault();

		if (!location) {
			error = 'Please select a location on the map.';
			return;
		}

		const response = await fetch('/devices', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				eui,
				name,
				type,
				modelName,
				installationDate,
				installedDepth,
				reportingInterval: parseInt(reportingInterval, 10),
				location,
				zoneId
			})
		});

		if (response.ok) {
			window.location.href = '/devices';
		} else {
			const errText = await response.text();
			error = errText;
		}
	};
</script>

<div class="container">
	<h1 class="title">Add Device</h1>

	<form on:submit={handleSubmit} class="form">
		<div class="form-group">
			<label for="eui">Device EUI:</label>
			<input type="text" id="eui" bind:value={eui} required />
		</div>

		<div class="form-group">
			<label for="name">Device Name:</label>
			<input type="text" id="name" bind:value={name} required />
		</div>

		<div class="form-group">
			<label for="type">Device Type:</label>
			<select id="type" bind:value={type} required>
				<option value="">Select Device Type</option>
				<option value="SOIL_MOISTURE">Soil Moisture Sensor</option>
				<option value="CO2_SENSOR">CO2 Sensor</option>
				<!-- Add other device types as needed -->
			</select>
		</div>

		<div class="form-group">
			<label for="modelName">Model Name:</label>
			<input type="text" id="modelName" bind:value={modelName} required />
		</div>

		<div class="form-group">
			<label for="installationDate">Installation Date:</label>
			<input type="date" id="installationDate" bind:value={installationDate} required />
		</div>

		{#if type === 'SOIL_MOISTURE'}
			<div class="form-group">
				<label for="installedDepth">Installed Depth (cm):</label>
				<input type="number" id="installedDepth" bind:value={installedDepth} min="0" step="0.1" />
			</div>
		{/if}

		<div class="form-group">
			<label for="reportingInterval">Reporting Interval (minutes):</label>
			<input type="number" id="reportingInterval" bind:value={reportingInterval} min="1" required />
		</div>

		<div class="map-container">
			<label>Select Location on Map:</label>
			<MapboxMap on:geometryChange={handleLocationUpdate} />
		</div>

		<div class="form-group">
			<label for="zoneId">Assign to Zone:</label>
			<select id="zoneId" bind:value={zoneId} required>
				<option value="">Select Zone</option>
				{#if $page.data.zones}
					{#each $page.data.zones as zone}
						<option value={zone.id}>{zone.name}</option>
					{/each}
				{/if}
			</select>
		</div>

		<button type="submit" class="submit-button">Add Device</button>

		{#if error}
			<p class="error-message">{error}</p>
		{/if}
	</form>

	<div class="devices-list">
		<h2 class="subtitle">Your Devices</h2>
		<ul>
			{#if $page.data.devices}
				{#each $page.data.devices as device}
					<li>
						<a href={`/devices/${device.id}`}>{device.name}</a>
					</li>
				{/each}
			{/if}
		</ul>
	</div>
</div>

<style>
	/* Your existing styles */
</style>
