<script lang="ts">
	import { onMount } from 'svelte';
	import { latestDataStore, type LatestDataEntry } from '$lib/stores/latestDataStore';
	import { fetchLatestData } from '$lib/utils/latestDataFetch';
	import { DEVICES, deviceHardcodedNames, deviceImageMapping } from '$lib/devices';
	import { get } from 'svelte/store';

	let latestData: LatestDataEntry[] = [];
	let lastIrrigationEventWatermelon1 = 'Fetching...'; // Add this variable

	onMount(async () => {
		await fetchLatestData();
		latestData = get(latestDataStore);
		await fetchLastIrrigationEvent(); // Call the function to fetch the last irrigation event
	});

	const getSignalStrength = (device_id: string) => {
		return 4; // Adjust according to your logic to get the actual signal strength
	};

	const getStatus = (device_id: string) => {
		return 'Connected';
	};

	const getBatteryStatus = (device_id: string) => {
		return 100;
	};

	const getValveStatus = (valve: number) => {
		return 'Off'; // Hardcoded to 'Off' for both valves
	};

	const getLastIrrigationDate = () => {
		return new Date().toLocaleDateString();
	};

	const removeSoilMoistureSensor = (name: string) => {
		return name.replace(' Soil Moisture Sensor', '');
	};

	const groupedDevices = {
		gateways: ['GATEWAY'],
		sensors: [
			'FIELD_SENSOR2',
			'FIELD_SENSOR3',
			'FIELD_SENSOR4',
			'FIELD_SENSOR5',
			'FIELD_SENSOR6',
			'FIELD_SENSOR7',
			'FIELD_SENSOR8',
			'FIELD_SENSOR9'
		],
		controllers: ['FIELD_CONTROLLER1']
	};

	// Function to fetch last irrigation event from Irrigation.json
	async function fetchLastIrrigationEvent() {
		try {
			const response = await fetch('/Irrigation.json');
			const irrigationData = await response.json();
			const watermelonEvents = irrigationData.filter((event) => event.field === 'Watermelon 1');
			if (watermelonEvents.length > 0) {
				const latestEvent = watermelonEvents.reduce((latest, event) => {
					return new Date(event.startTime) > new Date(latest.startTime) ? event : latest;
				});
				const options = {
					year: 'numeric',
					month: '2-digit',
					day: '2-digit',
					hour: '2-digit',
					minute: '2-digit',
					hour12: false
				};
				const startTime = new Date(latestEvent.startTime).toLocaleString('en-US', options);
				const duration = `${latestEvent.duration} minutes`;
				lastIrrigationEventWatermelon1 = `${duration} on ${startTime}`;
			} else {
				lastIrrigationEventWatermelon1 = 'No Data';
			}
		} catch (error) {
			console.error('Error loading irrigation data:', error);
			lastIrrigationEventWatermelon1 = 'Error';
		}
	}
</script>

