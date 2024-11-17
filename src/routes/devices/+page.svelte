<!-- src/routes/devices/+page.svelte -->

<script lang="ts">
	import { onMount } from 'svelte';
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
		<h1 class="title">My Devices</h1>
		<div class="actions">
			<a href="/devices/add" class="no-underline">
				<Button text="＋ Register Device" />
			</a>
		</div>
	</div>

	<div class="grid-container">
		{#each data.devices as device}
			<DeviceCard {device} />
		{/each}
	</div>
</div>

<style>
	.page-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 1rem;
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
		grid-template-columns: repeat(auto-fill, minmax(300px, 350px));
		gap: 1.5rem;
		padding: 1rem 0;
		justify-content: start;
	}

	.card-link {
		text-decoration: none;
		color: inherit;
	}

	.no-underline {
		text-decoration: none;
	}

	@media (max-width: 768px) {
		.header {
			flex-direction: column;
			gap: 1rem;
			align-items: flex-start;
		}
	}
</style>
