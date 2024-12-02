<!-- src/lib/components/LastActivity.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import StatusDot from '$lib/components/ui/StatusDot.svelte';

	let lastActivity: Date | null = null;
	let loading = true;
	let error = '';

	onMount(async () => {
		try {
			// Get the project slug from the URL if we're on a public page
			const projectSlug = $page.params.slug;
			const queryParam = projectSlug ? `?projectSlug=${projectSlug}` : '';

			const response = await fetch(`/api/devices/last-activity${queryParam}`);
			if (response.ok) {
				const data = await response.json();
				if (data.last_seen) {
					lastActivity = new Date(data.last_seen);
				} else {
					error = 'No activity data available.';
				}
			} else {
				error = 'Failed to fetch last activity.';
			}
		} catch (err) {
			error = 'Error fetching last activity.';
			console.error('Error fetching last activity:', err);
		} finally {
			loading = false;
		}
	});
</script>

<div class="last-activity">
	{#if loading}
		<p>Loading...</p>
	{:else if error}
		<p class="error">{error}</p>
	{:else if lastActivity}
		<div class="activity-info">
			<span class="activity-time">{lastActivity.toLocaleString()}</span>
			<span class="status-dot-space" />
			<StatusDot />
		</div>
	{:else}
		<p>No recent activity.</p>
	{/if}
</div>

<style>
	.last-activity {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 0.5rem;
		margin-right: 1rem;
	}

	.activity-info {
		display: flex;
		align-items: center;
	}

	.activity-time {
		margin-right: 0rem;
		font-size: 0.9rem;
	}

	.status-dot-space {
		width: 1rem;
	}

	h4 {
		margin: 0;
	}

	p {
		margin: 0;
	}

	.error {
		color: red;
	}
</style>
