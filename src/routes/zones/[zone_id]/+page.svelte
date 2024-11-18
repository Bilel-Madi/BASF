<!-- src/routes/zones/[zone_id]/+page.svelte -->
<script lang="ts">
	import MapboxMap from '$lib/components/map/MapboxMap.svelte';
	import Breadcrumbs from '$lib/components/ui/Breadcrumbs.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import DeviceCard from '$lib/components/cards/DeviceCard.svelte'; // Import the DeviceCard component
	import type { Device, Zone } from '@prisma/client';

	export let data: {
		zone: Zone & {
			devices: Array<
				Device & {
					zone: Zone;
					latest_co2?: number;
					latest_humidity?: number;
					latest_pressure?: number;
					latest_temperature?: number;
					latest_ec?: number;
					latest_moisture?: number;
					latest_soil_temperature?: number;
					mainReadings: number[];
				}
			>;
		};
	};

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

	// Add the getPastelColor helper function at the top with other functions
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
</script>

<div class="page-container">
	<Breadcrumbs items={breadcrumbItems} />

	<div class="header">
		<h1 class="title">{zone.name}</h1>
		<div class="actions">
			<a href={`/zones/${zone.id}/edit`}>
				<Button text="Edit" variant="outline" />
			</a>
			<a href={`/zones/${zone.id}/delete`}>
				<Button text="Delete" variant="danger-outline" />
			</a>
		</div>
	</div>

	<div class="content">
		<div class="map-section">
			<MapboxMap
				accessToken={MAPBOX_ACCESS_TOKEN}
				{polygonData}
				height="500px"
				maxZoom={16}
				minZoom={10}
				fillColor={getPastelColor(zone.color)}
			/>
		</div>

		<div class="info-grid">
			<div class="zone-details card">
				<h2>Details</h2>
				<div class="details-grid">
					<div class="detail-item">
						<span class="label">Crop Type</span>
						<span class="value">{zone.cropType}</span>
					</div>
					<div class="detail-item">
						<span class="label">Planting Date</span>
						<span class="value">{plantingDate}</span>
					</div>
					<div class="detail-item">
						<span class="label">Harvest Date</span>
						<span class="value">{harvestDate}</span>
					</div>
					<div class="detail-item">
						<span class="label">Soil Type</span>
						<span class="value">{zone.soilType}</span>
					</div>
				</div>
				{#if zone.notes}
					<div class="notes">
						<span class="label">Notes</span>
						<p class="value">{zone.notes}</p>
					</div>
				{/if}
			</div>

			<div class="devices card">
				<h2>Devices</h2>
				{#if zone.devices.length > 0}
					<div class="devices-grid">
						{#each zone.devices as device}
							<DeviceCard {device} />
						{/each}
					</div>
				{:else}
					<p class="no-devices">No devices assigned</p>
				{/if}
			</div>
		</div>
	</div>
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
		margin: 2rem 0 3rem;
	}

	.title {
		font-size: 2.5rem;
		font-weight: 500;
		color: #2c3e50;
		margin: 0;
	}

	.actions {
		display: flex;
		gap: 1rem;
	}

	.content {
		display: flex;
		flex-direction: column;
		gap: 3rem;
	}

	.map-section {
		width: 100%;
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
	}

	.info-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 2rem;
	}

	.card {
		background: white;
		border-radius: 12px;
		padding: 2rem;
		box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
	}

	h2 {
		font-size: 1.5rem;
		font-weight: 500;
		color: #2c3e50;
		margin: 0 0 1.5rem;
	}

	.details-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 2rem;
	}

	.detail-item {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.label {
		font-size: 0.875rem;
		color: #64748b;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.value {
		font-size: 1rem;
		color: #334155;
	}

	.notes {
		margin-top: 2rem;
		padding-top: 2rem;
		border-top: 1px solid #e2e8f0;
	}

	.notes .value {
		margin-top: 0.5rem;
		line-height: 1.6;
	}

	.devices-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1.5rem;
	}

	.no-devices {
		color: #64748b;
		font-size: 0.875rem;
		text-align: center;
		padding: 2rem;
		background: #f8fafc;
		border-radius: 8px;
	}

	@media (min-width: 1024px) {
		.info-grid {
			grid-template-columns: 400px 1fr;
		}
	}

	@media (max-width: 768px) {
		.page-container {
			padding: 1rem;
		}

		.header {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}

		.title {
			font-size: 2rem;
		}

		.details-grid {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}
	}
</style>
