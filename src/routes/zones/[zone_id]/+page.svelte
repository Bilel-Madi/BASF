<!-- src/routes/zones/[zone_id]/+page.svelte -->
<script lang="ts">
	import MapboxMap from '$lib/components/map/MapboxMap.svelte';
	import Breadcrumbs from '$lib/components/ui/Breadcrumbs.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import DeviceCard from '$lib/components/cards/DeviceCard.svelte'; // Import the DeviceCard component
	import type { Device, Zone, Project } from '@prisma/client';
	import { goto } from '$app/navigation';

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
		project: Project;
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

	// Prepare map features array
	$: mapFeatures = [
		// Project boundary
		{
			type: 'Feature',
			geometry: data.project.geometry,
			properties: {
				type: 'projectBoundary',
				id: data.project.id,
				name: data.project.name
			}
		},
		// Zone polygon
		{
			type: 'Feature',
			geometry: data.zone.geometry,
			properties: {
				type: 'zone',
				id: data.zone.id,
				name: data.zone.name,
				color: getPastelColor(data.zone.color)
			}
		}
	];

	async function handleDelete() {
		if (!confirm('Are you sure you want to delete this zone?')) {
			return;
		}

		const response = await fetch(`/api/zones/${zone.id}/delete`, {
			method: 'DELETE'
		});

		if (response.ok) {
			goto('/zones');
		} else {
			const error = await response.text();
			alert(`Error deleting zone: ${error}`);
		}
	}
</script>

<div class="page-container">
	<Breadcrumbs items={breadcrumbItems} />

	<div class="header">
		<h1 class="title">{zone.name}</h1>
		<div class="actions">
			<a href={`/zones/${zone.id}/edit`}>
				<Button text="Edit Zone" />
			</a>
			<Button text="Delete" variant="danger-outline" on:click={handleDelete} />
		</div>
	</div>

	<p class="description">
		View and manage your zone details, including its geographical boundaries, crop information, and
		connected devices. This zone is part of the {data.project.name} project.
	</p>

	<div class="zone-content">
		<!-- Map Section -->
		<div class="map-section">
			<MapboxMap
				accessToken={MAPBOX_ACCESS_TOKEN}
				{mapFeatures}
				height="400px"
				width="100%"
				maxZoom={16}
				minZoom={10}
				fillColor={getPastelColor(zone.color)}
				secondsPerRevolution={240}
				maxSpinZoom={5}
				slowSpinZoom={3}
			/>
		</div>

		<!-- Zone Details -->
		<div class="details-section">
			<div class="detail-group">
				<h2>Crop Information</h2>
				<div class="details-grid">
					<div class="detail-item">
						<span class="detail-label">Crop Type</span>
						<span class="detail-value">{zone.cropType}</span>
					</div>
					<div class="detail-item">
						<span class="detail-label">Soil Type</span>
						<span class="detail-value">{zone.soilType}</span>
					</div>
					<div class="detail-item">
						<span class="detail-label">Planting Date</span>
						<span class="detail-value">{plantingDate}</span>
					</div>
					<div class="detail-item">
						<span class="detail-label">Harvest Date</span>
						<span class="detail-value">{harvestDate}</span>
					</div>
				</div>
			</div>

			{#if zone.notes}
				<div class="detail-group">
					<h2>Notes</h2>
					<p class="notes-content">{zone.notes}</p>
				</div>
			{/if}

			<div class="detail-group">
				<h2>Connected Devices</h2>
				{#if zone.devices.length > 0}
					<div class="devices-grid">
						{#each zone.devices as device}
							<DeviceCard {device} />
						{/each}
					</div>
				{:else}
					<p class="empty-state">No devices have been connected to this zone yet.</p>
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

	.actions {
		display: flex;
		gap: 0.75rem;
	}

	.zone-content {
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
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.detail-group {
		padding: 1.5rem;
		background: var(--background-secondary, #f9f9f9);
		border-radius: 8px;
		border: 1px solid var(--border-color, #eaeaea);
	}

	.detail-group h2 {
		font-size: 1.25rem;
		font-weight: 500;
		margin-bottom: 1rem;
		color: var(--text-primary, #111);
	}

	.details-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1.5rem;
	}

	.detail-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.detail-label {
		font-size: 0.875rem;
		color: var(--text-secondary, #666);
	}

	.detail-value {
		font-size: 1rem;
		font-weight: 500;
		color: var(--text-primary, #111);
	}

	.notes-content {
		color: var(--text-secondary, #666);
		line-height: 1.5;
	}

	.devices-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1.5rem;
	}

	.empty-state {
		color: var(--text-secondary, #666);
		text-align: center;
		padding: 2rem;
		background: var(--background-tertiary, #f3f4f6);
		border-radius: 6px;
	}

	@media (max-width: 768px) {
		.page-container {
			padding: 1.5rem;
		}

		.header {
			margin: 1.5rem 0 1rem;
			flex-direction: column;
			gap: 1rem;
			align-items: flex-start;
		}

		.actions {
			width: 100%;
		}

		.zone-content {
			gap: 1.5rem;
		}

		.details-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
