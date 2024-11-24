<script lang="ts">
	import { onMount } from 'svelte';

	const API_KEY = 'fc1bc2b57bca4cd6ac761857230210';
	const CITY = 'Yarqa';

	type WeatherData = {
		location: {
			name: string;
			region: string;
		};
		current: {
			temp_c: number;
			wind_kph: number;
			wind_dir: string;
			humidity: number;
			uv: number;
			condition: {
				text: string;
				icon: string;
			};
			precip_mm: number;
		};
	};

	let weatherData: WeatherData | null = null;
	let loading = true;
	let error = false;

	async function fetchWeather() {
		try {
			const response = await fetch(
				`https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${CITY}`
			);
			if (!response.ok) throw new Error('Weather data fetch failed');
			weatherData = await response.json();
		} catch (e) {
			error = true;
			console.error('Error fetching weather:', e);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		fetchWeather();
	});
</script>

<div class="weather-container">
	{#if loading}
		<div class="loading">Loading weather data...</div>
	{:else if error}
		<div class="error">Unable to load weather data</div>
	{:else if weatherData}
		<div class="weather-content">
			<div class="weather-item location">Al Balawinah</div>
			<div class="weather-item condition-group">
				<img
					src={weatherData.current.condition.icon}
					alt={weatherData.current.condition.text}
					class="weather-icon"
				/>
				<span class="temperature">{Math.round(weatherData.current.temp_c)}°C</span>
				<span class="condition-text">{weatherData.current.condition.text}</span>
			</div>
			<div class="weather-item mobile-hide">
				Wind: <span class="value"
					>{weatherData.current.wind_kph} km/h {weatherData.current.wind_dir}</span
				>
			</div>
			<div class="weather-item mobile-hide">
				Humidity: <span class="value">{weatherData.current.humidity}%</span>
			</div>
			<div class="weather-item mobile-hide">
				UV: <span class="value">{weatherData.current.uv}</span>
			</div>
			<div class="weather-item mobile-hide">
				Precip: <span class="value">{weatherData.current.precip_mm}mm</span>
			</div>
		</div>
	{/if}
</div>

<style>
	.weather-container {
		width: 100%;
		height: 100%;
		padding: 0rem;
	}

	.weather-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		gap: 0.25rem;
	}

	.weather-item {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.9rem;
		white-space: nowrap;
	}

	.condition-group {
		display: flex;
		align-items: center;
		gap: 0.15rem;
	}

	.temperature {
		font-weight: 600;
	}

	.condition-text {
		margin-left: 0.5rem;
	}

	.weather-icon {
		width: 25px;
		height: 25px;
	}

	.loading,
	.error {
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #666;
		font-size: 0.9rem;
	}

	.value {
		font-weight: 600;
		color: #333;
	}

	@media (max-width: 768px) {
		.mobile-hide {
			display: none;
		}

		.condition-text {
			display: none;
		}

		.weather-content {
			justify-content: flex-start;
			gap: 0.5rem;
		}
	}
</style>