<div class="device-list">
	<nav class="breadcrumbs">
		<span>Dashboard</span> &gt; <span>Devices</span>
	</nav>
	<div class="device-category">
		<h2>Gateways</h2>
		<table>
			<thead>
				<tr>
					<th>Image</th>
					<th>Name</th>
					<th>EUI</th>
					<th>Status</th>
					<th>Signal Strength</th>
				</tr>
			</thead>
			<tbody>
				{#each groupedDevices.gateways as deviceID}
					{#if DEVICES[deviceID]}
						<tr>
							<td>
								<img
									src={`/${deviceImageMapping[DEVICES[deviceID]]}`}
									alt={removeSoilMoistureSensor(
										deviceHardcodedNames[DEVICES[deviceID]] || 'Unknown Device'
									)}
								/>
							</td>
							<td>
								<strong
									>{removeSoilMoistureSensor(
										deviceHardcodedNames[DEVICES[deviceID]] || 'Unknown Device'
									)}</strong
								>
							</td>
							<td><strong>{DEVICES[deviceID]}</strong></td>
							<td class="status-connected"><strong>{getStatus(DEVICES[deviceID])}</strong></td>
							<td>
								<div class="signal-strength" title="Signal Strength">
									<div
										class="signal-bar"
										style="height: {getSignalStrength(DEVICES[deviceID]) >= 1 ? '6px' : '2px'};"
									/>
									<div
										class="signal-bar"
										style="height: {getSignalStrength(DEVICES[deviceID]) >= 2 ? '10px' : '2px'};"
									/>
									<div
										class="signal-bar"
										style="height: {getSignalStrength(DEVICES[deviceID]) >= 3 ? '14px' : '2px'};"
									/>
									<div
										class="signal-bar"
										style="height: {getSignalStrength(DEVICES[deviceID]) >= 4 ? '18px' : '2px'};"
									/>
								</div>
							</td>
						</tr>
					{/if}
				{/each}
			</tbody>
		</table>
	</div>

	<div class="device-category">
		<h2>Soil Moisture Sensors</h2>
		<table>
			<thead>
				<tr>
					<th>Image</th>
					<th>Name</th>
					<th>EUI</th>
					<th>Status</th>
					<th><span class="material-symbols-outlined">water_drop</span> Moisture</th>
					<th><span class="material-symbols-outlined">water_ec</span> EC</th>
					<th><span class="material-symbols-outlined">device_thermostat</span> Temperature</th>
					<th>Last Seen</th>
					<th>Signal Strength</th>
					<th>Battery</th>
				</tr>
			</thead>
			<tbody>
				{#each groupedDevices.sensors as deviceID}
					{#if DEVICES[deviceID]}
						{#each latestData.filter((d) => d.device_id === DEVICES[deviceID]) as data}
							<tr>
								<td>
									<img
										src={`/${deviceImageMapping[DEVICES[deviceID]]}`}
										alt={removeSoilMoistureSensor(
											deviceHardcodedNames[DEVICES[deviceID]] || 'Unknown Device'
										)}
									/>
								</td>
								<td>
									<strong
										>{removeSoilMoistureSensor(
											deviceHardcodedNames[DEVICES[deviceID]] || 'Unknown Device'
										)}</strong
									>
								</td>
								<td><strong>{DEVICES[deviceID]}</strong></td>
								<td class="status-connected"><strong>{getStatus(DEVICES[deviceID])}</strong></td>
								<td><strong>{data.moisture}%</strong></td>
								<td><strong>{data.ec}</strong></td>
								<td><strong>{data.temperature}°C</strong></td>
								<td><strong>{new Date(data.received_at).toLocaleString()}</strong></td>
								<td>
									<div class="signal-strength" title="Signal Strength">
										<div
											class="signal-bar"
											style="height: {getSignalStrength(DEVICES[deviceID]) >= 1 ? '6px' : '2px'};"
										/>
										<div
											class="signal-bar"
											style="height: {getSignalStrength(DEVICES[deviceID]) >= 2 ? '10px' : '2px'};"
										/>
										<div
											class="signal-bar"
											style="height: {getSignalStrength(DEVICES[deviceID]) >= 3 ? '14px' : '2px'};"
										/>
										<div
											class="signal-bar"
											style="height: {getSignalStrength(DEVICES[deviceID]) >= 4 ? '18px' : '2px'};"
										/>
									</div>
								</td>
								<td>
									<div class="battery" title="Battery Level">
										<div class="battery-container">
											<div
												class="battery-level"
												style="height: {getBatteryStatus(DEVICES[deviceID])}%;"
											/>
										</div>
										<span class="battery-percentage">{getBatteryStatus(DEVICES[deviceID])}%</span>
									</div>
								</td>
							</tr>
						{/each}
					{/if}
				{/each}
			</tbody>
		</table>
	</div>
	<div class="device-category">
		<h2>Solenoid Valve Controllers</h2>
		<table>
			<thead>
				<tr>
					<th>Image</th>
					<th>Name</th>
					<th>EUI</th>
					<th>Status</th>
					<th>Valve 1 Status</th>
					<th>Valve 2 Status</th>
					<th>Last Irrigation Date</th>
					<th>Signal Strength</th>
					<th>Battery</th>
				</tr>
			</thead>
			<tbody>
				{#each groupedDevices.controllers as deviceID}
					{#if DEVICES[deviceID]}
						<tr>
							<td>
								<img
									src={`/${deviceImageMapping[DEVICES[deviceID]]}`}
									alt={removeSoilMoistureSensor(deviceHardcodedNames[DEVICES[deviceID]])}
								/>
							</td>
							<td>
								<strong>{removeSoilMoistureSensor(deviceHardcodedNames[DEVICES[deviceID]])}</strong>
							</td>
							<td><strong>{DEVICES[deviceID]}</strong></td>
							<td class="status-connected"><strong>{getStatus(DEVICES[deviceID])}</strong></td>
							<td><strong>{getValveStatus(1)}</strong></td>
							<td><strong>{getValveStatus(2)}</strong></td>
							<td><strong>{lastIrrigationEventWatermelon1}</strong></td>
							<td>
								<div class="signal-strength" title="Signal Strength">
									<div
										class="signal-bar"
										style="height: {getSignalStrength(DEVICES[deviceID]) >= 1 ? '6px' : '2px'};"
									/>
									<div
										class="signal-bar"
										style="height: {getSignalStrength(DEVICES[deviceID]) >= 2 ? '10px' : '2px'};"
									/>
									<div
										class="signal-bar"
										style="height: {getSignalStrength(DEVICES[deviceID]) >= 3 ? '14px' : '2px'};"
									/>
									<div
										class="signal-bar"
										style="height: {getSignalStrength(DEVICES[deviceID]) >= 4 ? '18px' : '2px'};"
									/>
								</div>
							</td>
							<td>
								<div class="battery" title="Battery Level">
									<div class="battery-container">
										<div
											class="battery-level"
											style="height: {getBatteryStatus(DEVICES[deviceID])}%;"
										/>
									</div>
									<span class="battery-percentage">{getBatteryStatus(DEVICES[deviceID])}%</span>
								</div>
							</td>
						</tr>
					{/if}
				{/each}
			</tbody>
		</table>
	</div>
</div>

<style>
	.breadcrumbs {
		margin-bottom: 2em;
		font-size: 1rem;
		color: #333;
	}

	.breadcrumbs a {
		color: #007bff;
		text-decoration: none;
	}

	.breadcrumbs a:hover {
		text-decoration: underline;
	}

	.device-list {
		padding: 2em;
	}

	.device-category {
		margin-bottom: 2em;
	}

	.device-category h2 {
		margin-bottom: 1em;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		margin-bottom: 1rem;
		border-radius: 10px;
		overflow: hidden;
	}

	th,
	td {
		border-bottom: 1px solid #ddd;
		padding: 0.75rem;
		text-align: left;
	}

	th {
		background-color: #f0f0f5;
		font-weight: bold;
	}

	td img {
		width: 30px;
	}

	.status-connected {
		color: #00ff95;
	}

	.signal-strength {
		display: flex;
		align-items: flex-end;
		gap: 2px;
	}

	.signal-bar {
		width: 4px;
		background-color: #00ff95;
		border-radius: 2px;
		transition: height 0.2s;
	}

	.signal-bar:nth-child(1) {
		height: 6px;
	}

	.signal-bar:nth-child(2) {
		height: 10px;
	}

	.signal-bar:nth-child(3) {
		height: 14px;
	}

	.signal-bar:nth-child(4) {
		height: 18px;
	}

	.battery {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-left: 10px;
	}

	.battery-container {
		width: 10px;
		height: 18px;
		border: 1px solid #2da000;
		border-radius: 2px;
		position: relative;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
	}

	.battery-container::after {
		content: '';
		width: 6px;
		height: 2px;
		background-color: #3c3d3c;
		position: absolute;
		top: -2px;
		left: 1px;
		border-radius: 1px;
	}

	.battery-level {
		width: 100%;
		background-color: #00ff95;
		border-radius: 2px 2px 0 0;
		transition: height 0.2s;
	}

	.battery-percentage {
		font-size: 0.75rem;
		color: #00ff95;
		margin-top: 4px;
	}

	.icon-box {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		border-radius: 5px;
		background-color: #e0e0e0;
		margin-right: 0.5rem;
	}

	@media only screen and (max-width: 768px) {
		.device-list {
			padding: 1em;
		}

		table {
			font-size: 0.875rem;
		}

		th,
		td {
			padding: 0.5rem;
		}

		.device-category h2 {
			font-size: 1.25rem;
		}

		.breadcrumbs {
			font-size: 0.875rem;
		}
	}

	@media only screen and (max-width: 480px) {
		.device-category h2 {
			font-size: 1rem;
			margin-bottom: 0.5rem;
		}

		table {
			font-size: 0.75rem;
		}

		th,
		td {
			padding: 0.25rem;
		}

		th:nth-child(1),
		td:nth-child(1),
		th:nth-child(5),
		td:nth-child(5),
		th:nth-child(6),
		td:nth-child(6),
		th:nth-child(7),
		td:nth-child(7),
		th:nth-child(8),
		td:nth-child(8) {
			display: none; /* Hide these columns on small screens */
		}
	}
</style>
