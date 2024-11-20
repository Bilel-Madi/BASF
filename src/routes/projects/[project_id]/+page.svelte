<!-- src/routes/projects/[project_id]/+page.svelte -->
<script lang="ts">
	import MapboxMap from '$lib/components/map/MapboxMap.svelte';
	import Breadcrumbs from '$lib/components/ui/Breadcrumbs.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	const project = data.project;

	// Extract the project's center coordinates
	let projectCenter: [number, number] = [0, 0];

	$: if (data.project && data.project.center) {
		projectCenter = data.project.center.coordinates as [number, number];
	}

	const MAPBOX_ACCESS_TOKEN =
		'pk.eyJ1IjoiYmlsZWxtYWRpIiwiYSI6ImNsbmJnM2ZrNTA1cXQybG56N2c0cjJ2bTcifQ.j-O_Igwc-2p3Na-mkusaDg';

	const mapFeatures = project.geometry
		? [
				{
					type: 'Feature',
					geometry: project.geometry,
					properties: {
						type: 'projectBoundary',
						id: project.id,
						name: project.name
					}
				}
		  ]
		: [];

	const breadcrumbItems = [
		{ label: 'Home', href: '/' },
		{ label: 'Projects', href: '/projects' },
		{ label: project.name }
	];
</script>

<div class="page-container">
	<Breadcrumbs items={breadcrumbItems} />
	<div class="header">
		<h1 class="title">{project.name}</h1>
		<div class="actions">
			<!-- Add Edit and Delete Buttons if needed -->
		</div>
	</div>

	<div class="content">
		<div class="map-section">
			<MapboxMap
				accessToken={MAPBOX_ACCESS_TOKEN}
				{mapFeatures}
				center={projectCenter}
				zoom={16}
				height="500px"
			/>
		</div>

		<div class="details-section">
			<h2>Purpose</h2>
			<p>{project.purpose}</p>
		</div>
	</div>
</div>

<style>
	/* Add your styles here */
</style>
