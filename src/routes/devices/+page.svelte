<!-- src/routes/devices/+page.svelte -->

<script lang="ts">
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import Button from '$lib/components/ui/Button.svelte';
	import Breadcrumbs from '$lib/components/ui/Breadcrumbs.svelte';
	import MiniLineChart from '$lib/components/MiniChart/MiniLineChart.svelte';
	import BatteryIcon from '$lib/components/icons/BatteryIcon.svelte';
	import SignalIcon from '$lib/components/icons/SignalIcon.svelte';
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

	// Store for view mode: 'list' or 'grid'
	const viewMode = writable<'list' | 'grid'>('grid');

	// Persist view mode using localStorage
	onMount(() => {
		if (typeof window !== 'undefined') {
			const storedView = localStorage.getItem('viewMode');
			if (storedView === 'list' || storedView === 'grid') {
				viewMode.set(storedView);
			}
		}
	});

	// Only subscribe to changes when in browser
	if (typeof window !== 'undefined') {
		viewMode.subscribe((value) => {
			localStorage.setItem('viewMode', value);
		});
	}

	// Helper function to calculate time since last message in minutes
	function timeSinceLastMessage(receivedAt: string): number {
		const receivedDate = new Date(receivedAt);
		const now = new Date();
		const diffMs = now.getTime() - receivedDate.getTime();
		return Math.floor(diffMs / 60000); // Convert milliseconds to minutes
	}

	// Function to determine status (green or red)
	function getStatus(receivedAt: string): 'green' | 'red' {
		const minutes = timeSinceLastMessage(receivedAt);
		return minutes < 120 ? 'green' : 'red';
	}

	// Function to format time since last message
	function formatTimeSince(minutes: number): string {
		if (minutes < 60) {
			return `${minutes} minutes ago`;
		} else {
			const hours = Math.floor(minutes / 60);
			const remainingMinutes = minutes % 60;
			return `${hours}h ${remainingMinutes}m ago`;
		}
	}

	// Dynamic Battery Level (0-100)
	function getBatteryLevel(batteryStatus: number | null): number {
		if (batteryStatus === null || batteryStatus === undefined) return 0;
		// Assuming battery_status is a percentage
		return Math.min(Math.max(batteryStatus, 0), 100);
	}

	// Color mapping based on device type
	function getColor(deviceType: string): string {
		switch (deviceType) {
			case 'CO2_SENSOR':
				return '#ede61f'; // Red-ish color for CO₂
			case 'SOIL_MOISTURE':
				return '#1f52ed'; // Blue-ish color for moisture
			default:
				return '#15fdb7'; // Default color
		}
	}
</script>

