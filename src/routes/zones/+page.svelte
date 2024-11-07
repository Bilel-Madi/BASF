<!-- src/routes/zones/+page.svelte -->

<script lang="ts">
	import { onMount } from 'svelte';
	import MapboxMap from '$lib/components/MapboxMap.svelte';
	import { page } from '$app/stores';

	let name = '';
	let cropType = '';
	let plantingDate = '';
	let harvestDate = '';
	let notes = '';
	let soilType = '';
	let geometry: GeoJSON.Geometry | null = null;
	let area: number = 0;
	let error: string = '';
	let showMap = false;

	onMount(() => {
		showMap = true;
	});

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

		const response = await fetch('/zones', {
			method: 'POST',
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
			window.location.href = '/zones';
		} else {
			const errText = await response.text();
			error = errText;
		}
	};
</script>

<div class="container">
	<div class="sidebar">
		<h2>Your Zones</h2>
		<ul>
			{#each $page.data.zones as zone}
				<li>
					<a href={`/zones/${zone.id}`}>{zone.name}</a>
				</li>
			{/each}
		</ul>
	</div>

	<div class="main-content">
		<h1>Create Zone</h1>

		<form on:submit={handleSubmit}>
			<div>
				<label for="name">Zone Name:</label>
				<input type="text" id="name" bind:value={name} required />
			</div>

			<div>
				<label>Draw Zone on Map:</label>
				{#if showMap}
					<MapboxMap mode="polygon" on:geometryChange={handleGeometryChange} />
				{/if}
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

			<button type="submit">Create Zone</button>

			{#if error}
				<p style="color: red;">{error}</p>
			{/if}
		</form>
	</div>
</div>

<style>
	.container {
		display: flex;
		gap: 2rem;
		max-width: 1400px;
		margin: 0 auto;
		padding: 2rem;
	}

	.sidebar {
		flex: 0 0 250px;
		padding: 1rem;
		background: #ffffff;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		height: fit-content;
	}

	.main-content {
		flex: 1;
	}

	form {
		margin: 0;
	}

	h2 {
		margin-top: 0;
	}

	ul {
		margin: 1rem 0;
	}

	h1 {
		color: #2c3e50;
		text-align: center;
		margin-bottom: 2rem;
	}

	div {
		margin-bottom: 1.5rem;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		color: #34495e;
		font-weight: 500;
	}

	input,
	textarea {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
	}

	textarea {
		min-height: 100px;
		resize: vertical;
	}

	button {
		width: 100%;
		padding: 1rem;
		background-color: #3498db;
		color: white;
		border: none;
		border-radius: 4px;
		font-size: 1rem;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	button:hover {
		background-color: #2980b9;
	}

	p[style='color: red;'] {
		margin-top: 1rem;
		text-align: center;
		font-weight: 500;
	}

	li {
		margin-bottom: 0.5rem;
	}

	a {
		color: #3498db;
		text-decoration: none;
		transition: color 0.2s;
	}

	a:hover {
		color: #2980b9;
	}
</style>
