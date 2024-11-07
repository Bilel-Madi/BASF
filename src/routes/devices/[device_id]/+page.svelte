<!-- src/routes/devices/[device_id]/+page.svelte -->

<script lang="ts">
	import { onMount } from 'svelte';
	import MapboxMap from '$lib/components/MapboxMap.svelte';
	import { page } from '$app/stores';

	export let data: { device: Device };
	let eui = data.device.eui;
	let name = data.device.name;
	let type = data.device.type;
	let modelName = data.device.modelName;
	let installationDate = data.device.installationDate.toISOString().split('T')[0];
	let installedDepth = data.device.installedDepth;
	let reportingInterval = data.device.reportingInterval.toString();
	let zoneId = data.device.zoneId;
	let location = data.device.location;
	let error: string = '';

	const handleLocationChange = (event) => {
		location = event.detail.geometry;
	};

	const handleSubmit = async (event) => {
		event.preventDefault();

		const response = await fetch(`/devices/${data.device.id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
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
			window.location.href = `/devices/${data.device.id}`;
		} else {
			const errText = await response.text();
			error = errText;
		}
	};
</script>

<h1>Edit Device</h1>

<form on:submit={handleSubmit}>
	<div>
		<label for="eui">Device EUI:</label>
		<input type="text" id="eui" bind:value={eui} disabled />
	</div>

	<div>
		<label for="name">Device Name:</label>
		<input type="text" id="name" bind:value={name} required />
	</div>

	<div>
		<label for="type">Device Type:</label>
		<select id="type" bind:value={type} required>
			<option value="">Select Device Type</option>
			<option value="SOIL_MOISTURE">Soil Moisture Sensor</option>
			<option value="CO2_SENSOR">CO2 Sensor</option>
			<!-- Add other device types as needed -->
		</select>
	</div>

	<div>
		<label for="modelName">Model Name:</label>
		<input type="text" id="modelName" bind:value={modelName} required />
	</div>

	<div>
		<label for="installationDate">Installation Date:</label>
		<input type="date" id="installationDate" bind:value={installationDate} required />
	</div>

	{#if type === 'SOIL_MOISTURE'}
		<div>
			<label for="installedDepth">Installed Depth (cm):</label>
			<input type="number" id="installedDepth" bind:value={installedDepth} min="0" step="0.1" />
		</div>
	{/if}

	<div>
		<label for="reportingInterval">Reporting Interval (minutes):</label>
		<input type="number" id="reportingInterval" bind:value={reportingInterval} min="1" required />
	</div>

	<div>
		<label>Select Location on Map:</label>
		<MapboxMap bind:location on:locationUpdate={handleLocationChange} initialGeometry={location} />
	</div>

	<div>
		<label for="zoneId">Assign to Zone:</label>
		<select id="zoneId" bind:value={zoneId} required>
			<option value="">Select Zone</option>
			{#if $page.data.zones && $page.data.zones.length > 0}
				{#each $page.data.zones as zone}
					<option value={zone.id}>{zone.name}</option>
				{/each}
			{:else}
				<p>No zones available</p>
			{/if}
		</select>
	</div>

	<button type="submit">Update Device</button>

	{#if error}
		<p style="color: red;">{error}</p>
	{/if}
</form>
