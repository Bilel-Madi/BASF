<!-- src/routes/zones/[zone_id]/+page.svelte -->
<script lang="ts">
	import MapboxMap from '$lib/components/map/MapboxMap.svelte';
	import Breadcrumbs from '$lib/components/ui/Breadcrumbs.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import DeviceCard from '$lib/components/cards/DeviceCard.svelte'; // Import the DeviceCard component
	import type { Device } from '@prisma/client';

	export let data: { zone: Zone & { devices: Device[] } };

	const zone = data.zone;

	const MAPBOX_ACCESS_TOKEN =
		'pk.eyJ1IjoiYmlsZWxtYWRpIiwiYSI6ImNsbmJnM2ZrNTA1cXQybG56N2c0cjJ2bTcifQ.j-O_Igwc-2p3Na-mkusaDg'; // Replace with your actual token

	// Prepare polygon data
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

	const breadcrumbItems = [
		{ label: 'Home', href: '/' },
		{ label: 'Zones', href: '/zones' },
		{ label: zone.name }
	];
</script>

<div class="page-container">
	<Breadcrumbs items={breadcrumbItems} />

	<div class="header">
		<h1 class="title">{zone.name}</h1>
		<div class="actions">
			<a href={`/zones/${zone.id}/edit`}>
				<Button text="Edit Zone" />
			</a>
			<a href={`/zones/${zone.id}/delete`}>
				<Button text="Delete Zone" variant="danger" />
			</a>
		</div>
	</div>

	<div class="content">
		<div class="map-section">
			<!-- Map component with adjustable zoom levels -->
			<MapboxMap
				accessToken={MAPBOX_ACCESS_TOKEN}
				{polygonData}
				height="400px"
				maxZoom={16}
				minZoom={10}
			/>
		</div>

		<div class="zone-details">
			<h2>Zone Details</h2>
			<p><strong>Crop Type:</strong> {zone.cropType}</p>
			<p><strong>Planting Date:</strong> {plantingDate}</p>
			<p><strong>Harvest Date:</strong> {harvestDate}</p>
			<p><strong>Soil Type:</strong> {zone.soilType}</p>
			<p><strong>Date Created:</strong> {dateCreated}</p>
			<p><strong>Notes:</strong> {zone.notes}</p>

			<h2>Assigned Devices</h2>
			{#if zone.devices.length > 0}
				<div class="devices-grid">
					{#each zone.devices as device}
						<DeviceCard {device} />
					{/each}
				</div>
			{:else}
				<p>No devices assigned to this zone.</p>
			{/if}
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
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.title {
		font-size: 2rem;
		font-weight: 700;
		margin: 0;
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.content {
		display: grid;
		grid-template-columns: 1fr;
		gap: 2rem;
	}

	.map-section {
		width: 100%;
	}

	.zone-details {
		margin-top: 2rem;
	}

	.zone-details h2 {
		font-size: 1.5rem;
		margin-bottom: 1rem;
	}

	.zone-details p {
		margin: 0.5rem 0;
		font-size: 1rem;
	}

	.zone-details p strong {
		color: #333;
	}

	.devices-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1.5rem;
		margin-top: 1rem;
	}

	a {
		color: #3498db;
		text-decoration: none;
		transition: color 0.2s;
	}

	a:hover {
		color: #2980b9;
	}

	/* Responsive Adjustments */
	@media (max-width: 768px) {
		.content {
			grid-template-columns: 1fr;
		}
	}
</style>
