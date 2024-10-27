<script>
	import { statusStore } from '$lib/stores/status-updater';
	import selectedDeviceId from '$lib/stores/deviceIdStore';
	import { mapEUIToSequenceNumber, DEVICES } from '$lib/devices'; // Import the mapping function

	let selectedId;
	let deviceStatus = {};
	let badgeNumber; // Initialize a variable to store the badge number
	let animationKey = 0; // Use a unique key to trigger animations

	selectedDeviceId.subscribe((value) => {
		selectedId = value;
		// Calculate and update the badge number based on the device EUI
		const sequence = mapEUIToSequenceNumber(deviceStatus.eui);
		badgeNumber = sequence !== undefined ? sequence + 1 : undefined; // Adjusting sequence to start from 1
		const newBadgeNumber = sequence !== undefined ? sequence : undefined;
		if (badgeNumber !== newBadgeNumber) {
			badgeNumber = newBadgeNumber;
			animationKey++; // Change the key to force the animation to restart
		}
	});

	statusStore.subscribe((value) => {
		deviceStatus = value;
	});

	// Function to check if the device is connected
	const isConnected = () => {
		if (!deviceStatus.lastMessageReceived) {
			return false;
		}
		const now = new Date();
		const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
		return new Date(deviceStatus.lastMessageReceived) > twoHoursAgo;
	};

	// Function to format the date to display only hours and minutes in bold
	// Function to format the date to display relative time since last message
	const formatLastMessageReceived = (dateString) => {
		const date = new Date(dateString);
		const now = new Date();
		const differenceInSeconds = Math.round((now - date) / 1000);
		const differenceInMinutes = Math.round(differenceInSeconds / 60);
		const differenceInHours = Math.round(differenceInMinutes / 60);
		const differenceInDays = Math.round(differenceInHours / 24);

		let timeString;
		if (differenceInSeconds < 60) {
			timeString = 'a few seconds ago';
		} else if (differenceInMinutes < 60) {
			timeString = `${differenceInMinutes} minute${differenceInMinutes > 1 ? 's' : ''} ago`;
		} else if (differenceInHours < 24) {
			timeString = `${differenceInHours} hour${differenceInHours > 1 ? 's' : ''} ago`;
		} else {
			timeString = `${differenceInDays} day${differenceInDays > 1 ? 's' : ''} ago`;
		}

		// Use the defined CSS class
		return `<span class="message-time">${timeString}</span>`;
	};
</script>

<div class="container">
	{#if selectedId}
		<div class="top-bar">
			<div class="status">
				<span class="status-dot" class:blinking={isConnected()} />
				Status: {isConnected() ? 'Connected' : 'Disconnected'}
			</div>
		</div>
		<div class="content">
			<div class="text-content">
				<!-- Adjusted to display the badge next to the device name -->
				<h2>
					{deviceStatus.name || 'Device'}
					{#if badgeNumber}
						<span class="badge">{badgeNumber}</span>
					{/if}
				</h2>
				<p>Device EUI: <strong>{deviceStatus.eui}</strong></p>
				<p>
					Coordinates: <strong
						>{deviceStatus.coordinates
							? `${deviceStatus.coordinates[0]}, ${deviceStatus.coordinates[1]}`
							: 'Not Available'}</strong
					>
				</p>
				<p>Last message :{@html formatLastMessageReceived(deviceStatus.lastMessageReceived)}</p>
			</div>
			{#if deviceStatus.imageUrl}
				<div class="image__wrapper">
					<img src={deviceStatus.imageUrl} alt={`Image of ${deviceStatus.name || selectedId}`} />
				</div>
			{/if}
		</div>
	{:else}
		<p>No device selected</p>
	{/if}
</div>

<style>
	.container {
		display: flex;
		flex-direction: column;
	}

	.status {
		display: flex;
		justify-content: center;
		align-items: center;
	}
	.top-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}
	.content {
		display: flex;
		flex-direction: column;
		justify-content: center;
	}
	.text-content {
		flex: 2;
	}

	.text-content h2 {
		font-size: 1rem;
		font-weight: 700;
		margin-bottom: 1rem;
	}
	.image__wrapper {
		flex: 0 1 auto; /* Allow the image wrapper to grow or shrink as needed, but prefer not to grow */
		display: flex;
		justify-content: center;
		align-items: center;

		background-color: rgb(238, 245, 243);
		border-radius: 20px;
		padding: 1rem;
		margin-top: 1rem;
	}
	.badge {
		background-color: #00ff95; /* Example badge color */
		color: rgb(16, 0, 43);
		border-radius: 20%;
		padding: 0.2rem 0.5rem;
		font-size: 1rem;
		font-weight: 600;
		animation: flash 1s ease-out infinite;
	}
	img {
		width: 6rem;
		height: auto;
	}
	.status-dot {
		display: inline-block;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background-color: #00ff95;
		margin-right: 5px;
		vertical-align: middle;
	}
	.blinking {
		animation: blinker 0.5s linear infinite;
	}
	@keyframes blinker {
		50% {
			opacity: 0.2;
		}
	}

	:global(.message-time) {
		background-color: #00ff9556;
		color: rgb(27, 27, 27);
		padding: 0.2rem 0.5rem;
		border-radius: 10px;
		margin-left: 0.3rem;
	}
</style>