<div class="page-container">
	<Breadcrumbs items={breadcrumbItems} />
	<div class="header">
		<h1 class="title">My Devices</h1>
		<div class="actions">
			<a href="/devices/add" class="no-underline">
				<Button text="＋ Register Device" />
			</a>
			<!-- Replace Toggle Buttons with Icons -->
			<div class="view-toggle">
				<button
					class="view-icon-btn {$viewMode === 'list' ? 'active' : ''}"
					on:click={() => viewMode.set('list')}
					aria-label="List View"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<line x1="3" y1="6" x2="21" y2="6" />
						<line x1="3" y1="12" x2="21" y2="12" />
						<line x1="3" y1="18" x2="21" y2="18" />
					</svg>
				</button>
				<button
					class="view-icon-btn {$viewMode === 'grid' ? 'active' : ''}"
					on:click={() => viewMode.set('grid')}
					aria-label="Grid View"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<rect x="3" y="3" width="7" height="7" />
						<rect x="14" y="3" width="7" height="7" />
						<rect x="14" y="14" width="7" height="7" />
						<rect x="3" y="14" width="7" height="7" />
					</svg>
				</button>
			</div>
		</div>
	</div>

	{#if $viewMode === 'list'}
		<div class="table-container">
			<table>
				<thead>
					<tr>
						<th>Name</th>
						<th>EUI</th>
						<th>Type</th>
						<th>Zone</th>
						<th>Battery</th>
						<th>SNR</th>
						<th>RSSI</th>
						<th>Chart</th>
						<!-- New Column for Chart -->
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each data.devices as device}
						<tr>
							<td class="name-cell">{device.name}</td>
							<td>{device.eui}</td>
							<td>{device.type}</td>
							<td>{device.zone.name}</td>
							<td>
								<BatteryIcon level={getBatteryLevel(device.battery_status)} />
							</td>
							<td>
								<SignalIcon strength={device.snr} label="SNR" />
							</td>
							<td>
								<SignalIcon strength={device.rssi} label="RSSI" />
							</td>
							<td>
								{#if device.mainReadings.length > 0}
									<MiniLineChart
										data={device.mainReadings}
										color={getColor(device.type)}
										width={100}
										height={50}
									/>
								{:else}
									<span>No Data</span>
								{/if}
							</td>
							<td>
								<Button text="Edit" variant="google" href={`/devices/${device.eui}`} />
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<div class="grid-container">
			{#each data.devices as device}
				<a href={`/devices/${device.eui}`} class="card-link">
					<div class="card">
						<div class="card-header">
							<h2 class="device-name">{device.name}</h2>
							<span
								class="status-light {getStatus(device.last_seen.toISOString())}"
								aria-label={getStatus(device.last_seen.toISOString()) === 'green'
									? 'Online'
									: 'Offline'}
							/>
						</div>
						<p class="eui-text"><strong>EUI:</strong> {device.eui}</p>
						<div class="chart-container">
							{#if device.mainReadings.length > 0}
								<div class="main-reading">
									{#if device.type === 'CO2_SENSOR'}
										<p><strong>CO₂:</strong> {device.latest_co2} ppm</p>
									{:else if device.type === 'SOIL_MOISTURE'}
										<p><strong>Moisture:</strong> {device.latest_moisture}%</p>
									{/if}
								</div>
								<MiniLineChart
									data={device.mainReadings}
									color={getColor(device.type)}
									width={350}
									height={60}
								/>
							{:else}
								<p>No Data</p>
							{/if}
						</div>
						<div class="additional-readings">
							{#if device.type === 'CO2_SENSOR'}
								<div class="reading">
									<p class="reading-title">Humidity</p>
									<p class="reading-value">{device.latest_humidity}%</p>
								</div>
								<div class="reading">
									<p class="reading-title">Pressure</p>
									<p class="reading-value">{device.latest_pressure} hPa</p>
								</div>
								<div class="reading">
									<p class="reading-title">Temperature</p>
									<p class="reading-value">{device.latest_temperature}°C</p>
								</div>
							{:else if device.type === 'SOIL_MOISTURE'}
								<div class="reading">
									<p class="reading-title">EC</p>
									<p class="reading-value">{device.latest_ec} µS/cm</p>
								</div>
								<div class="reading">
									<p class="reading-title">Temp</p>
									<p class="reading-value">{device.latest_soil_temperature}°C</p>
								</div>
							{/if}
						</div>
						<div class="card-footer">
							<div class="battery-signal">
								<BatteryIcon level={getBatteryLevel(device.battery_status)} />
								<div class="signal-info">
									<SignalIcon strength={device.snr} label="SNR" />
									<SignalIcon strength={device.rssi} label="RSSI" />
								</div>
							</div>
							<p class="last-seen">
								Last seen: {formatTimeSince(timeSinceLastMessage(device.last_seen.toISOString()))}
							</p>
						</div>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>

<style>
	.page-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;

		color: #333;
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
		color: #222;
		margin: 0;
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.toggle-buttons {
		display: flex;
		gap: 0.5rem;
	}

	.table-container {
		background: #ffffff;
		border-radius: 8px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		overflow-x: auto;
		padding: 1rem;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.95rem;
	}

	th {
		text-align: left;
		padding: 0.75rem 1rem;

		color: #555;
		font-weight: 600;
		border-bottom: 2px solid #e0e0e0;
	}

	td {
		padding: 0.75rem 1rem;
		border-bottom: 1px solid #e0e0e0;
		color: #444;
	}

	tr:last-child td {
		border-bottom: none;
	}

	tr:hover {
		background-color: #fafafa;
	}

	/* Make the EUI column text slightly smaller and monospace */
	td:nth-child(2) {
		font-size: 0.85rem;
		font-family: monospace;
	}

	/* Style the type column */
	td:nth-child(3) {
		text-transform: capitalize;
	}

	/* Ensure the action column button doesn't stretch */
	td:last-child {
		width: 120px;
	}

	/* Adjustments for list view */
	.name-cell {
		width: 25%; /* More space for the name */
	}

	/* Grid View Styles */
	.grid-container {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
		padding: 1rem 0;
	}

	.card-link {
		text-decoration: none;
		color: inherit;
	}

	.card {
		background: #ffffff;
		border-radius: 12px;
		box-shadow: 0 6px 12px rgba(0, 0, 0, 0.05);
		padding: 1rem;
		position: relative;
		transition: transform 0.3s, box-shadow 0.3s;
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		border: 1px solid #e0e0e0;
	}

	.card:hover {
		transform: translateY(-5px);
		box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.2rem;
		gap: 0.5rem;
	}

	.device-name {
		font-size: 1rem;
		font-weight: 600;
		margin: 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.status-light {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		display: inline-block;
		margin-top: 0;
	}

	.status-light.green {
		background-color: #4caf50;
		animation: blink 1.5s infinite;
	}

	.status-light.red {
		background-color: #f44336;
	}

	@keyframes blink {
		0% {
			opacity: 1;
		}
		50% {
			opacity: 0.4;
		}
		100% {
			opacity: 1;
		}
	}

	.latest-readings {
		margin: 1rem 0;
		flex-grow: 1;
	}

	.last-seen {
		font-size: 0.85rem;
		color: #666;
		margin-top: 0.5rem;
	}

	.card-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 0.2rem;
	}

	.battery-signal {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.signal-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	/* Responsive Adjustments */
	@media (max-width: 768px) {
		.header {
			flex-direction: column;
			gap: 1rem;
			align-items: flex-start;
		}

		th,
		td {
			padding: 0.5rem 0.75rem;
		}

		.grid-container {
			grid-template-columns: 1fr;
		}

		.card {
			padding: 1rem;
		}

		.device-name {
			font-size: 1rem;
		}

		.last-seen {
			font-size: 0.8rem;
		}
	}

	.view-toggle {
		display: flex;
		gap: 0.25rem;
		padding: 0.25rem;
		background: #f5f5f5;
		border-radius: 6px;
	}

	.view-icon-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem;
		border: none;
		background: none;
		color: #666;
		cursor: pointer;
		border-radius: 4px;
		transition: all 0.2s;
	}

	.view-icon-btn:hover {
		background: #e0e0e0;
		color: #333;
	}

	.view-icon-btn.active {
		background: #fff;
		color: #000;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.mini-chart {
		margin: 1rem 0;
	}

	/* New Styles for Grid View Card */
	.chart-container {
		position: relative;
		width: 100%;
	}

	.main-reading {
		font-weight: 700;
		font-size: 1rem;
		margin: 0.5rem;
		text-align: right;
	}

	.main-reading p {
		font-weight: 600;
	}

	.additional-readings {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.5rem;
		margin-top: 1rem;
		position: relative;
	}

	.additional-readings .reading {
		padding: 0.25rem;
		border-radius: 4px;
		font-size: 0.85rem;
		color: #444;
	}

	.reading-title {
		margin: 0;
		font-weight: 600;
		color: #666;
		font-size: 0.75rem;
	}

	.reading-value {
		margin: 0;
		font-size: 0.9rem;
		font-weight: 500;
	}

	.eui-text {
		font-size: 0.75rem;
		font-family: monospace;
		color: #666;
		margin: 0rem 0;
	}

	.no-underline {
		text-decoration: none;
	}
</style>
