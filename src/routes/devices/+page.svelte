<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import Breadcrumbs from '$lib/ui/breadcrumbs.svelte';

	// Define the structure of a device for better TypeScript support
	interface Device {
		device_id: string;
		name?: string;
	}

	let devices: Device[] = [];

	onMount(async () => {
		try {
			const res = await fetch('/api/devices');
			if (res.ok) {
				devices = await res.json();
			} else {
				const error = await res.json();
				alert('Error fetching devices: ' + error.message);
			}
		} catch (err) {
			console.error('Fetch error:', err);
			alert('An unexpected error occurred while fetching devices.');
		}
	});

	const crumbs = [
		{ name: 'Home', href: '/' },
		{ name: 'Devices', href: '/devices' }
	];
</script>

<main>
	<Breadcrumbs {crumbs} />
	<header>
		<h1>Devices</h1>
		<a class="add-button" href="/devices/new/edit">Add New Device</a>
	</header>

	{#if devices.length > 0}
		<ul class="device-list">
			{#each devices as device}
				<li class="device-item">
					<div class="device-info">
						<a class="device-link" href="/devices/{device.device_id}">
							<span class="device-id">{device.device_id}</span>
							<span class="device-name">{device.name || 'Unnamed Device'}</span>
						</a>
					</div>
					<div class="device-actions">
						<a class="edit-link" href="/devices/{device.device_id}/edit">Edit</a>
					</div>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="no-devices">No devices found. <a href="/devices/new/edit">Add a new device</a>.</p>
	{/if}
</main>

<style>
	/* Reset some default styles for consistency across browsers */
	* {
		box-sizing: border-box;
		margin: 0;
		padding: 0;
	}

	/* Base styles for the main container */
	main {
		max-width: 900px;
		margin: 50px auto;
		padding: 0 20px;
		font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
		color: #333;
	}

	/* Header styling */
	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 40px;
	}

	h1 {
		font-size: 2.5rem;
		font-weight: 600;
		color: #2c3e50;
	}

	/* Add button styling */
	.add-button {
		background-color: #3498db;
		color: #fff;
		padding: 10px 20px;
		text-decoration: none;
		border-radius: 5px;
		font-size: 1rem;
		transition: background-color 0.3s ease;
	}

	.add-button:hover {
		background-color: #2980b9;
	}

	/* Device list styling */
	.device-list {
		list-style: none;
	}

	.device-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 15px 20px;
		background-color: #f9f9f9;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		margin-bottom: 15px;
		transition: background-color 0.3s ease, box-shadow 0.3s ease;
	}

	.device-item:hover {
		background-color: #f1f1f1;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
	}

	.device-info {
		flex: 1;
	}

	.device-link {
		text-decoration: none;
		color: #34495e;
		display: flex;
		flex-direction: column;
	}

	.device-id {
		font-weight: bold;
		font-size: 1.1rem;
		margin-bottom: 5px;
	}

	.device-name {
		font-size: 0.95rem;
		color: #7f8c8d;
	}

	.device-actions {
		margin-left: 20px;
	}

	.edit-link {
		background-color: #2ecc71;
		color: #fff;
		padding: 8px 16px;
		text-decoration: none;
		border-radius: 5px;
		font-size: 0.9rem;
		transition: background-color 0.3s ease;
	}

	.edit-link:hover {
		background-color: #27ae60;
	}

	.no-devices {
		font-size: 1rem;
		color: #7f8c8d;
		text-align: center;
		margin-top: 20px;
	}

	.no-devices a {
		color: #3498db;
		text-decoration: none;
		font-weight: bold;
	}

	.no-devices a:hover {
		text-decoration: underline;
	}

	/* Responsive design */
	@media (max-width: 600px) {
		header {
			flex-direction: column;
			align-items: flex-start;
		}

		.add-button {
			margin-top: 15px;
			width: 100%;
			text-align: center;
		}

		.device-item {
			flex-direction: column;
			align-items: flex-start;
		}

		.device-actions {
			margin-left: 0;
			margin-top: 10px;
		}
	}
</style>
