<!-- src/routes/zones/+page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import ZoneCard from '$lib/components/cards/ZoneCard.svelte';
	import Breadcrumbs from '$lib/components/ui/Breadcrumbs.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	const breadcrumbItems = [{ label: 'Home', href: '/' }, { label: 'Zones' }];

	// Access zones data from page data
	export let data: { zones: any[] };
</script>

<div class="page-container">
	<Breadcrumbs items={breadcrumbItems} />
	<div class="header">
		<h1 class="title">My Zones</h1>
		<div class="actions">
			<a href="/zones/add">
				<Button text="＋ Add Zone" />
			</a>
		</div>
	</div>

	<!-- Grid of Zone Cards -->
	<div class="grid-container">
		{#each data.zones as zone}
			<ZoneCard {zone} />
		{/each}
	</div>
</div>

<style>
	.page-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.title {
		font-size: 2rem;
		font-weight: 700;
		margin: 0;
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.grid-container {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
		gap: 1.5rem;
	}
</style>
