<script lang="ts">
	// Importing necessary modules and Svelte stores
	import { onMount } from 'svelte';
	import chartjs from 'chart.js/auto';
	import annotationPlugin from 'chartjs-plugin-annotation';
	import { datastore } from '$lib/stores/datastore';
	import selectedDeviceId from '$lib/stores/deviceIdStore';
	import chartPreferences from '$lib/stores/chartPreferencesStore';
	import { createGradients } from '$lib/components/chart/gradientConfig';
	import weatherIconsPlugin from '$lib/components/chart/weatherIconsPlugin';
	import horizontalCrosshairPlugin from '$lib/components/chart/horizontalCrosshairPlugin';
	import * as crosshairPkg from 'chartjs-plugin-crosshair';

	const CrosshairPlugin = crosshairPkg.default || crosshairPkg.CrosshairPlugin;

	chartjs.register(annotationPlugin);
	chartjs.register(CrosshairPlugin);
	chartjs.register(weatherIconsPlugin);
	chartjs.register(horizontalCrosshairPlugin);

	export let startDate: string;
	export let endDate: string;

	// Declaration of variables used in the component
	let ctx; // Context for the canvas element
	let chart; // Chart.js chart instance
	let chartCanvas; // Canvas element reference
	let currentDeviceId; // Current selected device ID
	let data: { x: Date; y: number; z: number; ec: number }[] = []; // Data array including EC (Electrical Conductivity)
	let isLoading = true; // Loading state flag

	// Toggle states for each control
	let isMoistureActive = true;
	let isTemperatureActive = true;
	let isECActive = true;
	let isIriigationActive = true;

	// The structure of data fetched from the datastore
	let fetchedData: {
		received_at: Date;
		moisture: number;
		temperature: number;
		ec: number; // Property for Electrical Conductivity
		device_id: string;
	}[] = [];

	selectedDeviceId.subscribe((value) => (currentDeviceId = value));
	datastore.subscribe((allData) => {
		isLoading = true; // Set loading status to true before updating chart
		fetchedData = allData;

		isLoading = false; // Set loading status to false after chart update
	});

	// Reactive statement to filter and prepare data when the device ID changes
	$: if (currentDeviceId) {
		const cutOffDate = new Date('2023-12-22'); // Define cut-off date

		const filteredData = fetchedData.filter((entry) => {
			return entry.device_id === currentDeviceId && new Date(entry.received_at) >= cutOffDate;
		});

		data = filteredData.map((entry) => ({
			x: entry.received_at,
			y: entry.moisture,
			z: entry.temperature,
			ec: entry.ec
		}));

		updateChart();
	}

	// Custom plugin to draw annotation boxes based on the toggle state
	const annotationBoxPlugin = {
		id: 'annotationBox',
		beforeDraw(chart) {
			const { ctx, chartArea, scales } = chart;
			const { left, right } = chartArea;
			const boxWidth = right - left;

			if (isMoistureActive && !isTemperatureActive && !isECActive) {
				drawMoistureBoxes(ctx, scales, left, right, boxWidth);
			} else if (!isMoistureActive && isTemperatureActive && !isECActive) {
				drawTemperatureBoxes(ctx, scales, left, right, boxWidth);
			} else if (!isMoistureActive && !isTemperatureActive && isECActive) {
				drawECBoxes(ctx, scales, left, right, boxWidth);
			}
		}
	};

	function drawMoistureBoxes(ctx, scales, left, right, boxWidth) {
		const yMoistureScale = scales['y-moisture'];
		const moistureRanges = [
			{ lower: 10, upper: 15, color: 'rgba(255, 99, 71, 0.05)', lineColor: '#FF6347' },
			{ lower: 15, upper: 30, color: 'rgba(245, 243, 154, 0.05)', lineColor: '#00ff95' },
			{ lower: 30, upper: 50, color: 'rgba(0, 255, 149, 0.05)', lineColor: '#00ff95' },
			{ lower: 50, upper: 60, color: 'rgba(173, 216, 230, 0.0)', lineColor: '#00ff95' }
		];

		moistureRanges.forEach((range, index) => {
			const boxTop = yMoistureScale.getPixelForValue(range.upper);
			const boxBottom = yMoistureScale.getPixelForValue(range.lower);
			const boxHeight = boxBottom - boxTop;

			ctx.save();
			ctx.fillStyle = range.color;
			ctx.fillRect(left, boxTop, boxWidth, boxHeight);

			// Draw the dashed line unless it's the highest box
			if (index !== moistureRanges.length - 1) {
				ctx.beginPath();
				ctx.setLineDash([5, 5]);
				ctx.moveTo(left, boxTop);
				ctx.lineTo(right, boxTop);
				ctx.strokeStyle = range.lineColor;
				ctx.lineWidth = 1;
				ctx.stroke();
			}

			ctx.restore();
		});
	}

	function drawTemperatureBoxes(ctx, scales, left, right, boxWidth) {
		const yTemperatureScale = scales['y-temperature'];
		const temperatureRanges = [
			{ lower: 10, upper: 13, color: 'rgba(255, 99, 71, 0.05)', lineColor: '#FF6347' },
			{ lower: 13, upper: 20, color: 'rgba(245, 243, 154, 0.05)', lineColor: '#00ff95' },
			{ lower: 20, upper: 30, color: 'rgba(0, 255, 149, 0.05)', lineColor: '#00ff95' },
			{ lower: 30, upper: 35, color: 'rgba(245, 243, 154, 0.0)', lineColor: '#FF6347' }
		];

		temperatureRanges.forEach((range, index) => {
			const boxTop = yTemperatureScale.getPixelForValue(range.upper);
			const boxBottom = yTemperatureScale.getPixelForValue(range.lower);
			const boxHeight = boxBottom - boxTop;

			ctx.save();
			ctx.fillStyle = range.color;
			ctx.fillRect(left, boxTop, boxWidth, boxHeight);

			// Draw the dashed line unless it's the highest box
			if (index !== temperatureRanges.length - 1) {
				ctx.beginPath();
				ctx.setLineDash([5, 5]);
				ctx.moveTo(left, boxTop);
				ctx.lineTo(right, boxTop);
				ctx.strokeStyle = range.lineColor;
				ctx.lineWidth = 1;
				ctx.stroke();
			}

			ctx.restore();
		});
	}
	function drawECBoxes(ctx, scales, left, right, boxWidth) {
		const yECScale = scales['y-ec']; // Ensure you have a scale defined with this ID
		const ecRanges = [
			{ lower: 0, upper: 0.2, color: 'rgba(255, 99, 71, 0.05)', lineColor: '#FF6347' },
			{ lower: 0.2, upper: 0.45, color: 'rgba(245, 243, 154, 0.05)', lineColor: '#00ff95' },
			{ lower: 0.45, upper: 1.5, color: 'rgba(0, 255, 149, 0.05)', lineColor: '#00ff95' },
			{ lower: 1.5, upper: 3, color: 'rgba(0, 255, 149, 0.0)', lineColor: '#00ff95' }
		];

		ecRanges.forEach((range, index) => {
			const boxTop = yECScale.getPixelForValue(range.upper);
			const boxBottom = yECScale.getPixelForValue(range.lower);
			const boxHeight = boxBottom - boxTop;

			ctx.save();
			ctx.fillStyle = range.color;
			ctx.fillRect(left, boxTop, boxWidth, boxHeight);

			// Draw dashed lines except for the highest box
			if (index !== ecRanges.length - 1) {
				ctx.beginPath();
				ctx.setLineDash([5, 5]);
				ctx.moveTo(left, boxTop);
				ctx.lineTo(right, boxTop);
				ctx.strokeStyle = range.lineColor;
				ctx.lineWidth = 1;
				ctx.stroke();
			}

			ctx.restore();
		});
	}

	// Register and use the custom annotation box plugin
	chartjs.register(annotationBoxPlugin);

	// Register the new plugin

	// Color schemes for the chart
	const colors = {
		blue: {
			default: 'rgba(51, 207, 237, 0.9)',
			half: 'rgba(54, 169, 244, 0.8)',
			quarter: 'rgba(54, 169, 244, 0.5)',
			zero: 'rgba(54, 169, 244, 0)'
		},
		orange: {
			default: 'rgba(185, 255, 163, 0.9)',
			half: 'rgba(200, 255, 0, 0.8)',
			quarter: 'rgba(185, 255, 163, 0.5)',
			zero: 'rgba(185, 255, 163, 0)'
		},
		indigo: {
			default: 'rgba(80, 102, 120, 0.9)',
			quarter: 'rgba(80, 102, 120, 0.25)'
		}
	};

	// Function to dynamically configure the x-axis ticks
	function getScalesConfig(
		prefs,
		minMoisture,
		maxMoisture,
		minTemperature,
		maxTemperature,
		minEC,
		maxEC
	) {
		const start = new Date(startDate);
		const end = new Date(endDate);
		const daysDiff = Math.floor((end - start) / (24 * 60 * 60 * 1000)); // Calculate days difference

		// Determine the appropriate x-axis label format based on the date range
		let timeFormatter;
		if (daysDiff <= 1) {
			// 24 hours or less
			timeFormatter = new Intl.DateTimeFormat('default', {
				hour: 'numeric'
			});
		} else if (daysDiff <= 3) {
			// Up to 3 days
			timeFormatter = new Intl.DateTimeFormat('default', {
				weekday: 'short',
				day: 'numeric',
				hour: 'numeric'
			});
		} else if (daysDiff <= 7) {
			// Up to 1 week
			timeFormatter = new Intl.DateTimeFormat('default', {
				weekday: 'short',
				day: 'numeric',
				hour: 'numeric'
			});
		} else if (daysDiff <= 14) {
			// Up to 2 weeks
			timeFormatter = new Intl.DateTimeFormat('default', {
				weekday: 'short',
				day: 'numeric'
			});
		} else if (daysDiff <= 30) {
			// Up to 1 month
			timeFormatter = new Intl.DateTimeFormat('default', {
				weekday: 'short',
				day: 'numeric'
			});
		} else {
			// More than 1 month
			timeFormatter = new Intl.DateTimeFormat('default', {
				month: 'short',
				day: 'numeric'
			});
		}

		// Utility function to round a date to the nearest hour
		function roundToNearestHour(date) {
			const d = new Date(date);
			d.setMinutes(0, 0, 0); // Set minutes, seconds, and milliseconds to zero
			return d;
		}

		const scales = {
			x: {
				grid: {
					display: true, // Ensure grid settings are enabled
					drawOnChartArea: true, // Only draw the ticks, not the full grid lines
					drawTicks: true, // Draw tick marks at each tick
					tickLength: 7, // Adjust the length of the tick marks
					tickWidth: 1,
					color: 'rgba(3, 3, 89, 0.2)' // Customize the tick color
				},
				ticks: {
					callback: function (value, index, values) {
						// Format each tick label after rounding to the nearest hour
						const roundedDate = roundToNearestHour(this.getLabelForValue(value));
						return timeFormatter.format(roundedDate);
					},
					maxTicksLimit: 12,
					font: {
						size: 11
					},
					autoSkip: true,
					align: 'start',
					padding: 5,
					color: '#030359'
				},

				border: {
					color: 'rgba(3, 3, 89, 0.3)',
					width: 1
				}
			}
		};

		// Configure the y-axes based on preferences
		if (prefs.showMoistureAxis) {
			scales['y-moisture'] = {
				type: 'linear',
				position: 'left',
				grid: {
					display: true, // Ensure grid settings are enabled
					drawOnChartArea: false, // Only draw the ticks, not the full grid lines
					drawTicks: true, // Draw tick marks at each tick
					tickLength: 7, // Adjust the length of the tick marks
					tickWidth: 1,
					color: 'rgba(60, 55, 205, 1)' // Customize the tick color
				},
				title: {
					position: 'top',
					display: true,
					align: 'start',
					text: 'VWC %',
					color: '#050575',
					font: {
						size: 14
					},
					padding: {
						top: 14
					}
				},
				ticks: {
					// Add '%' symbol to each tick value
					callback: function (value, index, ticks) {
						return `${value}%`; // Append the percentage symbol
					},

					color: '#030359',
					padding: 4,
					maxTicksLimit: 10
				},
				border: {
					color: 'rgba(3, 3, 89, 0.3)',
					width: 1
				},
				suggestedMin: minMoisture,
				suggestedMax: maxMoisture
			};
		}

		if (prefs.showTemperatureAxis) {
			scales['y-temperature'] = {
				type: 'linear',
				position: 'right',
				grid: {
					display: true, // Ensure grid settings are enabled
					drawOnChartArea: false, // Only draw the ticks, not the full grid lines
					drawTicks: true, // Draw tick marks at each tick
					tickLength: 7, // Adjust the length of the tick marks
					tickWidth: 1,
					color: 'rgba(60, 55, 205, 1)' // Customize the tick color
				},
				title: {
					display: true,
					align: 'start',
					text: 'Temp °C ',
					color: '#050575',
					font: {
						size: 14
					}
				},
				ticks: {
					// Add '°C' symbol to each tick value
					callback: function (value, index, ticks) {
						return `${value}°C`; // Append the percentage symbol
					},

					color: '#030359',
					padding: 4,
					maxTicksLimit: 15
				},
				border: {
					color: 'rgba(3, 3, 89, 0.3)',
					width: 1
				},
				suggestedMin: minTemperature,
				suggestedMax: maxTemperature
			};
		}

		if (prefs.showECAxis) {
			scales['y-ec'] = {
				type: 'linear',
				position: 'left',
				grid: {
					display: true, // Ensure grid settings are enabled
					drawOnChartArea: false, // Only draw the ticks, not the full grid lines
					drawTicks: true, // Draw tick marks at each tick
					tickLength: 7, // Adjust the length of the tick marks
					tickWidth: 1,
					color: 'rgba(60, 55, 205, 1)' // Customize the tick color
				},
				title: {
					display: true,
					align: 'start',
					text: 'EC (m/cm)',
					color: '#050575',
					font: {
						size: 14
					}
				},
				ticks: {
					color: '#030359',
					padding: 4,
					maxTicksLimit: 15
				},
				border: {
					color: 'rgba(3, 3, 89, 0.3)',
					width: 1
				},
				suggestedMin: minEC,
				suggestedMax: maxEC
			};
		}

		return scales;
	}

	function createDatasets(prefs, filteredData, colors, blueGradient) {
		const datasets = [];
		if (prefs.showMoisture) {
			datasets.push({
				label: 'Soil Moisture',
				yAxisID: 'y-moisture',
				type: 'line',
				fill: true,
				backgroundColor: blueGradient,
				pointBackgroundColor: colors.blue.half,
				borderColor: colors.blue.default,
				data: filteredData.map((entry) => entry.y),
				lineTension: 0.4,
				borderWidth: 2,
				pointRadius: 0,
				pointHitRadius: 55,
				pointHoverRadius: 5
			});
		}

		if (prefs.showTemperature) {
			datasets.push({
				label: 'Soil Temperature',
				yAxisID: 'y-temperature',
				type: 'line',
				fill: false,
				backgroundColor: '#00ff95',
				pointBackgroundColor: colors.orange.default,
				borderColor: '#00ff95',
				data: filteredData.map((entry) => entry.z),
				lineTension: 0.4,
				borderWidth: 2,
				pointRadius: 0,
				pointHitRadius: 55,
				pointHoverRadius: 5
			});
		}

		if (prefs.showEC) {
			datasets.push({
				label: 'Electrical Conductivity',
				yAxisID: 'y-ec',
				type: 'line',
				borderColor: '#4d8fc9',
				backgroundColor: '#4d8fc9',
				data: filteredData.map((entry) => entry.ec),
				lineTension: 0.4,
				borderWidth: 2,
				pointRadius: 0,
				pointHitRadius: 55,
				pointHoverRadius: 5
			});
		}

		return datasets;
	}

	// Function to update the chart
	function updateChart() {
		if (chart) {
			chart.destroy();
		}

		const filteredData = data.filter((entry) => entry.x);

		// Calculate min and max for moisture with an extra margin
		const moistureValues = filteredData.map((entry) => entry.y);
		let minMoisture = 10; // Subtract 2 for the lower margin
		let maxMoisture = 60; // Add 2 for the upper margin
		// Ensure the minimum value is not less than 0
		minMoisture = minMoisture < 0 ? 0 : minMoisture;

		// Calculate min and max for temperature with an extra margin
		const temperatureValues = filteredData.map((entry) => entry.z);
		let minTemperature = 10; // Subtract 2 for the lower margin
		let maxTemperature = 40; // Add 2 for the upper margin

		// Calculate min and max for EC with an extra margin
		const ecValues = filteredData.map((entry) => entry.ec);
		let minEC = 0; // Subtract 2 for the lower margin
		let maxEC = 3; // Add 2 for the upper margin
		// Ensure the minimum value is not less than 0 for EC as well, if applicable
		minEC = minEC < 0 ? 0 : minEC;
		// Gradients for chart datasets

		// Subscribe to chart preferences store
		let prefs;
		chartPreferences.subscribe((value) => {
			prefs = value;
		});

		const scalesConfig = getScalesConfig(
			prefs,
			minMoisture,
			maxMoisture,
			minTemperature,
			maxTemperature,
			minEC,
			maxEC
		);

		// Prepare datasets based on preferences
		const { blueGradient, orangeGradient } = createGradients(ctx, colors);
		const datasets = createDatasets(prefs, filteredData, colors, blueGradient, orangeGradient);

		chart = new chartjs(ctx, {
			type: 'line',
			data: {
				labels: filteredData.map((entry) =>
					new Intl.DateTimeFormat('default', {
						year: 'numeric',
						month: 'short',
						day: 'numeric', // Add date parts
						hour: '2-digit',
						minute: '2-digit' // Keep the time parts
					}).format(new Date(entry.x))
				),
				datasets: datasets
			},
			options: {
				borderRadius: '10',
				responsive: true,
				cutout: '100%',
				spacing: 10,
				plugins: {
					horizontalCrosshairPlugin,
					annotationBoxPlugin,
					weatherIconsPlugin,
					tooltip: {
						mode: 'index',
						intersect: false,
						titleFont: {
							size: 16
						},
						bodyFont: {
							size: 14
						},
						padding: {
							left: 20,
							right: 20,
							top: 20,
							bottom: 20
						},
						enabled: true,
						borderWidth: 0.2,
						borderColor: '#070797',
						position: 'average',
						displayColors: true,
						backgroundColor: '#fff',
						titleColor: '#070797',
						bodyColor: '#070797',
						cornerRadius: 20,
						boxPadding: 10,
						usePointStyle: true,
						titleMarginBottom: 15,
						footerFont: {
							size: 11,
							style: 'normal',
							weight: 'lighter'
						},
						footerAlign: 'left',
						footerSpacing: 10,
						footerMarginTop: 10,
						footerColor: '#070797',
						caretPadding: 30,
						caretSize: 10,
						callbacks: {
							footer: function (tooltipItems) {
								const tooltipItem = tooltipItems[0];
								const dataPoint = tooltipItem.raw;
								return `Data accuracy: ±2%.`;
							}
						}
					},
					crosshair: {
						line: {
							color: '#030359',
							width: 0.5
						},

						sync: {
							enabled: false
						},

						interpolate: true // This will align the points with the crosshair
					},
					legend: {
						display: false,
						position: 'top',
						align: 'start',
						title: {
							padding: 30,
							color: '#070797'
						},

						labels: {
							usePointStyle: true
						},
						onClick: (e) => e.stopPropagation()
					}
				},

				scales: scalesConfig
			}
		});
	}

	// onMount lifecycle hook to initialize the chart
	onMount(() => {
		ctx = chartCanvas.getContext('2d');
		adjustCanvasHeight();
		updateChart();
		window.addEventListener('resize', adjustCanvasHeight);

		return () => {
			window.removeEventListener('resize', adjustCanvasHeight);
		};
	});

	function toggleMoisture() {
		isMoistureActive = !isMoistureActive;
		chartPreferences.update((prefs) => ({
			...prefs,
			showMoisture: isMoistureActive,
			showMoistureAxis: isMoistureActive
		}));
		updateChart();
	}

	function toggleTemperature() {
		isTemperatureActive = !isTemperatureActive;
		chartPreferences.update((prefs) => ({
			...prefs,
			showTemperature: isTemperatureActive,
			showTemperatureAxis: isTemperatureActive
		}));
		updateChart();
	}

	function toggleEC() {
		isECActive = !isECActive;
		chartPreferences.update((prefs) => ({
			...prefs,
			showEC: isECActive,
			showECAxis: isECActive
		}));
		updateChart();
	}

	// Adjust canvas height based on screen size
	function adjustCanvasHeight() {
		if (window.innerWidth < 768) {
			// For mobile screens
			chartCanvas.height = 600; // Set a larger height for mobile
		} else {
			chartCanvas.height = 170; // Default height for larger screens
		}
	}
