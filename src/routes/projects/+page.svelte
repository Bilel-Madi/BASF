<!-- src/routes/projects/+page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Breadcrumbs from '$lib/components/ui/Breadcrumbs.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import MapboxMap from '$lib/components/map/MapboxMap.svelte';
	import { colorMap } from '$lib/colorMap';
	import type { ZoneColor } from '$lib/colorMap';
	import type { Project, Zone, Device } from '@prisma/client';

	let projects: Array<
		Project & {
			zones: Zone[];
			devices: Device[];
			organization: { name: string };
		}
	> = [];
	let organization: any;

	// Add MAPBOX_ACCESS_TOKEN
	const MAPBOX_ACCESS_TOKEN =
		'pk.eyJ1IjoiYmlsZWxtYWRpIiwiYSI6ImNsbmJnM2ZrNTA1cXQybG56N2c0cjJ2bTcifQ.j-O_Igwc-2p3Na-mkusaDg';

	onMount(async () => {
		const [projectsRes, orgRes] = await Promise.all([
			fetch('/api/projects'),
			fetch('/api/organizations/current')
		]);

		if (projectsRes.ok) {
			projects = await projectsRes.json();
		}
		if (orgRes.ok) {
			organization = await orgRes.json();
		}
	});

	$: projectDisplay = projects.map((project) => ({
		...project,
		displayName:
			$page.data.user?.role === 'SUPER_ADMIN'
				? `${project.name} (${project.organization.name})`
				: project.name,
		// Add map features for each project
		mapFeatures: [
			// Project boundary
			...(project.geometry
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
				: []),
			// Zones
			...(project.zones?.map((zone) => ({
				type: 'Feature',
				geometry: zone.geometry,
				properties: {
					type: 'zone',
					id: zone.id,
					name: zone.name,
					color: colorMap[zone.color as ZoneColor] || '#088'
				}
			})) || []),
			// Devices
			...(project.devices
				?.filter((device) => device.location)
				.map((device) => ({
					type: 'Feature',
					geometry: {
						type: 'Point',
						coordinates: [device.location.longitude, device.location.latitude]
					},
					properties: {
						type: 'device',
						id: device.id,
						name: device.name,
						deviceType: device.type
					}
				})) || [])
		]
	}));

	async function handleAddClick() {
		if (organization && projects.length >= organization.maxProjects) {
			alert('Project limit reached. Please upgrade your subscription to add more projects.');
			return;
		}
		goto('/projects/add');
	}
</script>

<div class="page-container">
	<Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Projects' }]} />
	<div class="header">
		<h1 class="title">Projects</h1>
		{#if $page.data.user?.role !== 'SUPER_ADMIN' && $page.data.user?.role !== 'VIEWER'}
			<a href="/projects/add" class="add-button">
				<Button text="Add" on:click={handleAddClick} />
			</a>
		{/if}
	</div>

	<div class="grid-container">
		{#each projectDisplay as project}
			<div class="project-item">
				<h2><a href={`/projects/${project.id}`}>{project.displayName}</a></h2>
				<div class="map-preview">
					<MapboxMap
						accessToken={MAPBOX_ACCESS_TOKEN}
						mapFeatures={project.mapFeatures}
						center={project.center?.coordinates || [0, 0]}
						zoom={15}
						height="150px"
						interactive={false}
					/>
				</div>
				<p>{project.purpose}</p>
				<div class="project-stats">
					<span>{project.zones?.length || 0} zones</span>
					<span>{project.devices?.length || 0} devices</span>
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.page-container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 3rem 2rem;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin: 2.5rem 0 3.5rem;
		position: relative;
	}

	.header::after {
		content: '';
		position: absolute;
		bottom: -1.5rem;
		left: 0;
		right: 0;
		height: 1px;
		background: linear-gradient(to right, rgba(0, 0, 0, 0.1), transparent);
	}

	.title {
		font-size: 2.25rem;
		font-weight: 500;
		letter-spacing: -0.5px;
		color: #1a1a1a;
	}

	.add-button {
		text-decoration: none;
	}

	.grid-container {
		display: grid;
		grid-template-columns: repeat(3, minmax(380px, 1fr));
		gap: 2rem;
		padding-top: 1rem;
	}

	@media (max-width: 1200px) {
		.grid-container {
			grid-template-columns: repeat(2, minmax(380px, 1fr));
		}
	}

	@media (max-width: 768px) {
		.page-container {
			padding: 2rem 1rem;
		}

		.header {
			margin: 2rem 0 3rem;
		}

		.title {
			font-size: 1.75rem;
		}

		.grid-container {
			grid-template-columns: 1fr;
		}
	}

	.project-item {
		/* Add some basic card styling */
		padding: 1.5rem;
		background: white;
		border-radius: 0.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.project-item h2 {
		margin: 0 0 0.5rem 0;
		font-size: 1.25rem;
	}

	.project-item a {
		color: inherit;
		text-decoration: none;
	}

	.project-item p {
		margin: 0;
		color: #666;
	}

	.map-preview {
		margin: 1rem 0;
		border-radius: 0.25rem;
		overflow: hidden;
		border: 1px solid #eee;
	}

	.project-stats {
		margin-top: 0.75rem;
		display: flex;
		gap: 1rem;
		font-size: 0.875rem;
		color: #666;
	}

	.project-stats span {
		background: #f5f5f5;
		padding: 0.25rem 0.75rem;
		border-radius: 1rem;
	}
</style>
