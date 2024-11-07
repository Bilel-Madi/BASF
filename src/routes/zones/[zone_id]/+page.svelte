<!-- src/routes/zones/[zone_id]/+page.svelte -->

<script lang="ts">
	import { onMount } from 'svelte';
	import MapboxMap from '$lib/components/MapboxMap.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	export let data: { zone: Zone };
	let name = data.zone.name;
	let cropType = data.zone.cropType;
	let plantingDate = data.zone.plantingDate.toISOString().split('T')[0];
	let harvestDate = data.zone.harvestDate.toISOString().split('T')[0];
	let notes = data.zone.notes || '';
	let soilType = data.zone.soilType;
	let geometry = data.zone.geometry;
	let area = data.zone.area;
	let error: string = '';

	const handleGeometryChange = (event) => {
		geometry = event.detail.geometry;
		area = event.detail.area;
	};

	const handleSubmit = async (event) => {
		event.preventDefault();

		if (!geometry) {
			error = 'Please draw a zone on the map.';
			return;
		}

		const response = await fetch(`/zones/${data.zone.id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				name,
				cropType,
				plantingDate,
				harvestDate,
				notes,
				soilType,
				geometry,
				area
			})
		});

		if (response.ok) {
			window.location.href = `/zones/${data.zone.id}`;
		} else {
			const errText = await response.text();
			error = errText;
		}
	};
</script>

<h1>Edit Zone</h1>

<form on:submit={handleSubmit}>
	<div>
		<label for="name">Zone Name:</label>
		<input type="text" id="name" bind:value={name} required />
	</div>

	<div>
		<label>Draw Zone on Map:</label>
		<MapboxMap
			bind:geometry
			bind:area
			on:geometryChange={handleGeometryChange}
			initialGeometry={geometry}
		/>
	</div>

	<div>
		<label>Crop Type:</label>
		<input type="text" bind:value={cropType} required />
	</div>

	<div>
		<label>Planting Date:</label>
		<input type="date" bind:value={plantingDate} required />
	</div>

	<div>
		<label>Harvest Date:</label>
		<input type="date" bind:value={harvestDate} required />
	</div>

	<div>
		<label>Notes:</label>
		<textarea bind:value={notes} />
	</div>

	<div>
		<label>Soil Type:</label>
		<input type="text" bind:value={soilType} required />
	</div>

	<button type="submit">Update Zone</button>

	{#if error}
		<p style="color: red;">{error}</p>
	{/if}
</form>

<!-- Optionally, add a delete button -->
<form method="POST" action={`/zones/${data.zone.id}/delete`}>
	<button type="submit">Delete Zone</button>
</form>
