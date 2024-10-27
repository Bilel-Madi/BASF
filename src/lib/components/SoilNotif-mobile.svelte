<script>
	import { datastore } from '$lib/stores/datastore';
	import { fly } from 'svelte/transition';

	let moisture;
	let temperature;
	let conductivity;

	let notifications = [];
	let currentNotification = null;
	let doubledNotifications = [];

	// Subscribe to the datastore to get the latest data
	datastore.subscribe((data) => {
		if (data.length > 0) {
			const latestData = data[data.length - 1];
			moisture = latestData.moisture;
			temperature = latestData.temperature;
			conductivity = latestData.ec;
		}
	});

	$: if (moisture !== undefined && temperature !== undefined && conductivity !== undefined) {
		notifications = getNotifications(moisture, temperature, conductivity);
		doubledNotifications = [...notifications, ...notifications];
	}

	function getNotifications(moisture, temperature, conductivity) {
		const notifs = [];
		notifs.push(
			moisture < 20
				? { message: 'Soil moisture is low. Consider irrigating the field.', kind: 'warning' }
				: { message: 'Soil moisture is optimal.', kind: 'success' }
		);

		notifs.push(
			conductivity > 1400
				? {
						message: 'High soil conductivity detected. Check for salinity or drainage issues.',
						kind: 'warning'
				  }
				: { message: 'Soil conductivity is optimal.', kind: 'success' }
		);

		notifs.push(
			temperature > 25
				? {
						message: 'Soil temperature is high. Consider shading or evening irrigation.',
						kind: 'warning'
				  }
				: { message: 'Soil temperature is optimal.', kind: 'success' }
		);

		return notifs;
	}

	let timeout;
	function showNextNotification() {
		if (notifications.length === 0) {
			// Repopulate the notifications array when it's empty
			notifications = getNotifications(moisture, temperature, conductivity);
		}

		currentNotification = null; // Hide the current notification
		setTimeout(() => {
			// Delay for animation
			currentNotification = notifications.shift();
		}, 100); // half the transition time to sync with the out transition

		clearTimeout(timeout);
		timeout = setTimeout(() => {
			showNextNotification();
		}, 3000);
	}
</script>

<div class="marquee">
	{#each notifications as notification}
		<div class="alert {notification.kind === 'success' ? 'alert-success' : 'alert-warning'}">
			<span>{notification.message}</span>
		</div>
	{/each}
</div>

<style>
	.marquee {
		display: flex;
		overflow: hidden;
		white-space: nowrap;
		margin-bottom: 1rem;
	}

	.alert {
		border: 0.4em solid transparent;
		border-radius: 0.25rem;
		margin-right: 2rem; /* Spacing between notifications */
	}

	.alert-success {
		background-color: #00ff9559;
		color: #242424;
	}

	.alert-warning {
		background-color: #ffeeba75;
		color: #242424;
	}

	/* Keyframes for marquee animation */
	@keyframes marquee {
		0% {
			transform: translateX(100%);
		}
		100% {
			transform: translateX(-100%);
		}
	}

	.marquee {
		animation: marquee 20s linear infinite;
	}
</style>
