<!-- src/lib/components/DeviceCard.svelte -->
<script lang="ts">
	import BatteryIcon from '$lib/components/icons/BatteryIcon.svelte';
	import SignalIcon from '$lib/components/icons/SignalIcon.svelte';
	import type { DeviceWithZone } from '$lib/types'; // Define this type in a separate file if needed

	export let device: DeviceWithZone;
	export let getStatus: (receivedAt: string) => 'green' | 'red';
	export let getBatteryLevel: (batteryStatus: number | null) => number;
	export let timeSinceLastMessage: (receivedAt: string) => number;
	export let formatTimeSince: (minutes: number) => string;
</script>

<a href={`/devices/${device.id}`} class="card-link">
	<div class="card">
		<div class="card-header">
			<h2 class="device-name">{device.name}</h2>
			<span
				class="status-light {getStatus(device.last_seen.toISOString())}"
				aria-label={getStatus(device.last_seen.toISOString()) === 'green' ? 'Online' : 'Offline'}
			/>
		</div>
		<p><strong>EUI:</strong> {device.eui}</p>
		<div class="latest-readings">
			{#if device.type === 'CO2_SENSOR'}
				<p><strong>CO₂:</strong> {device.latest_co2} ppm</p>
				<p><strong>Humidity:</strong> {device.latest_humidity}%</p>
				<p><strong>Pressure:</strong> {device.latest_pressure} hPa</p>
				<p><strong>Temp:</strong> {device.latest_temperature}°C</p>
			{:else if device.type === 'SOIL_MOISTURE'}
				<p><strong>EC:</strong> {device.latest_ec} µS/cm</p>
				<p><strong>Moisture:</strong> {device.latest_moisture}%</p>
				<p><strong>Temp:</strong> {device.latest_soil_temperature}°C</p>
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

<style>
	.card-link {
		text-decoration: none;
		color: inherit;
	}

	.card {
		background: #ffffff;
		border-radius: 12px;
		box-shadow: 0 6px 12px rgba(0, 0, 0, 0.05);
		padding: 1.5rem;
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
		margin-bottom: 1rem;
	}

	.device-name {
		font-size: 1.4rem;
		font-weight: 600;
		margin: 0;
		color: #222;
	}

	.status-light {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		display: inline-block;
		margin-top: 4px;
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
		margin-top: 1rem;
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
</style>
