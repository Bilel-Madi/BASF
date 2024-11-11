<!-- src/lib/components/ZoneCard.svelte -->
<script lang="ts">
	import MapboxMap from '$lib/components/map/MapboxMap.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import type { Zone, Device } from '@prisma/client';

	export let zone: Zone & { devices: Device[] };

	const MAPBOX_ACCESS_TOKEN =
		'pk.eyJ1IjoiYmlsZWxtYWRpIiwiYSI6ImNsbmJnM2ZrNTA1cXQybG56N2c0cjJ2bTcifQ.j-O_Igwc-2p3Na-mkusaDg'; // Replace with your actual token

	// Prepare polygon data for the map
	const polygonData = zone.geometry
		? {
				type: 'Feature',
				geometry: zone.geometry,
				properties: {}
		  }
		: null;

	// Format dates
	const plantingDate = new Date(zone.plantingDate).toLocaleDateString();
	const harvestDate = new Date(zone.harvestDate).toLocaleDateString();
	const dateCreated = new Date(zone.createdAt).toLocaleDateString();
</script>

<a href={`/zones/${zone.id}`} class="card-link">
	<div class="card">
		<div class="card-header">
			<h2 class="zone-name">{zone.name}</h2>
		</div>
		<div class="map-container">
			<MapboxMap
				accessToken={MAPBOX_ACCESS_TOKEN}
				{polygonData}
				height="200px"
				showControls={false}
			/>
		</div>
		<div class="zone-info">
			<p><strong>Crop Type:</strong> {zone.cropType}</p>
			<p><strong>Planting Date:</strong> {plantingDate}</p>
			<p><strong>Harvest Date:</strong> {harvestDate}</p>
			<p><strong>Soil Type:</strong> {zone.soilType}</p>
			<p><strong>Date Created:</strong> {dateCreated}</p>
			<p><strong>Assigned Devices:</strong> {zone.devices.length}</p>
		</div>
		<div class="card-footer">
			<Button text="View Details" variant="primary" href={`/zones/${zone.id}`} />
		</div>
	</div>
</a>

<style>
	.card-link {
		text-decoration: none;
		color: inherit;
	}

	.card {
		background: white;
		border-radius: 12px;
		box-shadow: 0 6px 12px rgba(0, 0, 0, 0.05);
		padding: 1rem;
		transition: transform 0.3s, box-shadow 0.3s;
		border: 1px solid #e0e0e0;
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.card:hover {
		transform: translateY(-5px);
		box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
	}

	.card-header {
		margin-bottom: 0.5rem;
	}

	.zone-name {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0;
	}

	.map-container {
		margin-bottom: 1rem;
	}

	.zone-info p {
		margin: 0.25rem 0;
		font-size: 0.95rem;
	}

	.zone-info p strong {
		color: #333;
	}

	.card-footer {
		margin-top: auto;
		text-align: right;
	}

	.card-footer a {
		text-decoration: none;
	}
</style>
