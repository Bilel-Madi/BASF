<script>
	import { onMount } from 'svelte';
	import { statusStore } from '$lib/stores/status-updater';
	import selectedDeviceId from '$lib/stores/deviceIdStore';
	import { selectedFieldName } from '$lib/stores/selectedFieldStore';
	import { mapEUIToSequenceNumber, DEVICES } from '$lib/devices';
	import ValveControl from './Valve-Control.svelte';
	import { scheduleStore } from '$lib/stores/scheduleStore';
	import { get } from 'svelte/store';

	let selectedId;
	let deviceStatus = {};
	let badgeNumber;
	let animationKey = 0;
	let deviceDepth;
	let fieldData = {};
	let fieldImage = '';
	let lastIrrigationEvent = '';
	let lastIrrigationEventWatermelon1 = '';
	let assignedDevices = [];
	let irrigationData = [];
	let signalStrength = 4; // Value between 0 and 4
	let batteryLevel = 90; // Percentage value between 0 and 100

	const controller = ['24E124460C484055'];

	let schedule = get(scheduleStore); // Get initial schedule value
	scheduleStore.subscribe((value) => {
		schedule = value;
	});

	selectedDeviceId.subscribe((value) => {
		selectedId = value;
		fieldData = {};
		const sequence = mapEUIToSequenceNumber(deviceStatus.eui);
		badgeNumber = sequence !== undefined ? sequence + 1 : undefined;
		const newBadgeNumber = sequence !== undefined ? sequence : undefined;
		if (badgeNumber !== newBadgeNumber) {
			badgeNumber = newBadgeNumber;
			animationKey++;
		}
	});

	statusStore.subscribe((value) => {
		deviceStatus = value;
	});

	selectedFieldName.subscribe((value) => {
		fieldData = value;
		if (fieldData.name) {
			const fieldImages = {
				'Navel 1': '/orange.png',
				'Navel 2': '/orange.png',
				'Navel 3': '/orange.png',
				'Pomelo 1': '/pomelo.png',
				'Pomelo 2': '/pomelo.png',
				'Pomelo 3': '/pomelo.png',
				'Pomelo 4': '/pomelo.png',
				'Clementine 1': '/clementine.png',
				'Clementine 2': '/clementine.png',
				'French 1': '/orange.png',
				'Tangelo 1': '/tangelo.png',
				'Tangelo 2': '/tangelo.png',
				'Watermelon 1': '/watermelon.png'
			};
			fieldImage = fieldImages[fieldData.name] || '/orange.png';
			assignedDevices = fetchAssignedDevices(fieldData.name);
			lastIrrigationEvent = getLastIrrigationEvent(fieldData.name);
		}
	});

	onMount(async () => {
		irrigationData = await loadIrrigationData();
		lastIrrigationEventWatermelon1 = getLastIrrigationEvent('Watermelon 1');
	});

	const isConnected = () => {
		if (!deviceStatus.lastMessageReceived) {
			return false;
		}
		const now = new Date();
		const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
		return new Date(deviceStatus.lastMessageReceived) > twoHoursAgo;
	};

	const formatLastMessageReceived = (dateString) => {
		const date = new Date(dateString);
		const now = new Date();
		const differenceInSeconds = Math.round((now - date) / 1000);
		const differenceInMinutes = Math.round(differenceInSeconds / 60);
		const differenceInHours = Math.round(differenceInMinutes / 60);
		const differenceInDays = Math.round(differenceInHours / 24);

		if (differenceInSeconds < 60) {
			return ' a few seconds ago';
		} else if (differenceInMinutes < 60) {
			return ` ${differenceInMinutes} minute${differenceInMinutes > 1 ? 's' : ''} ago`;
		} else if (differenceInHours < 24) {
			return ` ${differenceInHours} hour${differenceInHours > 1 ? 's' : ''} ago`;
		} else {
			return `${differenceInDays} day${differenceInDays > 1 ? 's' : ''} ago`;
		}
	};

	async function loadIrrigationData() {
		try {
			const response = await fetch('/Irrigation.json');
			const data = await response.json();
			return data;
		} catch (error) {
			console.error('Error loading irrigation data:', error);
			return [];
		}
	}

	// Function to get the last irrigation event for a field
	function getLastIrrigationEvent(fieldName) {
		const fieldEvents = irrigationData.filter((event) => event.field === fieldName);

		if (fieldEvents.length === 0) {
			return 'No Data';
		}

		let latestEvent = fieldEvents[0];
		fieldEvents.forEach((event) => {
			if (Date.parse(event.startTime) > Date.parse(latestEvent.startTime)) {
				latestEvent = event;
			}
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

		return `${duration} on ${startTime}`;
	}

	function fetchAssignedDevices(fieldName) {
		const fieldDevices = {
			'Navel 1': ['Device 1', 'Device 2'],
			'Navel 2': ['Sensor 3'],
			'Navel 3': ['None'],
			'Pomelo 1': ['None'],
			'Pomelo 2': ['Sensor 1'],
			'Pomelo 3': ['None'],
			'Pomelo 4': ['None'],
			'Clementine 1': ['Sensor 4'],
			'Clementine 2': ['None'],
			'Tangelo 1': ['None'],
			'Tangelo 2': ['Sensor 2'],
			'Watermelon 1': ['Sensor 5', 'Controller 1']
		};
		return fieldDevices[fieldName] || [];
	}

	function extractCropType(name) {
		if (!name) return '';
		const match = name.match(/^[^\d]+/);
		return match ? match[0].trim() : name;
	}
</script>

<div class="info-title">
	<h5>{fieldData.name ? 'Selected Field' : 'Selected Device'}</h5>
</div>
<div>
	{#if selectedId}
		{#if !fieldData.name}
			<div class="status">
				<div class="signal-strength" title="Signal Strength">
					<div class="signal-bar" style="height: {signalStrength >= 1 ? '6px' : '2px'};" />
					<div class="signal-bar" style="height: {signalStrength >= 2 ? '10px' : '2px'};" />
					<div class="signal-bar" style="height: {signalStrength >= 3 ? '14px' : '2px'};" />
					<div class="signal-bar" style="height: {signalStrength >= 4 ? '18px' : '2px'};" />
				</div>
				<div class="battery" title="Battery Level">
					<div class="battery-container">
						<div class="battery-level" style="height: {batteryLevel}%;" />
					</div>
					<span class="battery-percentage">{batteryLevel}%</span>
				</div>
			</div>
		{/if}
		<div class="image__wrapper">
			{#if fieldData.name}
				<img src={fieldImage} alt={`Image of ${fieldData.name}`} />
			{:else if deviceStatus.imageUrl}
				<img src={deviceStatus.imageUrl} alt={`Image of ${deviceStatus.name || selectedId}`} />
			{/if}

			{#if badgeNumber && !fieldData.name}
				<span class="badge" style="animation: flash 1s ease-out {animationKey};">{badgeNumber}</span
				>
			{/if}
		</div>
		{#if !fieldData.name}
			<div class="statusblink">
				Status: <span class:blinking={isConnected()}
					>{isConnected() ? 'Connected' : 'Disconnected'}</span
				>
			</div>
		{/if}
		{#if fieldData.name}
			<h2>{fieldData.name}</h2>
		{:else}
			<h2>{deviceStatus.name || 'Device'}</h2>
		{/if}

		{#if fieldData.name}
			<table class="minimal-table">
				<tr>
					<td>Crop Type</td>
					<td><strong>{extractCropType(fieldData.name)}</strong></td>
				</tr>
				<tr>
					<td>Soil Type</td>
					<td><strong>Silt Loam</strong></td>
				</tr>
				<tr>
					<td>Field Size</td>
					<td><strong>{fieldData.area.toFixed(2)} hectares</strong></td>
				</tr>
				<tr>
					<td>Last Irrigation</td>
					<td><strong>{lastIrrigationEvent}</strong></td>
				</tr>
				<tr>
					<td>Assigned Devices</td>
					<td>
						{#each assignedDevices as device, index}
							<strong>{device}{index < assignedDevices.length - 1 ? ', ' : ''}</strong>
						{/each}
					</td>
				</tr>
			</table>
		{:else}
			<table class="minimal-table">
				<tr>
					<td>Device EUI</td>
					<td><strong>{deviceStatus.eui}</strong></td>
				</tr>
				{#if controller.includes(deviceStatus.eui)}
					<tr>
						<td>Schedule</td>
						<td>
							<strong>
								{schedule.startTime
									? `${schedule.startTime}, ${schedule.duration} minutes, on ${schedule.days.join(
											', '
									  )}`
									: 'None'}
							</strong>
						</td>
					</tr>
					<tr>
						<td>Last Irrigation Event</td>
						<td><strong>{lastIrrigationEventWatermelon1}</strong></td>
					</tr>
				{:else}
					<tr>
						<td>Depth</td>
						<td><strong>{deviceStatus.depth} cm</strong></td>
					</tr>
					<tr>
						<td>Last Seen</td>
						<td
							><strong>{@html formatLastMessageReceived(deviceStatus.lastMessageReceived)}</strong
							></td
						>
					</tr>
				{/if}
			</table>
			{#if controller.includes(deviceStatus.eui)}
				<div class="valve-control-container"><ValveControl /></div>
			{/if}
		{/if}
	{:else}
		<p>No device selected</p>
	{/if}
</div>

<style>
	.info-title {
		margin-bottom: 0.8rem;
	}
	.minimal-table {
		width: 100%;
		border-collapse: collapse;
		margin-top: 1rem;
		font-size: 0.9rem;
	}

	.minimal-table th,
	.minimal-table td {
		padding: 0.3rem;
		border-bottom: 1px solid #ddd;
		text-align: left;
	}

	.minimal-table th {
		background-color: #f9f9f900;
		font-weight: 600;
	}

	.minimal-table td {
	}

	.minimal-table tr:last-child th,
	.minimal-table tr:last-child td {
		border-bottom: none;
	}

	.statusblink {
		margin-top: -0.4rem;
		margin-bottom: 1rem;
	}

	.image__wrapper {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
		margin-bottom: 1rem;
		background-color: rgb(238, 245, 243);
		border-radius: 20px;
	}

	.status {
		position: absolute;
	}

	.signal-strength {
		top: 10.1rem;
		left: 19rem;
		position: absolute;
		display: flex;
		align-items: flex-end;
		gap: 2px;
		z-index: 99;
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
		z-index: 99;
		display: flex;
		flex-direction: column;
		align-items: center;
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
		z-index: 99;
		top: 10.1rem;
		left: 20.5rem;
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

	img {
		width: 7rem;
	}

	.badge {
		position: absolute;
		right: 37%;
		top: 10%;
		background-color: #1b0ab1;
		color: rgb(255, 255, 255);
		border-radius: 20%;
		padding: 0.3rem 0.2rem 0.1rem 0.15rem;
		font-size: 1rem;
		font-weight: 500;
		z-index: 99;
		min-width: 20px;
		height: 25px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		text-align: center;
		box-sizing: border-box;
		width: 25px;
	}

	h2 {
		font-size: 1rem;
		font-weight: 800;
		margin-bottom: 1.5rem;
	}

	p {
		font-size: 0.9rem;
	}

	img {
		width: 7rem;
	}

	.blinking {
		margin-bottom: 0.5rem;
		margin-top: -0.5rem;
		animation: blinker 1.5s linear infinite;
		color: #00ac64;
	}

	@keyframes blinker {
		50% {
			opacity: 0;
		}
	}
	.valve-control-container {
		margin-left: 0.3rem;
		margin-top: 0.3rem;
	}

	@media only screen and (max-width: 750px) {
		.image__wrapper {
			position: relative;
			display: flex;
			justify-content: center;
			align-items: center;
			margin-bottom: 1rem;
			background-color: rgb(238, 245, 243);
			border-radius: 20px;
		}
		.badge {
			right: 37%;
			top: 10%;
		}
	}
</style>
