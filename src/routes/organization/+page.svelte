<script lang="ts">
	import Breadcrumbs from '$lib/components/ui/Breadcrumbs.svelte';
	import { formatDate } from '$lib/utils/date';
	import { enhance } from '$app/forms';

	export let data;
	const { organization, stats } = data;

	let inviteEmail = '';

	const breadcrumbItems = [{ label: 'Home', href: '/' }, { label: 'Organization' }];

	async function handleInvite() {
		try {
			const response = await fetch('/api/organization/invite', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ email: inviteEmail })
			});

			if (!response.ok) {
				throw new Error('Failed to send invitation');
			}

			inviteEmail = ''; // Clear the input after successful invitation
			alert('Invitation sent successfully!');
		} catch (error) {
			console.error('Error sending invitation:', error);
			alert('Failed to send invitation. Please try again.');
		}
	}
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

	<div class="invite-section">
		<h2>Invite Team Member</h2>
		<div class="invite-form">
			<div class="form-group">
				<label for="inviteEmail">Email Address</label>
				<input
					type="email"
					id="inviteEmail"
					bind:value={inviteEmail}
					placeholder="Enter email address"
				/>
			</div>
			<button class="invite-button" on:click={handleInvite}> Send Invitation </button>
		</div>
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

	.invite-section {
		margin-top: 3rem;
		background: white;
		padding: 2rem;
		border-radius: 1rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.invite-form {
		margin-top: 1rem;
		display: flex;
		gap: 1rem;
		align-items: flex-end;
	}

	.form-group {
		flex: 1;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
		color: #64748b;
	}

	.form-group input {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		font-size: 1rem;
	}

	.invite-button {
		padding: 0.5rem 1rem;
		background: #2563eb;
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-size: 1rem;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.invite-button:hover {
		background: #1d4ed8;
	}

	@media (max-width: 768px) {
		.stats-grid {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 640px) {
		.invite-form {
			flex-direction: column;
			gap: 1rem;
		}

		.invite-button {
			width: 100%;
		}
	}

	.invite-code-container {
		margin-top: 1rem;
	}

	.code-display {
		display: flex;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.code-display input {
		flex: 1;
		padding: 0.5rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		font-size: 1rem;
		background: #f8fafc;
	}

	.copy-button {
		padding: 0.5rem 1rem;
		background: #64748b;
		color: white;
		border: none;
		border-radius: 0.5rem;
		cursor: pointer;
	}

	.generate-button {
		width: 100%;
		padding: 0.5rem 1rem;
		background: #2563eb;
		color: white;
		border: none;
		border-radius: 0.5rem;
		cursor: pointer;
	}
</style>
