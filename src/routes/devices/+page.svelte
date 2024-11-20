<!-- src/routes/devices/+page.svelte -->

<script lang="ts">
	import { onMount } from 'svelte';
	import socket from '$lib/socket';
	import Button from '$lib/components/ui/Button.svelte';
	import Breadcrumbs from '$lib/components/ui/Breadcrumbs.svelte';
	import DeviceCard from '$lib/components/cards/DeviceCard.svelte';
	import type { Device, Zone } from '@prisma/client';

	export let data: { devices: DeviceWithZoneWithReadings[] };

	interface DeviceWithZoneWithReadings extends Device {
		zone: Zone;
		latest_co2?: number;
		latest_humidity?: number;
		latest_pressure?: number;
		latest_temperature?: number;
		latest_ec?: number;
		latest_moisture?: number;
		latest_soil_temperature?: number;
		mainReadings: number[];
	}

	const breadcrumbItems = [{ label: 'Home', href: '/' }, { label: 'Devices' }];
</script>

<div class="page-container">
	<Breadcrumbs items={breadcrumbItems} />
	<div class="header">
		<h1 class="title">Devices</h1>
		<a href="/devices/add" class="no-underline">
			<Button text="Add Device" />
		</a>
	</div>

	<div class="grid-container">
		{#each data.devices as device}
			<DeviceCard {device} />
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
		margin: 2.5rem 0 3rem;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid var(--border-color, #eaeaea);
	}

	.title {
		font-size: 1.75rem;
		font-weight: 500;
		letter-spacing: -0.02em;
		color: var(--text-primary, #111);
	}

	.grid-container {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 2rem;
		align-items: start;
	}

	.no-underline {
		text-decoration: none;
	}

	@media (max-width: 768px) {
		.page-container {
			padding: 1.5rem;
		}

		.header {
			margin: 1.5rem 0 2rem;
		}

		.grid-container {
			gap: 1.5rem;
		}
	}
</style>
