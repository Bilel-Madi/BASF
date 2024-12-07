<!-- src/routes/zones/+page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import ZoneCard from '$lib/components/cards/ZoneCard.svelte';
	import Breadcrumbs from '$lib/components/ui/Breadcrumbs.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	const breadcrumbItems = [{ label: 'Home', href: '/' }, { label: 'Zones' }];

	// Access zones and project data from page data
	export let data: {
		zones: any[];
		project: any;
	};
</script>

<div class="page-container">
	<Breadcrumbs items={breadcrumbItems} />
	<div class="header">
		<h1 class="title">Zones</h1>
		{#if $page.data.user?.role !== 'VIEWER'}
			<a href="/zones/add" class="add-button">
				<Button text="Add" />
			</a>
		{/if}
	</div>

	<div class="grid-container">
		{#each data.zones as zone}
			<ZoneCard {zone} project={data.project} />
		{/each}
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
</style>
