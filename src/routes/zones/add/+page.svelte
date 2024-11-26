<!-- src/routes/zones/add/+page.svelte -->

<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import MapboxMap from '$lib/components/map/MapboxMap.svelte';
	import Breadcrumbs from '$lib/components/ui/Breadcrumbs.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import type { ZoneColor } from '@prisma/client';
	import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

	// Zone details
	let name: string = '';
	let cropType: string = '';
	let plantingDate: string = '';
	let harvestDate: string = '';
	let notes: string = '';
	let soilType: string = '';
	let color: ZoneColor | '' = '';
	let geometry: GeoJSON.Geometry | null = null;
	let area: number = 0;
	let selectedDevices: string[] = [];

	// Pastel colors
	const colors: ZoneColor[] = [
		'PASTEL_PINK',
		'PASTEL_ORANGE',
		'PASTEL_YELLOW',
		'PASTEL_GREEN',
		'PASTEL_BLUE',
		'PASTEL_PURPLE'
	];

	// Device data
	let devices: Array<{ id: string; name: string }> = [];

	// Add project center initialization
	let projectCenter: [number, number] = [0, 0];

	$: if ($page.data.project?.center?.coordinates) {
		projectCenter = $page.data.project.center.coordinates;
	}

	// Add mapFeatures array for the project boundary
	$: mapFeatures = [
		{
			type: 'Feature',
			geometry: $page.data.project.geometry,
			properties: {
				type: 'projectBoundary',
				id: $page.data.project.id,
				name: $page.data.project.name
			}
		}
	];

	// Fetch available devices on mount
	onMount(async () => {
		const res = await fetch('/api/devices'); // Ensure this endpoint exists
		if (res.ok) {
			devices = await res.json();
		} else {
			// Handle error
			console.error('Failed to fetch devices');
		}
	});

	// Handle geometry changes from MapboxMap component
	function handleGeometryChanged(event: CustomEvent<{ geometry: GeoJSON.Geometry; area: number }>) {
		geometry = event.detail.geometry;
		area = event.detail.area;
	}

	// Handle form submission
	async function submitZone() {
		// Validate required fields
		if (
			!name ||
			!cropType ||
			!plantingDate ||
			!harvestDate ||
			!soilType ||
			!geometry ||
			!area ||
			!color
		) {
			alert('Please fill in all required fields and draw a zone on the map.');
			return;
		}

		// Prepare the data
		const zoneData = {
			name,
			cropType,
			plantingDate,
			harvestDate,
			notes,
			soilType,
			geometry,
			area,
			color,
			devices: selectedDevices
		};

		// Send a POST request to create the zone
		const response = await fetch('/api/zones/add', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(zoneData)
		});

		if (response.ok) {
			// Redirect to zones list
			goto('/zones');
		} else {
			const errorText = await response.text();
			alert(`Error creating zone: ${errorText}`);
		}
	}

	// Helper function to map ZoneColor enum to actual pastel color codes
	function getPastelColor(color: ZoneColor): string {
		const colorMap: Record<ZoneColor, string> = {
			PASTEL_PINK: '#FFB3BA',
			PASTEL_ORANGE: '#FFDFBA',
			PASTEL_YELLOW: '#FFFFBA',
			PASTEL_GREEN: '#BAFFC9',
			PASTEL_BLUE: '#BAE1FF',
			PASTEL_PURPLE: '#D5BAFF'
		};
		return colorMap[color];
	}

	let mapComponent: any; // Reference to MapboxMap component

	// Update color selection handler
	function handleColorSelection(selectedColor: ZoneColor) {
		color = selectedColor;
		if (mapComponent) {
			mapComponent.updateFillColor(getPastelColor(selectedColor));
		}
	}
</script>

