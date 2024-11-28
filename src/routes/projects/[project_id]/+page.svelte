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
		<!-- <div class="actions">
			<Button text="Edit Project" href={`/projects/${project.id}/edit`} />
		</div> -->
	</div>

	<p class="description">
		View and manage your project details, including its geographical boundaries and purpose. You can
		add zones and devices within this project area.
	</p>

	<div class="project-content">
		<!-- Map Section -->
		<div class="map-section">
			<MapboxMap
				accessToken={MAPBOX_ACCESS_TOKEN}
				{mapFeatures}
				center={projectCenter}
				zoom={16}
				height="400px"
				width="100%"
				secondsPerRevolution={240}
				maxSpinZoom={5}
				slowSpinZoom={3}
			/>
		</div>

		<!-- Project Details -->
		<div class="details-section">
			<div class="detail-group">
				<h2>Purpose</h2>
				<p>{project.purpose}</p>
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

	.project-content {
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

	.detail-group p {
		color: var(--text-secondary, #666);
		line-height: 1.5;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.stat-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.stat-label {
		font-size: 0.875rem;
		color: var(--text-secondary, #666);
	}

	.stat-value {
		font-size: 1rem;
		font-weight: 500;
		color: var(--text-primary, #111);
	}

	@media (max-width: 768px) {
		.page-container {
			padding: 1.5rem;
		}

		.header {
			margin: 1.5rem 0 1rem;
		}

		.project-content {
			gap: 1.5rem;
		}
	}
</style>
