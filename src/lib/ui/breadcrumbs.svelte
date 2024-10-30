<!-- src/lib/components/Breadcrumbs.svelte -->
<script lang="ts">
	import { page } from '$app/stores';
	import { derived } from 'svelte/store';
	import { onMount } from 'svelte';

	// Interface for breadcrumb items
	interface Breadcrumb {
		name: string;
		href: string;
	}

	// Helper function to capitalize words
	const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

	// Derived store to compute breadcrumbs based on the current path
	const breadcrumbs = derived(page, ($page) => {
		const pathSegments = $page.url.pathname.split('/').filter((segment) => segment !== '');
		const breadcrumbList: Breadcrumb[] = [];

		// Always start with Home
		breadcrumbList.push({ name: 'Home', href: '/' });

		let cumulativePath = '';
		pathSegments.forEach((segment, index) => {
			cumulativePath += `/${segment}`;

			// Handle dynamic routes (e.g., device_id)
			// You can customize names based on your route structure
			let name = segment;

			// Example: If the segment is a device_id, fetch the device name
			// For simplicity, we'll keep it as the device_id. To fetch the device name,
			// you'd need to perform an asynchronous operation, which isn't straightforward in a derived store.

			// Capitalize the segment for display
			name = capitalize(segment.replace(/-/g, ' '));

			// If it's the last segment, it's the current page and should not be a link
			if (index === pathSegments.length - 1) {
				breadcrumbList.push({ name, href: '' });
			} else {
				breadcrumbList.push({ name, href: cumulativePath });
			}
		});

		return breadcrumbList;
	});

	export let crumbs: Breadcrumb[] = [];
</script>

<nav aria-label="breadcrumb">
	<ol class="breadcrumb">
		{#each crumbs as crumb, index}
			<li class="breadcrumb-item">
				{#if crumb.href}
					<a href={crumb.href}>{crumb.name}</a>
				{:else}
					<span aria-current="page">{crumb.name}</span>
				{/if}
			</li>
			{#if index < crumbs.length - 1}
				<li class="breadcrumb-separator">/</li>
			{/if}
		{/each}
	</ol>
</nav>

<style>
	.breadcrumb {
		display: flex;
		align-items: center;
		list-style: none;
		padding: 0;
		margin: 20px 0;
		font-size: 0.9rem;
		color: #7f8c8d;
	}

	.breadcrumb-item a {
		text-decoration: none;
		color: #3498db;
		transition: color 0.3s ease;
	}

	.breadcrumb-item a:hover {
		color: #2980b9;
	}

	.breadcrumb-separator {
		margin: 0 8px;
	}
</style>
