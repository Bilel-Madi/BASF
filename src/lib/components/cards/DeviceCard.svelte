<!-- src/lib/components/DeviceCard.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import MiniLineChart from '$lib/components/MiniChart/MiniLineChart.svelte';
	import BatteryIcon from '$lib/components/icons/BatteryIcon.svelte';
	import SignalIcon from '$lib/components/icons/SignalIcon.svelte';
	import type { Device } from '@prisma/client';

	export let device: Device;

	// Reactive variables for historical data
	let historicalData: Array<any> = [];
	let isLoading: boolean = true;
	let error: string | null = null;

	// Function to calculate time since last message in minutes
	function timeSinceLastMessage(receivedAt: Date | null): number {
		if (!receivedAt) return Infinity;
		const receivedDate = new Date(receivedAt);
		const now = new Date();
		const diffMs = now.getTime() - receivedDate.getTime();
		return Math.floor(diffMs / 60000); // Convert milliseconds to minutes
	}

	// Function to determine status (green or red)
	function getStatus(receivedAt: Date | null): 'green' | 'red' {
		const minutes = timeSinceLastMessage(receivedAt);
		return minutes < 120 ? 'green' : 'red';
	}

	// Function to format time since last message
	function formatTimeSince(minutes: number): string {
		if (minutes === Infinity) return 'Never';
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
				return '#ede61f'; // Yellow-ish color for CO₂
			case 'SOIL_MOISTURE':
				return '#1f52ed'; // Blue-ish color for moisture
			default:
				return '#15fdb7'; // Default color
		}
	}

	// Fetch historical data on component mount
	onMount(async () => {
		try {
			const response = await fetch(`/api/devices/${device.eui}/data?range=1d`);
			if (!response.ok) {
				throw new Error('Failed to fetch historical data');
			}
			const data = await response.json();
			historicalData = data.map((entry: any) => ({
				x: new Date(entry.receivedAt),
				y:
					device.type === 'CO2_SENSOR'
						? entry.co2
						: device.type === 'SOIL_MOISTURE'
						? entry.moisture
						: null
			}));
			isLoading = false;
		} catch (err: any) {
			console.error(err);
			error = err.message || 'An error occurred while fetching data.';
			isLoading = false;
		}
	});
</script>

<a href={`/devices/${device.eui}`} class="card-link">
	<div class="card">
		<div class="card-header">
			<h2 class="device-name">{device.name}</h2>
			<span
				class="status-light {getStatus(device.last_seen)}"
				aria-label={getStatus(device.last_seen) === 'green' ? 'Online' : 'Offline'}
			/>
		</div>
		<p class="eui-text"><strong>EUI:</strong> {device.eui}</p>
		<div class="chart-container">
			{#if isLoading}
				<p>Loading chart...</p>
			{:else if error}
				<p style="color: red;">{error}</p>
			{:else if historicalData.length > 0}
				<div class="main-reading">
					{#if device.type === 'CO2_SENSOR'}
						<p><strong>CO₂:</strong> {device.latest_co2} ppm</p>
					{:else if device.type === 'SOIL_MOISTURE'}
						<p><strong>Moisture:</strong> {device.latest_moisture}%</p>
					{/if}
				</div>
				<MiniLineChart
					data={historicalData}
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
				Last seen: {formatTimeSince(timeSinceLastMessage(device.last_seen))}
			</p>
		</div>
	</div>
</a>

<style>
	.card-link {
		text-decoration: none;
		color: inherit;
	}

	.card {
		background: #ffffff;
		border-radius: 12px;
		box-shadow: 0 6px 12px rgba(0, 0, 0, 0.05);
		padding: 1rem;
		transition: transform 0.3s, box-shadow 0.3s;
		border: 1px solid #e0e0e0;
		display: flex;
		flex-direction: column;
		height: 100%;
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
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0;
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

	.eui-text {
		font-size: 0.85rem;
		font-family: monospace;
		color: #666;
		margin: 0.5rem 0;
	}

	.chart-container {
		position: relative;
		width: 100%;
	}

	.main-reading {
		font-weight: 700;
		font-size: 1rem;
		margin: 0.5rem 0;
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

	.last-seen {
		font-size: 0.85rem;
		color: #666;
		margin: 0.5rem 0;
	}

	@media (max-width: 768px) {
		.additional-readings {
			grid-template-columns: repeat(2, 1fr);
		}
	}
</style>
