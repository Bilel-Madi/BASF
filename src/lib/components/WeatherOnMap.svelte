<script>
	import { weatherDataStore } from '$lib/stores/weatherStore';
	import { onMount } from 'svelte';

	let showToast = false;
	let weatherData = null;

	const unsubscribe = weatherDataStore.subscribe((data) => {
		weatherData = data;
	});

	onMount(() => {
		return () => {
			unsubscribe();
		};
	});

	function toggleToast() {
		showToast = !showToast;
	}
</script>

<div on:click={toggleToast} class="weather-icon">
	{#if weatherData}
		<img src={weatherData.current.condition.icon} alt="Weather icon" />
		<span class="temp-text">{weatherData.current.temp_c}°C</span>
	{:else}
		<p>Loading weather data...</p>
	{/if}
</div>

{#if showToast && weatherData}
	<div class="overlay" on:click={toggleToast} />
	<div class="toast-container">
		<div class="toast">
			<div class="toast-content">
				<div class="toast-header">
					<div class="status-container">
						<div class="status-dot" />
						<span>Current Weather in Kuraymeh</span>
					</div>
					<button class="close-button" on:click={toggleToast}>×</button>
				</div>
				<div class="toast-body">
					<div class="weather-main">
						<img
							src={weatherData.current.condition.icon}
							alt="Weather icon"
							class="weather-icon-toast"
						/>
						<div class="weather-main-text">
							<p class="weather-temp">{weatherData.current.temp_c}°C</p>
							<p class="weather-condition">{weatherData.current.condition.text}</p>
						</div>
					</div>
					<table class="weather-details">
						<tr>
							<td>UV:</td>
							<td>{weatherData.current.uv}</td>
						</tr>
						<tr>
							<td>Wind:</td>
							<td>{weatherData.current.wind_kph} Km/h</td>
						</tr>
						<tr>
							<td>Humidity:</td>
							<td>{weatherData.current.humidity}%</td>
						</tr>
						<tr>
							<td>Pressure:</td>
							<td>{weatherData.current.pressure_mb} mbar</td>
						</tr>
					</table>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.weather-icon {
		cursor: pointer;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0rem;
	}

	.temp-text {
		color: white;
		font-size: 0.8rem;
	}

	.weather-icon img {
		width: 35px; /* Smaller size for the weather icon */
		height: 35px; /* Smaller size for the weather icon */
		margin-left: -0.1rem;
	}

	.toast-container {
		position: fixed;
		bottom: 20px;
		right: 20px;
		display: flex;
		flex-direction: column;
		gap: 10px; /* Adjust the gap between toasts */
		z-index: 1001;
	}

	.toast {
		width: 400px;
		background-color: #1f1d83;
		border: 0px solid #ccc;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
		border-radius: 15px;
		overflow: hidden;
		animation: fadeIn 0.5s; /* Only fade in */
	}

	.toast-content {
		padding: 1rem;
		display: flex;
		flex-direction: column;
	}

	.toast-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		color: white;
	}

	.toast-header .status-container {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.toast-body {
		color: white;
		margin-top: 1rem;
	}

	.weather-main {
		display: flex;
		align-items: center;
		margin-bottom: 1rem;
	}

	.weather-main-text {
		margin-left: 1rem;
	}

	.weather-temp {
		font-size: 1.5rem;

		color: white;
	}

	.weather-condition {
		font-size: 1.2rem;
		color: white;
	}

	.weather-details {
		width: 100%;
		border-collapse: collapse;
	}

	.weather-details td {
		padding: 0.5rem 0;
		color: white;
	}

	.weather-icon-toast {
		width: 50px; /* Size for the weather icon in the toast */
		height: 50px;
	}

	.status-dot {
		width: 10px;
		height: 10px;
		background-color: #00ff95;
		border-radius: 50%;
	}

	.toast-header span {
		color: white;
	}

	.close-button {
		background: none;
		border: none;
		font-size: 1.2rem;
		cursor: pointer;
		color: #ffffff;
	}

	.close-button:hover {
		color: #00ff95;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.5); /* Adjust the opacity as needed */
		z-index: 1000; /* Make sure it's behind the toast */
	}

	/* Responsive Styles for Toast Notifications */
	@media only screen and (max-width: 750px) {
		.toast-container {
			bottom: 10px;
			right: 10px;
			left: 10px; /* Center toasts horizontally */
		}

		.toast {
			width: auto; /* Adjust width to fit the screen */
			max-width: 100%; /* Ensure some margin on both sides */
		}

		.toast-content {
			padding: 0.8rem;
		}

		.toast-header {
			flex-direction: column;
			align-items: flex-start;
		}

		.toast-header .status-container {
			margin-bottom: 0.5rem;
		}

		.toast-body {
			margin-top: 1rem;
			margin-bottom: 0.5rem;
		}

		.close-button {
			align-self: flex-end;
		}
	}
</style>
