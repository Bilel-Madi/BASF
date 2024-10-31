<!-- src/components/ChartComponent.svelte -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { selectedSensorStore } from '$lib/stores/selectedSensorStore';
	import { Chart, registerables } from 'chart.js';
	import 'chartjs-adapter-date-fns';

	// Register Chart.js components
	Chart.register(...registerables);

	let chartInstance: Chart | null = null;

	// Local store to hold fetched data
	let chartData: any[] = [];
	let isLoading = false;
	let errorMessage = '';

	// Subscribe to the selected sensor
	let selectedSensor = null;
	const unsubscribeStore = selectedSensorStore.subscribe((sensor) => {
		selectedSensor = sensor;
		if (sensor) {
			// Wait for next tick to ensure canvas is mounted
			setTimeout(() => {
				fetchSensorData(sensor.device_id);
			}, 0);
		} else {
			clearChart();
		}
	});

	// Function to fetch sensor data
	async function fetchSensorData(deviceId: string) {
		isLoading = true;
		errorMessage = '';
		try {
			const response = await fetch(`/api/devices/${deviceId}/historical?time_range=3d`); // Adjust query parameters as needed
			if (response.ok) {
				const data = await response.json();
				console.log('Fetched sensor data:', data);
				chartData = data;
				renderChart(data, selectedSensor.device_type);
			} else {
				console.error('Failed to fetch sensor data:', await response.text());
				errorMessage = 'Failed to fetch sensor data.';
				chartData = [];
				clearChart();
			}
		} catch (error) {
			console.error('Error fetching sensor data:', error);
			errorMessage = 'Error fetching sensor data.';
			chartData = [];
			clearChart();
		} finally {
			isLoading = false;
		}
	}

	// Function to render the chart
	function renderChart(data: any[], deviceType: string) {
		// Get canvas element directly
		const canvas = document.getElementById('chartCanvas') as HTMLCanvasElement;
		if (!canvas) {
			console.error('Canvas element not found');
			return;
		}

		// Destroy existing chart instance if it exists
		if (chartInstance) {
			chartInstance.destroy();
			chartInstance = null;
		}

		// Get the 2D context
		const ctx = canvas.getContext('2d');
		if (!ctx) {
			console.error('Failed to get 2D context');
			return;
		}

		// Determine chart configuration based on device type
		const config = getChartConfig(data, deviceType);
		console.log('Chart configuration:', config);

		try {
			// Create new chart instance
			chartInstance = new Chart(ctx, config);
		} catch (error) {
			console.error('Error creating chart:', error);
		}
	}

	// Function to clear the chart
	function clearChart() {
		if (chartInstance) {
			chartInstance.destroy();
			chartInstance = null;
		}
	}

	// Function to get chart configuration based on device type
	function getChartConfig(data: any[], deviceType: string): Chart.ChartConfiguration {
		console.log('Configuring chart for device type:', deviceType);
		// Define datasets based on sensor type
		let datasets: Chart.ChartDataset<'line'>[] = [];

		if (deviceType === 'soil_moisture') {
			datasets = [
				{
					label: 'Soil Moisture (%)',
					data: data.map((d) => ({ x: d.received_at, y: d.moisture })), // Updated field name
					borderColor: 'rgba(33, 150, 243, 1)', // Blue
					backgroundColor: 'rgba(33, 150, 243, 0.5)',
					fill: false,
					tension: 0.4
				},
				{
					label: 'Soil Temperature (°C)',
					data: data.map((d) => ({ x: d.received_at, y: d.temperature })), // Updated field name
					borderColor: 'rgba(76, 175, 80, 1)', // Green
					backgroundColor: 'rgba(76, 175, 80, 0.5)',
					fill: false,
					tension: 0.4
				},
				{
					label: 'EC (µS/cm)',
					data: data.map((d) => ({ x: d.received_at, y: d.ec })),
					borderColor: 'rgba(255, 87, 34, 1)', // Orange
					backgroundColor: 'rgba(255, 87, 34, 0.5)',
					fill: false,
					tension: 0.4
				}
			];
		} else if (deviceType === 'co2_sensor') {
			datasets = [
				{
					label: 'Temperature (°C)',
					data: data.map((d) => ({ x: d.received_at, y: d.temperature })),
					borderColor: 'rgba(33, 150, 243, 1)', // Blue
					backgroundColor: 'rgba(33, 150, 243, 0.5)',
					fill: false,
					tension: 0.4
				},
				{
					label: 'CO₂ (ppm)',
					data: data.map((d) => ({ x: d.received_at, y: d.co2 })),
					borderColor: 'rgba(255, 99, 132, 1)', // Red
					backgroundColor: 'rgba(255, 99, 132, 0.5)',
					fill: false,
					tension: 0.4
				},
				{
					label: 'Humidity (%)',
					data: data.map((d) => ({ x: d.received_at, y: d.humidity })),
					borderColor: 'rgba(54, 162, 235, 1)', // Light Blue
					backgroundColor: 'rgba(54, 162, 235, 0.5)',
					fill: false,
					tension: 0.4
				},
				{
					label: 'Pressure (hPa)',
					data: data.map((d) => ({ x: d.received_at, y: d.pressure })),
					borderColor: 'rgba(255, 206, 86, 1)', // Yellow
					backgroundColor: 'rgba(255, 206, 86, 0.5)',
					fill: false,
					tension: 0.4
				}
			];
		}

		// Define common chart options
		const options: Chart.ChartOptions<'line'> = {
			responsive: true,
			interaction: {
				mode: 'index' as const,
				intersect: false
			},
			stacked: false,
			plugins: {
				title: {
					display: true,
					text: selectedSensor ? `${selectedSensor.name} Data` : 'Sensor Data'
				},
				tooltip: {
					enabled: true,
					mode: 'nearest',
					intersect: false
				},
				legend: {
					display: true,
					position: 'top'
				}
			},
			scales: {
				x: {
					type: 'time',
					time: {
						unit: 'minute',
						tooltipFormat: 'PPpp'
					},
					title: {
						display: true,
						text: 'Time'
					}
				},
				y: {
					beginAtZero: true,
					title: {
						display: true,
						text: 'Value'
					}
				}
			}
		};

		return {
			type: 'line',
			data: {
				datasets: datasets
			},
			options: options
		};
	}

	onMount(() => {
		console.log('Component mounted, chartInstance:', chartInstance);
		if (selectedSensor) {
			// Wait for next tick to ensure canvas is mounted
			setTimeout(() => {
				fetchSensorData(selectedSensor.device_id);
			}, 0);
		}
	});

	onDestroy(() => {
		if (chartInstance) {
			chartInstance.destroy();
		}
		unsubscribeStore();
	});
</script>

<!-- Move the canvas outside the conditional rendering -->
<div class="chart-container">
	<canvas id="chartCanvas" />

	{#if isLoading}
		<div class="overlay">Loading sensor data...</div>
	{:else if errorMessage}
		<div class="overlay error">{errorMessage}</div>
	{:else if !selectedSensor}
		<div class="overlay">Please select a sensor on the map to view its data.</div>
	{/if}
</div>

<style>
	.chart-container {
		position: relative;
		width: 100%;
		height: 400px;
		margin-top: 20px;
		background: #f0f0f0;
	}

	canvas {
		width: 100%;
		background-color: rgba(95, 95, 95, 0);
		padding: 1rem 0rem 0rem 0rem;
		border-radius: 10px;
	}

	.overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.9);
	}

	.error {
		color: red;
	}
</style>
