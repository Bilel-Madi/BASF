<!-- src/routes/projects/+page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Breadcrumbs from '$lib/components/ui/Breadcrumbs.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	let projects = [];
	let organization: any;

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
		<Button text="Add" on:click={handleAddClick} />
	</div>

	<div class="projects-list">
		{#each projects as project}
			<div class="project-item">
				<h2><a href={`/projects/${project.id}`}>{project.name}</a></h2>
				<p>{project.purpose}</p>
			</div>
		{/each}
	</div>
</div>

<style>
	/* Add your styles here */
</style>
