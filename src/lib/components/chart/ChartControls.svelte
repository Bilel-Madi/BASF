<!-- src/lib/components/chart/ChartControls.svelte -->

<script lang="ts">
	import type { Device } from '@prisma/client';
	import { clickOutside } from '$lib/actions/clickOutside';
	import { DEVICE_READINGS } from '$lib/constants/deviceReadings';
	import { createEventDispatcher } from 'svelte';

	export let devices: Device[] = [];
	export let selectedDevices: Device[] = [];
	export let selectedReadings: string[] = [];
	export let timeFrame: string;
	export let timeFrames: string[] = [];

	let isDeviceDropdownOpen = false;
	let isReadingDropdownOpen = false;
	let searchQuery = '';

	const deviceImagePath = {
		SOIL_MOISTURE: '/images/soil.png',
		CO2_SENSOR: '/images/co2_sensor.png',
		UNKNOWN: '/images/unknown_device.png'
	};

	// Get available readings based on selected devices
	$: availableReadings = [
		...new Set(
			selectedDevices.flatMap(
				(device) => DEVICE_READINGS[device.type as keyof typeof DEVICE_READINGS] || []
			)
		)
	];

	function toggleDevice(device: Device) {
		selectedDevices = selectedDevices.includes(device)
			? selectedDevices.filter((d) => d !== device)
			: [...selectedDevices, device];

		// Dispatch event when devices change
		dispatch('selectionChange');
	}

	function toggleReading(reading: string) {
		selectedReadings = selectedReadings.includes(reading)
			? selectedReadings.filter((r) => r !== reading)
			: [...selectedReadings, reading];

		// Dispatch event when readings change
		dispatch('selectionChange');
	}

	$: filteredDevices = devices.filter(
		(device) =>
			device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			device.eui.toLowerCase().includes(searchQuery.toLowerCase())
	);

	const dispatch = createEventDispatcher();

	function handleTimeFrameChange(frame: string) {
		timeFrame = frame;
		dispatch('timeFrameChange', frame);
	}
</script>

<div class="controls-container">
	<div class="left-controls">
		<div class="selectors">
			<div class="select-wrapper">
				<button
					class="dropdown-trigger"
					on:click={() => (isDeviceDropdownOpen = !isDeviceDropdownOpen)}
				>
					Devices ({selectedDevices.length})
				</button>

				{#if isDeviceDropdownOpen}
					<div
						class="dropdown-menu"
						use:clickOutside
						on:outclick={() => (isDeviceDropdownOpen = false)}
					>
						<div class="search-container">
							<input type="text" placeholder="Search devices..." bind:value={searchQuery} />
						</div>

						<div class="device-list">
							{#each filteredDevices as device}
								<div
									class="device-item"
									class:selected={selectedDevices.find((d) => d.eui === device.eui)}
									on:click={() => toggleDevice(device)}
								>
									<div class="device-image">
										<img
											src={deviceImagePath[device.type] || deviceImagePath.UNKNOWN}
											alt={device.type}
										/>
									</div>
									<div class="device-info">
										<span class="device-name">{device.name}</span>
										<span class="device-eui">{device.eui}</span>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>

			<div class="select-wrapper">
				<button
					class="dropdown-trigger"
					on:click={() => (isReadingDropdownOpen = !isReadingDropdownOpen)}
					disabled={selectedDevices.length === 0}
				>
					Readings ({selectedReadings.length})
				</button>

				{#if isReadingDropdownOpen}
					<div
						class="dropdown-menu"
						use:clickOutside
						on:outclick={() => (isReadingDropdownOpen = false)}
					>
						<div class="reading-list">
							{#each availableReadings as reading}
								<div
									class="device-item"
									class:selected={selectedReadings.includes(reading.value)}
									on:click={() => toggleReading(reading.value)}
								>
									<div class="reading-info">
										<span class="reading-name">{reading.label}</span>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<div class="time-controls">
		{#each timeFrames as frame}
			<button class:selected={timeFrame === frame} on:click={() => handleTimeFrameChange(frame)}>
				{frame}
			</button>
		{/each}
	</div>
</div>

<style>
	.controls-container {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.left-controls {
		display: flex;
		gap: 1rem;
	}

	.selectors {
		display: flex;
		gap: 0.5rem;
	}

	.select-wrapper {
		position: relative;
	}

	.dropdown-trigger {
		padding: 0.5rem 1rem;
		background: white;
		border: 1px solid #ddd;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.875rem;
	}

	.dropdown-trigger:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.dropdown-menu {
		position: absolute;
		top: 100%;
		left: 0;
		width: 300px;
		background: white;
		border: 1px solid #ddd;
		border-radius: 4px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		z-index: 1000;
	}

	.search-container {
		padding: 0.5rem;
		border-bottom: 1px solid #ddd;
	}

	.search-container input {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 0.875rem;
	}

	.device-list {
		max-height: 300px;
		overflow-y: auto;
	}

	.device-item {
		display: grid;
		grid-template-columns: 60px 1fr;
		gap: 0.5rem;
		padding: 0.5rem;
		cursor: pointer;
		border-bottom: 1px solid #f5f5f5;
	}

	.device-item:hover {
		background: #f5f5f5;
	}

	.device-item.selected {
		background: #e3f2fd;
	}

	.device-image {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.device-image img {
		width: 40px;
		height: 40px;
		object-fit: contain;
	}

	.device-info {
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	.device-name {
		font-weight: 500;
		font-size: 0.875rem;
	}

	.device-eui {
		font-size: 0.75rem;
		color: #666;
	}

	.tabs {
		display: flex;
		border-bottom: 1px solid #ddd;
	}

	.tabs button {
		flex: 1;
		padding: 0.5rem;
		background: none;
		border: none;
		cursor: pointer;
		font-size: 0.875rem;
		color: #666;
	}

	.tabs button.active {
		color: #1b0ab1;
		border-bottom: 2px solid #1b0ab1;
	}

	.reading-list {
		max-height: 300px;
		overflow-y: auto;
	}

	.reading-info {
		padding: 0.5rem;
		display: flex;
		align-items: center;
	}

	.reading-name {
		font-size: 0.875rem;
		font-weight: 500;
	}

	.time-controls {
		display: flex;
		gap: 0.25rem;
	}

	.time-controls button {
		padding: 0.25rem 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		background: white;
		cursor: pointer;
		font-size: 0.8rem;
	}

	.time-controls button.selected {
		background: #1b0ab1;
		color: white;
		border-color: #1b0ab1;
	}
</style>
