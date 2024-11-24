<script lang="ts">
	import type { Device } from '@prisma/client';
	import BatteryIcon from '$lib/components/icons/BatteryIcon.svelte';
	import SignalIcon from '$lib/components/icons/SignalIcon.svelte';
	import StatusDot from '$lib/components/ui/StatusDot.svelte';

	export let selectedDeviceData: Device | null;
	export let isLoading: boolean = false;

	// Helper function to calculate time since last message in minutes
	function timeSinceLastMessage(receivedAt: string): number {
		const receivedDate = new Date(receivedAt);
		const now = new Date();
		const diffMs = now.getTime() - receivedDate.getTime();
		return Math.floor(diffMs / 60000); // Convert milliseconds to minutes
	}

	// Function to determine status color
	function getStatusColor(receivedAt: string): string {
		const minutes = timeSinceLastMessage(receivedAt);
		return minutes < 120 ? '#00d87e' : '#f44336';
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
		return Math.min(Math.max(batteryStatus, 0), 100);
	}
</script>

<div class="card">
	<h2>Device Information</h2>
	{#if isLoading}
		<div class="skeleton-card">
			<div class="device-image-section">
				<div class="skeleton" style="height: 180px;" />
			</div>
			<div class="device-details-section">
				<div class="skeleton skeleton-text" style="width: 100%;" />
				<div class="skeleton skeleton-text" style="width: 100%;" />
			</div>
		</div>
	{:else if selectedDeviceData}
		<div class="device-info-container">
			<div class="device-image-section">
				<div class="status-bar">
					<div class="status-left">
						<StatusDot color={getStatusColor(selectedDeviceData.last_seen)} size="8px" />
						<span class="status-time"
							>{formatTimeSince(timeSinceLastMessage(selectedDeviceData.last_seen))}</span
						>
					</div>
					<div class="status-right">
						<SignalIcon strength={selectedDeviceData.rssi} label="RSSI" />
						<SignalIcon strength={selectedDeviceData.snr} label="SNR" />
						<BatteryIcon level={getBatteryLevel(selectedDeviceData.battery_status)} />
					</div>
				</div>
				<div class="device-preview">
					<img
						src={selectedDeviceData.type === 'SOIL_MOISTURE'
							? '/images/soil.png'
							: selectedDeviceData.type === 'CO2_SENSOR'
							? '/images/co2_sensor.png'
							: '/images/unknown_device.png'}
						alt="Device"
					/>
				</div>
			</div>
			<div class="device-details-section">
				<div class="device-identifier">
					<span class="label">Device ID</span>
					<code class="eui">{selectedDeviceData.eui}</code>
					{#if selectedDeviceData.type === 'SOIL_MOISTURE' && selectedDeviceData.installedDepth}
						<span class="depth">Installed at {selectedDeviceData.installedDepth} cm depth</span>
					{/if}
				</div>
				<div class="device-footer">
					<a href="/devices/{selectedDeviceData.eui}" class="device-link">
						View device details
						<span class="arrow-icon">→</span>
					</a>
				</div>
			</div>
		</div>
	{:else}
		<p>Select a device on the map to view details</p>
	{/if}
</div>

<style>
	/* Copy all the relevant styles from the original file */
	@keyframes shimmer {
		0% {
			background-position: -1000px 0;
		}
		100% {
			background-position: 1000px 0;
		}
	}

	.skeleton {
		background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
		background-size: 1000px 100%;
		animation: shimmer 2s infinite linear;
		border-radius: 8px;
		width: 100%;
	}

	.skeleton-text {
		height: 1rem;
		border-radius: 4px;
		margin: 0.5rem 0;
	}

	.skeleton-card {
		background: white;
		border: 1px solid #d8d8d8;
		height: 100%;
		overflow: hidden;
	}

	.card {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	h2 {
		padding: 0.75rem 1rem;
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		border-bottom: 1px solid rgba(0, 0, 0, 0.1);
	}

	.device-info-container {
		display: flex;
		flex-direction: column;
		height: calc(100% - 2.5rem);
		position: relative;
	}

	.device-image-section {
		display: flex;
		flex-direction: column;
		background: #eef5f3;
		border-radius: 15px;
		padding: 0.5rem;
		width: 95%;
		margin: 0.5rem auto;
		min-height: 180px;
		position: relative;
	}

	.status-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.25rem 0.5rem;
		font-size: 0.8rem;
	}

	.status-left,
	.status-right {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.status-time {
		color: #666;
	}

	.device-preview {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -45%);
		width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.device-preview img {
		width: 80px;
		height: auto;
	}

	.device-footer {
		position: absolute;
		bottom: 0;
		right: 1rem;
		padding: 0.5rem;
	}

	.device-link {
		color: rgb(0, 20, 136);
		text-decoration: none;
		font-size: 0.875rem;
		display: flex;
		align-items: center;
	}

	.device-link:hover {
		text-decoration: underline;
		color: rgb(0, 100, 200);
	}

	.arrow-icon {
		margin-left: 0.5rem;
		transition: transform 0.2s;
	}

	.device-link:hover .arrow-icon {
		transform: translateX(4px);
	}

	.device-details-section {
		padding: 1rem;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.25rem;
		width: 100%;
		padding: 0 0.5rem;
	}

	.device-identifier {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.25rem;
		width: 100%;
		padding: 0 0.5rem;
	}

	.label {
		font-size: 0.75rem;
		color: #666;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	code.eui {
		font-family: ui-monospace, monospace;
		font-size: 0.875rem;
		color: #333;
		background: rgba(0, 0, 0, 0.05);
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		width: 100%;
	}

	.depth {
		font-size: 0.75rem;
		color: #666;
		width: 100%;
	}

	.status-right {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		transform: scale(0.8);
		transform-origin: right center;
	}
</style>
