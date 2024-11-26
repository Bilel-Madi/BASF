<script lang="ts">
	import Breadcrumbs from '$lib/components/ui/Breadcrumbs.svelte';
	import { formatDate } from '$lib/utils/date';

	export let data;
	const { organization, stats } = data;

	const breadcrumbItems = [{ label: 'Home', href: '/' }, { label: 'Organization' }];
</script>

<div class="page-container">
	<Breadcrumbs items={breadcrumbItems} />

	<div class="header">
		<h1 class="title">{organization.name}</h1>
		<div class="subscription-badge" class:pro={organization.subscriptionStatus === 'PRO'}>
			{organization.subscriptionStatus}
		</div>
	</div>

	<div class="stats-grid">
		<div class="stat-card">
			<h3>Projects</h3>
			<div class="stat-value">{stats.projectCount}</div>
			<div class="limit-text">
				{stats.projectCount}/{organization.maxProjects} used
			</div>
		</div>

		<div class="stat-card">
			<h3>Zones</h3>
			<div class="stat-value">{stats.zoneCount}</div>
			<div class="limit-text">
				{stats.zoneCount}/{organization.maxZones} used
			</div>
		</div>

		<div class="stat-card">
			<h3>Devices</h3>
			<div class="stat-value">{stats.deviceCount}</div>
			<div class="limit-text">
				{stats.deviceCount}/{organization.maxDevices} used
			</div>
		</div>
	</div>

	{#if organization.subscriptionEndDate}
		<div class="subscription-info">
			<p>Subscription ends: {formatDate(organization.subscriptionEndDate)}</p>
		</div>
	{/if}
</div>

<style>
	.page-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	.header {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin: 2rem 0;
	}

	.title {
		font-size: 2rem;
		font-weight: 500;
	}

	.subscription-badge {
		padding: 0.5rem 1rem;
		border-radius: 2rem;
		background: #e2e8f0;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.subscription-badge.pro {
		background: #818cf8;
		color: white;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 2rem;
		margin: 2rem 0;
	}

	.stat-card {
		background: white;
		padding: 2rem;
		border-radius: 1rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.stat-value {
		font-size: 2.5rem;
		font-weight: 600;
		color: #2563eb;
		margin: 1rem 0;
	}

	.limit-text {
		font-size: 0.875rem;
		color: #64748b;
	}

	.subscription-info {
		margin-top: 2rem;
		padding: 1rem;
		background: #f8fafc;
		border-radius: 0.5rem;
	}

	@media (max-width: 768px) {
		.stats-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
