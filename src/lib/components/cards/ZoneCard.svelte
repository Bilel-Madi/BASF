<!-- src/lib/components/cards/ZoneCard.svelte -->

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

	// Helper function to map ZoneColor enum to actual pastel color codes
	function getPastelColor(color: string): string {
		const colorMap: Record<string, string> = {
			PASTEL_PINK: '#FFB3BA',
			PASTEL_ORANGE: '#FFDFBA',
			PASTEL_YELLOW: '#FFFFBA',
			PASTEL_GREEN: '#BAFFC9',
			PASTEL_BLUE: '#BAE1FF',
			PASTEL_PURPLE: '#D5BAFF'
		};
		return colorMap[color] || '#FFFFFF'; // Default to white if color not found
	}

	// Debugging: Log the received zone data
	console.log('ZoneCard received zone:', zone);
</script>

<a href={`/zones/${zone.id}`} class="card-link">
	<div class="card">
		<div class="card-header">
			<h2 class="zone-name">{zone.name}</h2>
			<span class="device-count">{zone.devices.length} devices</span>
		</div>
		<div class="map-container">
			{#if polygonData}
				<MapboxMap
					accessToken={MAPBOX_ACCESS_TOKEN}
					{polygonData}
					height="180px"
					showControls={false}
					fillColor={getPastelColor(zone.color)}
				/>
			{:else}
				<p class="no-data">No geometry data available.</p>
			{/if}
		</div>
		<div class="zone-info">
			<div class="info-grid">
				<div class="info-item">
					<span class="label">Crop</span>
					<span class="value">{zone.cropType}</span>
				</div>
				<div class="info-item">
					<span class="label">Soil</span>
					<span class="value">{zone.soilType}</span>
				</div>
				<div class="info-item">
					<span class="label">Planting</span>
					<span class="value">{plantingDate}</span>
				</div>
				<div class="info-item">
					<span class="label">Harvest</span>
					<span class="value">{harvestDate}</span>
				</div>
			</div>
		</div>
	</div>
</a>

<style>
	.card-link {
		text-decoration: none;
		color: inherit;
		display: block;
	}

	.card {
		background: white;
		border-radius: 16px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
		padding: 1.5rem;
		transition: all 0.2s ease-in-out;
		border: 1px solid #f0f0f0;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.zone-name {
		font-size: 1.25rem;
		font-weight: 500;
		color: #1a1a1a;
		margin: 0;
	}

	.device-count {
		font-size: 0.875rem;
		color: #666;
		background: #f5f5f5;
		padding: 0.25rem 0.75rem;
		border-radius: 1rem;
	}

	.map-container {
		border-radius: 12px;
		overflow: hidden;
		border: 1px solid #f0f0f0;
	}

	.no-data {
		text-align: center;
		color: #666;
		padding: 2rem;
		background: #fafafa;
		margin: 0;
	}

	.info-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}

	.info-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.label {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: #666;
	}

	.value {
		font-size: 0.925rem;
		color: #1a1a1a;
	}
</style>
