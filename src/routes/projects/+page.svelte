<!-- src/routes/projects/+page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import Breadcrumbs from '$lib/components/ui/Breadcrumbs.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	let projects = [];

	onMount(async () => {
		const res = await fetch('/api/projects');
		if (res.ok) {
			projects = await res.json();
		}
	});
</script>

<div class="page-container">
	<Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Projects' }]} />
	<div class="header">
		<h1 class="title">Projects</h1>
		<a href="/projects/add" class="add-button">
			<Button text="Add" />
		</a>
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