</script>

<!-- UI components are retained as in your provided example -->
<div class="toggle_buttons">
	<button class="button toggle-button" class:active={isMoistureActive} on:click={toggleMoisture}>
		<span class="dot" style="background-color: #3399FF;" />
		Soil Moisture
	</button>
	<button
		class="button toggle-button"
		class:active={isTemperatureActive}
		on:click={toggleTemperature}
	>
		<span class="dot" style="background-color: #00FF00;" />
		Soil Temperature
	</button>
	<button class="button toggle-button" class:active={isECActive} on:click={toggleEC}>
		<span class="dot" style="background-color: #4d8fc9;" />
		Soil EC
	</button>
</div>
{#if isLoading}
	<!-- Loading message or spinner when the data is being updated -->
	<div>Loading...</div>
{:else}
	<!-- Display the chart only after data has been loaded -->
	<canvas bind:this={chartCanvas} id="myChart" class="crosshair-cursor" width="900" />
{/if}

<style>
	.crosshair-cursor {
		cursor: crosshair;
	}
	.toggle_buttons {
		display: flex;
		justify-content: flex-start;
		align-items: flex-start;
		gap: 0.5rem;
		margin-bottom: 2rem;
	}

	.dot {
		display: inline-block;
		width: 10px; /* Size of the dot */
		height: 10px; /* Size of the dot */
		border-radius: 30%; /* Makes it circular */
		margin-left: 5px;
		margin-right: 5px;
	}

	canvas {
		position: relative;
		width: 100% !important;
		background-color: rgba(95, 95, 95, 0);
		padding: 1rem;
		height: auto !important;
		border-radius: 10px;
	}
	.button {
		margin-right: 0.5rem;
	}
	.button {
		display: inline-block;
		padding: 8px 8px; /* Adjusted padding to better fit form elements */
		font-size: 14px; /* Slightly reduced font size */
		font-weight: 400;
		letter-spacing: 1.5px;
		color: #252525;
		border-radius: 10px;
		background-color: #ffffff00;
		border: 1px solid rgba(0, 0, 255, 0.082);
		transition: all 0.3s ease 0s;
		text-align: center;
		text-decoration: none;
		cursor: pointer;
		white-space: nowrap;
	}

	.button:hover {
		box-shadow: 0px 5px 5px rgba(0, 0, 0, 0.1);
		transform: translateY(-3px);
	}

	.button:active {
		transform: translateY(1px);
	}

	.toggle-button {
		opacity: 0.5;
		display: flex;
		white-space: nowrap;
		align-items: center;
		justify-content: center;
		gap: 5px;
		background-color: #f5f5f500;
		color: #000;
		text-decoration: line-through;
		/* border: 2px solid #ccc; */
	}

	.toggle-button.active {
		background: linear-gradient(to right, #fafbff, #f8f8f8);
		/* color: #fff; */
		/* border-color: #070797; */

		opacity: 1;
		text-decoration: none;
	}
</style>
