<script lang="ts">
	import type { Device } from '$lib/types';

	export let devices: Device[] = [];
	export let availableReadings: string[] = [];
	export let selectedDevices: string[] = [];
	export let selectedReadings: string[] = [];

	function toggleDevice(deviceId: string) {
		if (selectedDevices.includes(deviceId)) {
			selectedDevices = selectedDevices.filter((id) => id !== deviceId);
		} else {
			selectedDevices = [...selectedDevices, deviceId];
		}
	}

	function toggleReading(reading: string) {
		if (selectedReadings.includes(reading)) {
			selectedReadings = selectedReadings.filter((r) => r !== reading);
		} else {
			selectedReadings = [...selectedReadings, reading];
		}
	}
</script>

<div class="controls-container">
	<div class="control-group">
		<h3>Devices</h3>
		{#each devices as device}
			<label class="checkbox-label">
				<input
					type="checkbox"
					checked={selectedDevices.includes(device.eui)}
					on:change={() => toggleDevice(device.eui)}
				/>
				{device.name}
			</label>
		{/each}
	</div>

	<div class="control-group">
		<h3>Readings</h3>
		{#each availableReadings as reading}
			<label class="checkbox-label">
				<input
					type="checkbox"
					checked={selectedReadings.includes(reading)}
					on:change={() => toggleReading(reading)}
				/>
				{reading}
			</label>
		{/each}
	</div>
</div>

<style>
	.controls-container {
		display: flex;
		gap: 2rem;
		margin-bottom: 1rem;
	}

	.control-group {
		flex: 1;
	}

	.checkbox-label {
		display: block;
		margin: 0.5rem 0;
		cursor: pointer;
	}

	h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1rem;
		font-weight: 600;
	}
</style>
