<!-- src/routes/devices/[deviceId]/+page.svelte -->

<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { error } from '@sveltejs/kit';
	import Breadcrumbs from '$lib/components/ui/Breadcrumbs.svelte';
	import BatteryIcon from '$lib/components/icons/BatteryIcon.svelte';
	import SignalIcon from '$lib/components/icons/SignalIcon.svelte';
	import type { PageLoad } from './$types';

	export let data;

	const breadcrumbItems = [
		{ label: 'Home', href: '/' },
		{ label: 'Devices', href: '/devices' },
		{ label: data.device.name }
	];
</script>

<div class="page-container">
	<Breadcrumbs items={breadcrumbItems} />
	<div class="header">
		<h1 class="title">{data.device.name}</h1>
	</div>

	<div class="device-details">
		<p><strong>EUI:</strong> {data.device.eui}</p>
		<p><strong>Type:</strong> {data.device.type}</p>
		<p><strong>Zone:</strong> {data.device.zone.name}</p>
		<p><strong>Last Seen:</strong> {new Date(data.device.last_seen).toLocaleString()}</p>
		<div class="battery-signal">
			<BatteryIcon level={data.device.battery_status} />
			<SignalIcon strength={data.device.snr} label="SNR" />
			<SignalIcon strength={data.device.rssi} label="RSSI" />
		</div>

		<!-- Latest Readings -->
		<div class="latest-readings">
			{#if data.device.type === 'CO2_SENSOR'}
				<h2>Latest Readings</h2>
				<p><strong>CO₂:</strong> {data.device.latest_co2} ppm</p>
				<p><strong>Humidity:</strong> {data.device.latest_humidity}%</p>
				<p><strong>Pressure:</strong> {data.device.latest_pressure} hPa</p>
				<p><strong>Temperature:</strong> {data.device.latest_temperature}°C</p>
			{:else if data.device.type === 'SOIL_MOISTURE'}
				<h2>Latest Readings</h2>
				<p><strong>EC:</strong> {data.device.latest_ec} µS/cm</p>
				<p><strong>Moisture:</strong> {data.device.latest_moisture}%</p>
				<p><strong>Temperature:</strong> {data.device.latest_soil_temperature}°C</p>
			{/if}
		</div>
	</div>
</div>

<style>
	/* Add your styles here */
</style>
