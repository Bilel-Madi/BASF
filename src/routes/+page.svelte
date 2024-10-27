<script lang="ts">
	import 'carbon-components-svelte/css/white.css';
	import { latestDataStore } from '$lib/stores/latestDataStore';
	import Weather from '$lib/components/WeatherAPI.svelte';
	import Map from '$lib/components/Map.svelte';
	import Mapmobile from '$lib/components/Map-mobile.svelte';
	import { statusStore } from '$lib/stores/status-updater';
	import SoilNotification from '$lib/components/SoilNotification.svelte';
	import Chart from '$lib/components/chart/Chart.svelte';
	import CurrentReadings from '$lib/components/currentReadings.svelte';
	import Chartmobile from '$lib/components/chart-mobile/Chart-mobile.svelte';

	import { onMount } from 'svelte';
	import Info from '$lib/components/info.svelte';
	import Infomobile from '$lib/components/info-mobile.svelte';
	import ChartMobile from '$lib/components/chart-mobile/Chart-mobile.svelte';

	let asideIsActive = false; // Add this new reactive variable
	let showLoader = true;
	let isMobileScreen = false; // Variable to track if screen width is under 750px
	let MapComponent;

	onMount(async () => {
		function updateScreenSize() {
			isMobileScreen = window.innerWidth <= 750;
		}

		updateScreenSize();
		window.addEventListener('resize', updateScreenSize);

		if (isMobileScreen) {
			MapComponent = (await import('$lib/components/Map-mobile.svelte')).default;
		} else {
			MapComponent = (await import('$lib/components/Map.svelte')).default;
		}

		// Return cleanup function
		return () => {
			window.removeEventListener('resize', updateScreenSize);
		};
	});

	setTimeout(() => {
		showLoader = false;
	}, 6000);
	function toggle() {
		asideIsActive = !asideIsActive;
	}

	let latestData = {};
	let moisture = 0;
	let temperature = 0;
	let conductivity = 0;
	latestData = latestData;

	// Data subscriptions and computations
	latestDataStore.subscribe((data) => {
		if (data.length > 0) {
			latestData = data[data.length - 1];
			console.log('Latest Data:', latestData);
		}
	});

	function getLastUpdatedDate(dateStr) {
		const date = new Date(dateStr);
		return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
	}
</script>

<link
	rel="stylesheet"
	href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@40,300,0,0"
/>
<link
	rel="stylesheet"
	href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@48,400,0,0"
/>
<link
	rel="stylesheet"
	href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@48,400,0,0"
/>
<link
	rel="stylesheet"
	href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@48,400,0,0"
/>
<link
	href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
	rel="stylesheet"
/>
<link
	rel="stylesheet"
	href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"
/>

