<!-- src/routes/projects/add/+page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import MapboxMap from '$lib/components/map/MapboxMap.svelte';
	import Breadcrumbs from '$lib/components/ui/Breadcrumbs.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
	import { PUBLIC_MAPBOX_ACCESS_TOKEN } from '$env/static/public';

	// Project details
	let name: string = '';
	let purpose: string = '';
	let geometry: GeoJSON.Geometry | null = null;
	let center: GeoJSON.Geometry | null = null;

	// Handle geometry changes from MapboxMap component
	function handleGeometryChanged(
		event: CustomEvent<{ geometry: GeoJSON.Geometry; center: GeoJSON.Geometry }>
	) {
		geometry = event.detail.geometry;
		center = event.detail.center;
	}

	// Handle form submission
	async function submitProject() {
		if (!name || !purpose || !geometry || !center) {
			alert('Please fill in all required fields and draw the project boundaries on the map.');
			return;
		}

		const projectData = {
			name,
			purpose,
			geometry,
			center
		};

		const response = await fetch('/api/projects/add', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(projectData)
		});

		if (response.ok) {
			goto('/zones');
		} else {
			const errorText = await response.text();
			alert(`Error creating project: ${errorText}`);
		}
	}
</script>

<div class="page-container">
	<Breadcrumbs
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Projects', href: '/projects' },
			{ label: 'Add Project' }
		]}
	/>

	<div class="header">
		<h1 class="title">Add New Project</h1>
	</div>

	<p class="description">
		Projects help you organize and manage different growing areas. Draw the boundaries of your
		project on the map and provide basic details. You can later add specific zones and devices
		within this project area.
	</p>

	<form on:submit|preventDefault={submitProject} class="project-form">
		<!-- Map where users can draw the project boundaries -->
		<div class="map-section">
			<MapboxMap
				accessToken={PUBLIC_MAPBOX_ACCESS_TOKEN}
				allowPolygonDrawing={true}
				on:geometryChanged={handleGeometryChanged}
				height="400px"
				width="100%"
			/>
		</div>

		<!-- Project Details -->
		<div class="details-section">
			<div class="input-group">
				<label for="name">Project Name*</label>
				<input type="text" id="name" bind:value={name} required />
			</div>

			<div class="input-group">
				<label for="purpose">Purpose*</label>
				<textarea id="purpose" bind:value={purpose} required />
			</div>
		</div>

		<!-- Submit Button -->
		<div class="submit-section">
			<Button text="Create Project" type="submit" />
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

	.project-form {
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
		gap: 1.5rem;
	}

	.input-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.input-group label {
		font-weight: 500;
		color: var(--text-primary, #111);
	}

	.input-group input,
	.input-group textarea {
		padding: 0.75rem;
		border: 1px solid var(--border-color, #eaeaea);
		border-radius: 6px;
		font-size: 1rem;
	}

	.input-group textarea {
		min-height: 100px;
		resize: vertical;
	}

	.submit-section {
		display: flex;
		justify-content: flex-end;
	}

	@media (max-width: 768px) {
		.page-container {
			padding: 1.5rem;
		}

		.header {
			margin: 1.5rem 0 1rem;
		}

		.project-form {
			gap: 1.5rem;
		}
	}
</style>
