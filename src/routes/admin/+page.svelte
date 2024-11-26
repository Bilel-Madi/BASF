<script lang="ts">
	import { formatDate } from '$lib/utils/date';
	import { enhance } from '$app/forms';

	export let data;
	const { organizations } = data;

	async function updateUserRole(userId: string, role: string, orgId: string) {
		try {
			const res = await fetch('/api/admin/update-user-role', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId, role })
			});

			if (!res.ok) {
				throw new Error('Failed to update role');
			}

			// Refresh the page to show updated data
			window.location.reload();
		} catch (error) {
			console.error('Error updating user role:', error);
			// You might want to add some error handling UI here
		}
	}

	async function updateSubscription(orgId: string, status: string) {
		const res = await fetch('/api/admin/update-subscription', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ organizationId: orgId, status })
		});

		if (res.ok) {
			// Refresh the page to show updated data
			window.location.reload();
		}
	}
</script>

<div class="admin-container">
	<h1>Admin Dashboard</h1>

	<div class="org-grid">
		{#each organizations as org}
			<div class="org-card">
				<div class="org-header">
					<h2>{org.name}</h2>
					<select
						value={org.subscriptionStatus}
						on:change={(e) => updateSubscription(org.id, e.target.value)}
						class="subscription-select"
					>
						<option value="FREE">FREE</option>
						<option value="BASIC">BASIC</option>
						<option value="PRO">PRO</option>
						<option value="ENTERPRISE">ENTERPRISE</option>
					</select>
				</div>

				<div class="stats-grid">
					<div class="stat">
						<span class="label">Projects</span>
						<span class="value">{org._count.Project}/{org.maxProjects}</span>
					</div>
					<div class="stat">
						<span class="label">Zones</span>
						<span class="value">{org._count.zones}/{org.maxZones}</span>
					</div>
					<div class="stat">
						<span class="label">Devices</span>
						<span class="value">{org._count.devices}</span>
					</div>
					<div class="stat">
						<span class="label">Users</span>
						<span class="value">{org._count.users}</span>
					</div>
				</div>

				{#if org.subscriptionEndDate}
					<div class="subscription-info">
						<span class="label">Subscription ends:</span>
						<span class="value">{formatDate(org.subscriptionEndDate)}</span>
					</div>
				{/if}

				<div class="users-section">
					<h3>Users</h3>
					<div class="users-list">
						{#each org.users as user}
							<div class="user-item">
								<span>{user.firstName} {user.lastName}</span>
								<select
									value={user.role}
									on:change={(e) => updateUserRole(user.id, e.target.value, org.id)}
									class="role-select"
								>
									<option value="USER">USER</option>
									<option value="ADMIN">ADMIN</option>
									<option value="VIEWER">VIEWER</option>
									<option value="SUPER_ADMIN">SUPER_ADMIN</option>
								</select>
							</div>
						{/each}
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.admin-container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 2rem;
	}

	h1 {
		font-size: 2rem;
		margin-bottom: 2rem;
	}

	.org-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
		gap: 2rem;
	}

	.org-card {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.org-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
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
		grid-template-columns: repeat(4, 1fr);
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.stat {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.label {
		font-size: 0.875rem;
		color: #64748b;
	}

	.value {
		font-size: 1.25rem;
		font-weight: 500;
		color: #1e293b;
	}

	.subscription-info {
		padding: 1rem;
		background: #f8fafc;
		border-radius: 0.5rem;
		margin-bottom: 1.5rem;
	}

	.users-section {
		border-top: 1px solid #e2e8f0;
		padding-top: 1rem;
	}

	.users-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.user-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem;
		background: #f8fafc;
		border-radius: 0.5rem;
	}

	.user-role {
		font-size: 0.875rem;
		color: #64748b;
	}

	.subscription-select,
	.role-select {
		padding: 0.3rem 0.5rem;
		border-radius: 0.5rem;
		border: 1px solid #e2e8f0;
		background: white;
		font-size: 0.875rem;
	}

	.subscription-select {
		margin-left: 1rem;
	}

	.role-select {
		width: 120px;
	}
</style>
