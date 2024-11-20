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
			goto('/projects');
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

	<h1 class="title">Add New Project</h1>

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
	/* Add your styles here */
</style>
