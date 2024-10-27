<!-- <script>
	import { onMount } from 'svelte';

	let weatherData = null;
	const API_KEY = 'HtWnSerGS211zMHTZkwudAohlb8xwYLa';
	const CITY = 'Tell Deir Alla';

	async function getLocationKey(city) {
		try {
			const response = await fetch(
				`https://dataservice.accuweather.com/locations/v1/cities/search?apikey=${API_KEY}&q=${city}`
			);
			if (!response.ok) {
				throw new Error(`Error fetching location key: ${response.statusText}`);
			}
			const data = await response.json();
			console.log('Location Key Response:', data);
			if (data.length > 0) {
				return data[0].Key;
			}
			return null;
		} catch (error) {
			console.error('Error fetching location key:', error);
		}
	}

	async function getWeather(locationKey) {
		try {
			const response = await fetch(
				`https://dataservice.accuweather.com/currentconditions/v1/${locationKey}?apikey=${API_KEY}&details=true`
			);
			if (!response.ok) {
				throw new Error(`Error fetching weather data: ${response.statusText}`);
			}
			const data = await response.json();
			console.log('Weather Data Response:', data);
			return data;
		} catch (error) {
			console.error('Error fetching weather data:', error);
		}
	}

	onMount(async () => {
		const locationKey = await getLocationKey(CITY);
		if (locationKey) {
			const weatherResponse = await getWeather(locationKey);
			if (weatherResponse && weatherResponse.length > 0) {
				weatherData = weatherResponse[0];
			} else {
				console.error('No weather data found');
			}
		} else {
			console.error('No location key found');
		}
	});
</script>

{#if weatherData}
	<div class="weather-card">
		<div class="weather-info">
			<p>Kuraymeh</p>
			<p>Temp: {weatherData.Temperature.Metric.Value}°C</p>
			<p>{weatherData.WeatherText}</p>
			<p>UV: {weatherData.UVIndex}</p>
			<p>Wind: {weatherData.Wind.Speed.Metric.Value} Km/h</p>
			<p>Humidity: {weatherData.RelativeHumidity}%</p>
			<p>Pressure: {weatherData.Pressure.Metric.Value} mbar</p>
		</div>
		<div class="weather-info-mobile">
			<p>Temp: {weatherData.Temperature.Metric.Value}°C</p>
			<p>Wind: {weatherData.Wind.Speed.Metric.Value} Km/h</p>
		</div>
		<div class="temp-info">
			<img
				src={`https://developer.accuweather.com/sites/default/files/${
					weatherData.WeatherIcon < 10 ? '0' : ''
				}${weatherData.WeatherIcon}-s.png`}
				alt="Weather icon"
			/>
		</div>
	</div>
{:else}
	<p>Loading weather data...</p>
{/if}

<style>
	.weather-card {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
	}

	.temp-info {
		display: flex;
		width: 35px;
		height: 35px;
		margin-right: 0.5rem;
	}
	.weather-info {
		display: none;
		align-items: center;
		white-space: nowrap;
	}
	.weather-info-mobile {
		display: flex;
		align-items: center;
	}
	.weather-info-mobile p {
		margin: 1em;
		font-size: 1em;
	}
	.weather-info p {
		margin: 1em;
		font-size: 1em;
	}

	@media only screen and (min-width: 750px) {
		.weather-info {
			display: flex; /* Show regular info */
		/* } */

		.weather-info-mobile {
			display: none; /* Hide mobile info */
		}
	}
</style> -->

<script>
	import { onMount } from 'svelte';
	import { weatherDataStore } from '$lib/stores/weatherStore';

	const API_KEY = 'fc1bc2b57bca4cd6ac761857230210';
	const CITY = 'Kuraymah';

	onMount(async () => {
		const response = await fetch(
			`https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${CITY}`
		);
		const weatherData = await response.json();
		weatherDataStore.set(weatherData);
	});
</script>

{#if $weatherDataStore}
	<div class="weather-card">
		<div class="weather-info">
			<p>Kuraymeh</p>
			<p>Temp: {$weatherDataStore.current.temp_c}°C</p>
			<p>{$weatherDataStore.current.condition.text}</p>
			<p>UV: {$weatherDataStore.current.uv}</p>
			<p>Wind: {$weatherDataStore.current.wind_kph} Km/h</p>
			<p>Humidity: {$weatherDataStore.current.humidity}%</p>
			<p>Pressure: {$weatherDataStore.current.pressure_mb} mbar</p>
		</div>
		<div class="weather-info-mobile">
			<p>Temp: {$weatherDataStore.current.temp_c}°C</p>
			<p>Wind: {$weatherDataStore.current.wind_kph} Km/h</p>
		</div>
		<div class="temp-info">
			<img src={$weatherDataStore.current.condition.icon} alt="Weather icon" />
		</div>
	</div>
{:else}
	<p>Loading weather data...</p>
{/if}

<style>
	.weather-card {
		display: flex;
		width: 100%;
	}

	.temp-info {
		display: flex;
	}
	.weather-info {
		display: none;
		align-items: center;
		white-space: nowrap;
	}
	.weather-info-mobile {
		display: flex;
		align-items: center;
	}
	.weather-info-mobile p {
		margin: 1em;
		font-size: 1em;
	}
	.weather-info p {
		margin: 1em;
		font-size: 1em;
	}

	img {
		margin-top: 5px;
		display: flex;
		justify-content: center;
		width: 40px;
		height: 40px;
	}

	@media only screen and (min-width: 750px) {
		.weather-info {
			display: flex; /* Show regular info */
		}

		.weather-info-mobile {
			display: none; /* Hide mobile info */
		}
	}
</style>
