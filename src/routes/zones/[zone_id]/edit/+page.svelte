<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import MapboxMap from '$lib/components/map/MapboxMap.svelte';
	import Breadcrumbs from '$lib/components/ui/Breadcrumbs.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import type { ZoneColor } from '@prisma/client';

	export let data: {
		zone: any;
		project: any;
	};

	// Initialize form data from zone
	let name = data.zone.name;
	let cropType = data.zone.cropType || '';
	let plantingDate = data.zone.plantingDate
		? new Date(data.zone.plantingDate).toISOString().split('T')[0]
		: '';
	let harvestDate = data.zone.harvestDate
		? new Date(data.zone.harvestDate).toISOString().split('T')[0]
		: '';
	let soilType = data.zone.soilType || '';
	let color: ZoneColor = data.zone.color as ZoneColor;
	let geometry = data.zone.geometry;
	let area = data.zone.area;

	const colors: ZoneColor[] = [
		'PASTEL_PINK',
		'PASTEL_ORANGE',
		'PASTEL_YELLOW',
		'PASTEL_GREEN',
		'PASTEL_BLUE',
		'PASTEL_PURPLE'
	];

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

	async function submitZone() {
		const zoneData = {
			name,
			geometry,
			area,
			color,
			zoneType: data.zone.zoneType,
			cropType,
			plantingDate,
			harvestDate,
			soilType
		};

		const response = await fetch(`/api/zones/${data.zone.id}/edit`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(zoneData)
		});

		if (response.ok) {
			goto(`/zones/${data.zone.id}`);
		} else {
			const errorText = await response.text();
			alert(`Error updating zone: ${errorText}`);
		}
	}

	function handleGeometryChanged(event: CustomEvent<{ geometry: GeoJSON.Geometry; area: number }>) {
		geometry = event.detail.geometry;
		area = event.detail.area;
	}

	// Prepare map features with existing zone
	$: mapFeatures = [
		{
			type: 'Feature',
			geometry: data.project.geometry,
			properties: {
				type: 'projectBoundary',
				id: data.project.id,
				name: data.project.name
			}
		},
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
</script>

<div class="page-container">
	<Breadcrumbs
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Zones', href: '/zones' },
			{ label: data.zone.name, href: `/zones/${data.zone.id}` },
			{ label: 'Edit Zone' }
		]}
	/>

	<div class="header">
		<h1 class="title">Edit Zone</h1>
	</div>

	<p class="description">
		Update your zone details, including its geographical boundaries and crop information. Make
		changes to the zone's properties and save when done.
	</p>

	<form on:submit|preventDefault={submitZone} class="zone-form">
		<!-- Map Section First -->
		<div class="map-section">
			<h2>Zone Location</h2>
			<MapboxMap
				accessToken="pk.eyJ1IjoiYmlsZWxtYWRpIiwiYSI6ImNsbmJnM2ZrNTA1cXQybG56N2c0cjJ2bTcifQ.j-O_Igwc-2p3Na-mkusaDg"
				allowPolygonDrawing={true}
				on:geometryChanged={handleGeometryChanged}
				height="400px"
				width="100%"
				{mapFeatures}
				initialGeometry={data.zone.geometry}
			/>
		</div>

		<!-- Details Section -->
		<div class="details-section">
			<div class="input-group">
				<label for="name">Zone Name*</label>
				<input type="text" id="name" bind:value={name} required placeholder="Enter zone name" />
			</div>

			<div class="input-group">
				<label>Zone Color*</label>
				<div class="color-selection">
					{#each colors as c}
						<button
							type="button"
							class="color-button {color === c ? 'selected' : ''}"
							style="background-color: {getPastelColor(c)};"
							on:click={() => (color = c)}
						/>
					{/each}
				</div>
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
				<label for="cropType">Crop Type*</label>
				<input
					type="text"
					id="cropType"
					bind:value={cropType}
					required
					placeholder="Enter crop type"
				/>
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
		</div>

		<div class="submit-section">
			<Button text="Save Changes" type="submit" />
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

	.input-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.dates-container {
		grid-column: span 2;
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.5rem;
	}

	input {
		padding: 0.75rem;
		border: 1px solid var(--border-color, #eaeaea);
		border-radius: 6px;
		font-size: 1rem;
	}

	.color-selection {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.color-button {
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 6px;
		border: 2px solid transparent;
		cursor: pointer;
		transition: border-color 0.2s;
	}

	.color-button.selected {
		border-color: var(--text-primary, #111);
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
			grid-column: span 1;
		}
	}
</style>