<div class="grid-container">
	<div class="statuses">
		<div class="status_overview">
			<div class="status_overview_card">
				<h5>Last activity</h5>
				<div class="overview_card-info">
					<div class="status-indicator">
						<div class="status-dot" />
						{$statusStore.lastMessageReceived
							? getLastUpdatedDate($statusStore.lastMessageReceived)
							: 'Loading...'}
					</div>
				</div>
			</div>
			<div class="status_overview_card">
				<h5>Alerts</h5>
				<div class="overview_card-info">
					<SoilNotification {moisture} {temperature} {conductivity} />
				</div>
				<div class="overview_card-icon">
					<span class="material-symbols-outlined"> info </span>
				</div>
			</div>
			<div class="status_overview_card weather-card">
				<h5>Weather</h5>
				<div class="overview_card-info">
					<Weather />
				</div>
			</div>
		</div>
	</div>

	<main class="main">
		<div class="main_cards">
			<div class="card">
				{#if MapComponent}
					<div class="map-wrapper"><svelte:component this={MapComponent} /></div>
				{/if}
			</div>

			<div class="card">
				<div class="map-wrapper"><Info /></div>
			</div>

			<div class="card">
				<CurrentReadings />
			</div>

			<div class="card">
				{#if showLoader}
					<div class="animation-wrapper">
						<div class="loading-animation" />
						<p>fetching data from sensors...</p>
					</div>
				{:else if isMobileScreen}
					<div class="map-wrapper"><ChartMobile /></div>
				{:else}
					<div class="map-wrapper"><Chart /></div>
				{/if}
			</div>
		</div>
	</main>
</div>

<style>
	.map-wrapper {
		height: 100%;
	}

	.grid-container {
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: 1fr 1fr;

		grid-template-areas:
			'main'
			'statuses';

		height: 100vh;
	}

	P {
		color: #0c348a;
	}

	.statuses {
		grid-area: statuses;
		background-color: #fdfdfd;
	}
	.main {
		grid-area: main;
		background-color: #fdfdfd;
		max-width: var(--mobile-max-width);
		width: var(--mobile-width);
	}

	/* flexing header and footer*/

	.status_overview {
		margin: 10px;
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: 50px 50px 400px;
		grid-template-areas:
			'status_overview_card1'
			'status_overview_card2 '
			'status_overview_card';
		grid-gap: 10px;
	}

	/* Layout for main content overview  and its cards*/
	.main_overview {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
	}
	.status_overview {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
	}

	.status_overview_card {
		flex-grow: 1;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 25px;
		height: 80px;
		border: 1px solid var(--border-base);
		border-radius: 10px;
		color: var(--text-base);
	}
	.overview_card {
		position: relative;
		margin: 5px 0px;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
		background-color: rgb(238, 245, 243);
		gap: 1rem;
		border: 0px solid var(--border-base);
		border-radius: 20px;
		color: var(--text-base);
	}
	/* Layout for main-cards section // below main_overview */
	.main_cards {
		margin: 10px;
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: 500px 200px 550px 120px;
		grid-template-areas:
			'card1'
			'card4'
			'card3'
			'card2';
		grid-gap: 10px;
	}
	.card {
		flex-basis: 250px;
		flex-grow: 1;
		padding: 10px;
		border: 1px solid var(--border-base);
		border-radius: 10px;
		color: var(--text-base);
		font-size: 1rem;
	}
	.card p {
		font-size: 2rem;
		font-weight: 500;
	}

	.card:first-child {
		grid-area: card1;
	}
	.card:nth-child(2) {
		grid-area: card2;
	}
	.card:nth-child(3) {
		grid-area: card3;
	}
	.card:nth-child(3) {
		grid-area: card4;
	}

	/* responsive layout */
	@media only screen and (min-width: 750px) {
		.grid-container {
			display: grid;
			grid-template-columns: 1fr;
			grid-template-rows: 60px 500px;
			grid-template-areas:
				'aside statuses'
				'aside main';

			height: fit-content;
		}

		.main {
			grid-area: main;
			background-color: #fdfdfd;
			max-width: var(--max-width);
			width: var(--width);
		}

		.status_overview {
			margin: 1px;
			display: grid;
			grid-template-columns: 0.5fr 0.9fr 1.3fr;
			grid-template-rows: 0.2fr;
			grid-template-areas: 'status_overview_card1 status_overview_card2 status_overview_card';
			grid-gap: 10px;
		}

		.status_overview_card {
			height: 40px;
		}

		.overview_card h4 {
			font-size: 1rem;
			opacity: 0.8;
			margin-top: -0.5rem;
			margin-bottom: -0.3rem;
		}

		.overview_card {
			flex-basis: 250px;
			flex-grow: 1;
			margin: 5px 0px;
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 30px;
			background-color: rgb(238, 245, 243);
			height: 120px;
			border: 0px solid var(--border-base);
			border-radius: 25px;
			color: var(--text-base);
		}

		.main_cards {
			margin: 1px;
			display: grid;
			grid-template-columns: 4fr 1fr;
			grid-template-rows: 2fr 2fr;
			grid-template-areas:
				'card1 card4'
				'card3 card2';
			grid-gap: 10px;
		}
	}

	.status-indicator {
		display: flex;
		justify-content: center;
		align-items: center;
	}
	.status-dot {
		display: flex;
		width: 0.8em;
		height: 0.8em;
		background-color: #00d87e;
		border-radius: 50%;
		margin-right: 0.8em;
		animation: blinkAnimation 0.5s infinite;
		justify-content: center;
	}

	@keyframes blinkAnimation {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.3;
		}
	}

	.animation-wrapper {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		margin-top: 10em; /* Assuming you want the container to fill the entire viewport height. Adjust as needed. */
	}

	.loading-animation {
		border: 2px solid rgba(0, 0, 0, 0.1);
		border-left-color: #1b0ab1;
		border-radius: 50%;
		width: 20px;
		height: 20px;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem; /* Spacing between animation and text */
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	@media only screen and (max-width: 750px) {
		.weather-card {
			display: none;
		}
	}

	@media only screen and (max-width: 750px) {
		.main_cards {
			margin: 0px;
			grid-gap: 0px;
		}

		.main_cards {
			grid-template-columns: 1fr;
			grid-template-rows: 370px 440px 440px 520px;
			grid-template-areas:
				'card1'
				'card2'
				'card3'
				'card4';
		}

		.card {
			display: flex; /* Ensure it's a flex container */
			flex-direction: column; /* Stack children vertically */
			flex-basis: 250px;
			flex-grow: 1;
			padding: 10px;
			border: 0px solid var(--border-base);
			border-radius: 10px;
			color: var(--text-base);
			font-size: 1rem;
			overflow: hidden; /* Prevent overflow from affecting outside */
		}

		.main_overview {
			display: flex;
			flex-wrap: nowrap;
			gap: 0.5rem;
			overflow-x: auto;
			overflow-y: hidden;
			width: 100%;
			-webkit-overflow-scrolling: touch;
			-ms-overflow-style: none; /* IE and Edge */
			scrollbar-width: none; /* Firefox */
			overflow-x: auto; /* Ensure horizontal scrolling is possible */
		}

		.main_overview::-webkit-scrollbar {
			display: none; /* Hide scrollbar for WebKit browsers */
		}

		.card:first-child {
			grid-area: card1;
			margin-left: -12px;
			margin-right: -12px;
			margin-top: -75px;
			height: 480px;
		}

		.card:nth-child(3) {
			grid-area: card3;
		}

		.overview_card P {
			font-size: 1rem;
		}
		.overview_card h4 {
			white-space: nowrap;
			font-size: 1rem;
		}
	}
</style>