<!-- Zone creation form -->
<div class="page-container">
	<Breadcrumbs
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Zones', href: '/zones' },
			{ label: 'Add Zone' }
		]}
	/>

	<div class="header">
		<h1 class="title">Add New Zone</h1>
	</div>

	<p class="description">
		Zones are specific areas within your project where you grow different crops. Draw the boundaries
		of your zone on the map, specify the crop details, and optionally assign devices to monitor this
		area.
	</p>

	<form on:submit|preventDefault={submitZone} class="zone-form">
		<!-- Map section -->
		<div class="map-section">
			<MapboxMap
				bind:this={mapComponent}
				accessToken="pk.eyJ1IjoiYmlsZWxtYWRpIiwiYSI6ImNsbmJnM2ZrNTA1cXQybG56N2c0cjJ2bTcifQ.j-O_Igwc-2p3Na-mkusaDg"
				allowPolygonDrawing={true}
				on:geometryChanged={handleGeometryChanged}
				height="400px"
				width="100%"
				center={projectCenter}
				zoom={15}
				{mapFeatures}
			/>
		</div>

		<!-- Zone Details -->
		<div class="details-section">
			<div class="input-group">
				<label for="name">Zone Name*</label>
				<input type="text" id="name" bind:value={name} required placeholder="Enter zone name" />
			</div>

			<div class="input-group">
				<label for="cropType">Crop Type*</label>
				<input
					type="text"
					id="cropType"
					bind:value={cropType}
					required
					placeholder="Enter crop type"
				/>
			</div>

			<div class="dates-container">
				<div class="input-group">
					<label for="plantingDate">Planting Date*</label>
					<input type="date" id="plantingDate" bind:value={plantingDate} required />
				</div>

				<div class="input-group">
					<label for="harvestDate">Harvest Date*</label>
					<input type="date" id="harvestDate" bind:value={harvestDate} required />
				</div>
			</div>

			<div class="input-group">
				<label for="soilType">Soil Type*</label>
				<input
					type="text"
					id="soilType"
					bind:value={soilType}
					required
					placeholder="Enter soil type"
				/>
			</div>

			<!-- Color Selection -->
			<div class="input-group">
				<label>Zone Color*</label>
				<div class="color-selection">
					{#each colors as c}
						<button
							type="button"
							class="color-button {color === c ? 'selected' : ''}"
							style="background-color: {getPastelColor(c)};"
							on:click={() => handleColorSelection(c)}
						/>
					{/each}
				</div>
			</div>

			<!-- Assign Devices -->
			<div class="input-group">
				<label for="devices">Assign Devices</label>
				<select id="devices" bind:value={selectedDevices} multiple>
					{#each devices as device}
						<option value={device.id}>{device.name}</option>
					{/each}
				</select>
			</div>

			<div class="input-group">
				<label for="notes">Notes</label>
				<textarea
					id="notes"
					bind:value={notes}
					placeholder="Add any additional notes about this zone"
				/>
			</div>
		</div>

		<!-- Submit Button -->
		<div class="submit-section">
			<Button text="Create Zone" type="submit" />
		</div>
	</form>
</div>

<style>
	.page-container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 2rem;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin: 2.5rem 0 1.5rem;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid var(--border-color, #eaeaea);
	}

	.title {
		font-size: 1.75rem;
		font-weight: 500;
		letter-spacing: -0.02em;
		color: var(--text-primary, #111);
	}

	.description {
		margin-bottom: 2rem;
		color: var(--text-secondary, #666);
		line-height: 1.5;
	}

	.zone-form {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.map-section {
		width: 100%;
		border: 1px solid var(--border-color, #eaeaea);
		border-radius: 8px;
		overflow: hidden;
	}

	.details-section {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.5rem;
	}

	.dates-container {
		grid-column: 1 / -1;
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.5rem;
	}

	.input-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.input-group:last-child {
		grid-column: 1 / -1;
	}

	.input-group label {
		font-weight: 500;
		color: var(--text-primary, #111);
	}

	.input-group input,
	.input-group textarea,
	.input-group select {
		padding: 0.75rem;
		border: 1px solid var(--border-color, #eaeaea);
		border-radius: 6px;
		font-size: 1rem;
		background-color: white;
	}

	.input-group textarea {
		min-height: 100px;
		resize: vertical;
	}

	.color-selection {
		display: flex;
		gap: 0.75rem;
		padding: 0.5rem 0;
	}

	.color-button {
		width: 2.5rem;
		height: 2.5rem;
		border: 2px solid transparent;
		border-radius: 50%;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.color-button:hover {
		transform: scale(1.1);
	}

	.color-button.selected {
		border: 2px solid var(--text-primary, #111);
		box-shadow: 0 0 0 2px white inset;
	}

	.submit-section {
		display: flex;
		justify-content: flex-end;
		margin-top: 1rem;
	}

	@media (max-width: 768px) {
		.page-container {
			padding: 1.5rem;
		}

		.header {
			margin: 1.5rem 0 1rem;
		}

		.details-section {
			grid-template-columns: 1fr;
		}

		.dates-container {
			grid-template-columns: 1fr;
		}
	}
</style>
