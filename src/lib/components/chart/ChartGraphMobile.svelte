<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Chart, registerables } from 'chart.js';
	import 'chartjs-adapter-date-fns';
	import type { DataEntry } from '$lib/utils/dataFetch';

	Chart.register(...registerables);

	export let startDate: string;
	export let endDate: string;
	export let dataEntries: DataEntry[] = [];
	export let filteredIrrigationData: any[] = [];

	let chart;
	let chartCanvas;
	let datasetsVisibility = [true, false, false, true];

	let dropdownVisible = false;

	function toggleDropdown() {
		dropdownVisible = !dropdownVisible;
	}

	const colors = {
		blue: {
			default: 'rgba(51, 207, 237, 0.9)',
			half: 'rgba(0, 123, 255, 0.5)',
			quarter: 'rgba(0, 123, 255, 0.25)',
			zero: 'rgba(0, 123, 255, 0)'
		}
	};

	function createGradients(ctx, colors) {
		const blueGradient = ctx.createLinearGradient(0, 25, 0, 200);
		blueGradient.addColorStop(0, colors.blue.half);
		blueGradient.addColorStop(0.35, colors.blue.quarter);
		blueGradient.addColorStop(1, colors.blue.zero);
		return { blueGradient };
	}

	function calculateMinMax(values, minLimit, maxLimit) {
		const min = Math.min(...values);
		const max = Math.max(...values);
		return {
			min: Math.max(min, minLimit),
			max: Math.min(max, maxLimit)
		};
	}

	function toggleDataset(index) {
		if (chart) {
			datasetsVisibility[index] = !datasetsVisibility[index];
			chart.data.datasets[index].hidden = !datasetsVisibility[index];

			// Check visibility of each dataset and update the Y-axis scale
			chart.options.scales['y-moisture'].display = datasetsVisibility[0];
			chart.options.scales['y-temperature'].display = datasetsVisibility[1];
			chart.options.scales['y-ec'].display = datasetsVisibility[2];

			chart.update();
			dropdownVisible = false; // Close the dropdown after selection
		}
	}

	let thresholdDropdownVisible = false;
	let showMoistureBoxes = true; // Moisture Threshhold on by default
	let showTemperatureBoxes = false;
	let showECBoxes = false;

	function toggleThresholdDropdown() {
		thresholdDropdownVisible = !thresholdDropdownVisible;
	}

	function handleCheckboxChange(type) {
		if (type === 'moisture') {
			showMoistureBoxes = !showMoistureBoxes;
			if (showMoistureBoxes) {
				showTemperatureBoxes = false;
				showECBoxes = false;
			}
		} else if (type === 'temperature') {
			showTemperatureBoxes = !showTemperatureBoxes;
			if (showTemperatureBoxes) {
				showMoistureBoxes = false;
				showECBoxes = false;
			}
		} else if (type === 'ec') {
			showECBoxes = !showECBoxes;
			if (showECBoxes) {
				showMoistureBoxes = false;
				showTemperatureBoxes = false;
			}
		}
		if (chart) {
			chart.update();
			thresholdDropdownVisible = false; // Close the dropdown after selection
		}
	}
	// Custom plugin to draw annotation boxes based on the toggle state
	const annotationBoxPlugin = {
		id: 'annotationBox',
		beforeDraw(chart) {
			const { ctx, chartArea, scales } = chart;
			const { left, right } = chartArea;
			const boxWidth = right - left;

			if (showMoistureBoxes) {
				drawMoistureBoxes(ctx, scales, left, right, boxWidth);
			}
			if (showTemperatureBoxes) {
				drawTemperatureBoxes(ctx, scales, left, right, boxWidth);
			}
			if (showECBoxes) {
				drawECBoxes(ctx, scales, left, right, boxWidth);
			}
		}
	};
	function drawMoistureBoxes(ctx, scales, left, right, boxWidth) {
		const yMoistureScale = scales['y-moisture'];
		const moistureRanges = [
			{ lower: 10, upper: 15, color: 'rgba(255, 99, 71, 0.06)', lineColor: '#FF6347' },
			{ lower: 15, upper: 30, color: 'rgba(245, 243, 154, 0.06)', lineColor: '#00ff95' },
			{ lower: 30, upper: 50, color: 'rgba(0, 255, 149, 0.06)', lineColor: '#00ff95' },
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
			{ lower: 15, upper: 15, color: 'rgba(255, 99, 71, 0.06)', lineColor: '#FF6347' },
			{ lower: 15, upper: 20, color: 'rgba(245, 243, 154, 0.06)', lineColor: '#00ff95' },
			{ lower: 20, upper: 30, color: 'rgba(0, 255, 149, 0.06)', lineColor: '#00ff95' },
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
		const yECScale = scales['y-ec'];
		const ecRanges = [
			{ lower: 0, upper: 0.2, color: 'rgba(255, 99, 71, 0.06)', lineColor: '#FF6347' },
			{ lower: 0.2, upper: 0.45, color: 'rgba(245, 243, 154, 0.06)', lineColor: '#00ff95' },
			{ lower: 0.45, upper: 1.5, color: 'rgba(0, 255, 149, 0.06)', lineColor: '#00ff95' },
			{ lower: 1.5, upper: 3, color: 'rgba(0, 255, 149, 0.0)', lineColor: '#00ff95' }
		];

		ecRanges.forEach((range, index) => {
			const boxTop = yECScale.getPixelForValue(range.upper);
			const boxBottom = yECScale.getPixelForValue(range.lower);
			const boxHeight = boxBottom - boxTop;

			ctx.save();
			ctx.fillStyle = range.color;
			ctx.fillRect(left, boxTop, boxWidth, boxHeight);

			// Draw the dashed line unless it's the highest box
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
	Chart.register(annotationBoxPlugin);

	const topBorderPlugin = {
		id: 'topBorder',
		afterDraw(chart) {
			const { ctx, chartArea } = chart;
			const { top, left, right } = chartArea;

			ctx.save();
			ctx.beginPath();
			ctx.moveTo(left, top);
			ctx.lineTo(right, top);
			ctx.lineWidth = 1; // Set the line width
			ctx.strokeStyle = 'rgba(3, 3, 89, 0.2)'; // Set the line color
			ctx.stroke();
			ctx.restore();
		}
	};

	Chart.register(topBorderPlugin);

	onMount(() => {
		const ctx = chartCanvas.getContext('2d');
		const gradients = createGradients(ctx, colors);

		const moistureValues = dataEntries.map((entry) => entry.moisture);
		const temperatureValues = dataEntries.map((entry) => entry.temperature);
		const ecValues = dataEntries.map((entry) => entry.ec);

		const { min: minMoisture, max: maxMoisture } = calculateMinMax(moistureValues, 20, 60);
		const { min: minTemperature, max: maxTemperature } = calculateMinMax(temperatureValues, 10, 40);
		const { min: minEC, max: maxEC } = calculateMinMax(ecValues, 0, 3);

		// Calculate the time range
		const start = new Date(startDate);
		const end = new Date(endDate);
		const timeRangeInHours = (end - start) / (1000 * 60 * 60);
		const timeUnit = timeRangeInHours <= 24 ? 'hour' : 'day';

		chart = new Chart(ctx, {
			type: 'line',
			data: {
				datasets: [
					{
						label: 'Moisture',
						yAxisID: 'y-moisture',
						type: 'line',
						fill: true,
						data: dataEntries.map((entry) => ({
							x: new Date(entry.received_at),
							y: entry.moisture
						})),
						backgroundColor: gradients.blueGradient,
						pointBackgroundColor: colors.blue.half,
						borderColor: colors.blue.default,
						tension: 0.4,
						borderWidth: 2.5,
						pointRadius: 0,
						pointHitRadius: 55,
						pointHoverRadius: 5,
						hidden: !datasetsVisibility[0]
					},
					{
						label: 'Soil Temperature',
						yAxisID: 'y-temperature',
						type: 'line',
						fill: false,
						backgroundColor: '#00ff95',
						data: dataEntries.map((entry) => ({
							x: new Date(entry.received_at),
							y: entry.temperature
						})),
						borderColor: '#00ff95',
						tension: 0.4,
						borderWidth: 2.5,
						pointRadius: 0,
						pointHitRadius: 55,
						pointHoverRadius: 5,
						hidden: !datasetsVisibility[1]
					},
					{
						label: 'Electrical Conductivity',
						yAxisID: 'y-ec',
						type: 'line',
						borderColor: '#4d8fc9',
						backgroundColor: colors.blue.default,
						data: dataEntries.map((entry) => ({
							x: new Date(entry.received_at),
							y: entry.ec
						})),
						tension: 0.4,
						borderWidth: 2.5,
						pointRadius: 0,
						pointHitRadius: 55,
						pointHoverRadius: 5,
						hidden: !datasetsVisibility[2]
					},
					{
						label: 'Irrigation Duration',
						data: filteredIrrigationData.map((entry) => ({
							x: new Date(entry.startTime),
							y: entry.duration
						})),
						backgroundColor: 'rgba(153, 102, 255, 0.1)',
						hoverBackgroundColor: 'rgba(153, 102, 255, 0.2)',
						type: 'bar',
						yAxisID: 'y-moisture',
						borderRadius: 5,
						order: 2,
						hidden: !datasetsVisibility[3]
					}
				]
			},
			options: {
				animation: false,
				scales: {
					x: {
						type: 'time',
						time: {
							unit: 'day'
						},
						ticks: {
							source: 'auto',
							maxTicksLimit: 6, // Adjust based on your date range
							font: {
								size: 11
							},
							autoSkip: true,
							align: 'center',
							padding: 2,
							color: '#030359'
						},
						title: {
							display: false,
							text: 'Date'
						},
						grid: {
							display: true,
							drawOnChartArea: true,
							drawTicks: true,
							tickLength: 5,
							tickWidth: 5,
							color: 'rgba(3, 3, 89, 0.2)'
						},
						border: {
							color: 'rgba(3, 3, 89, 0.3)',
							width: 1
						},
						offset: false
					},
					'y-moisture': {
						display: true,
						type: 'linear',
						position: 'left',
						grid: {
							display: true,
							drawOnChartArea: false,
							drawTicks: true,
							tickLength: 5,
							tickWidth: 1,
							color: 'rgba(60, 55, 205, 1)'
						},
						title: {
							display: false,
							align: 'start',
							text: 'VWC %',
							color: '#050575',
							font: {
								size: 14
							},
							padding: {
								top: 4,
								bottom: 2
							}
						},
						ticks: {
							callback: function (value) {
								return `${value}%`;
							},
							color: '#030359',
							padding: 1,
							maxTicksLimit: 10
						},
						border: {
							color: 'rgba(3, 3, 89, 0.3)',
							width: 1
						},
						min: 10,
						max: 60
					},
					'y-temperature': {
						display: false,
						type: 'linear',
						position: 'right',
						grid: {
							display: true,
							drawOnChartArea: false,
							drawTicks: true,
							tickLength: 5,
							tickWidth: 1,
							color: 'rgba(60, 55, 205, 1)'
						},
						title: {
							display: false,
							align: 'start',
							text: 'Temp °C ',
							color: '#050575',
							font: {
								size: 14
							},
							padding: {
								top: 2,
								bottom: 2
							}
						},
						ticks: {
							callback: function (value) {
								return `${value}°C`;
							},
							color: '#030359',
							padding: 1,
							maxTicksLimit: 10
						},
						border: {
							color: 'rgba(3, 3, 89, 0.3)',
							width: 1
						},
						min: 15,
						max: 35
					},
					'y-ec': {
						display: false,
						type: 'linear',
						position: 'left',
						grid: {
							display: true,
							drawOnChartArea: false,
							drawTicks: true,
							tickLength: 5,
							tickWidth: 1,
							color: 'rgba(60, 55, 205, 1)'
						},
						title: {
							display: false,
							align: 'start',
							text: 'EC (m/cm)',
							color: '#050575',
							font: {
								size: 14
							},
							padding: {
								top: 2,
								bottom: 2
							}
						},
						ticks: {
							color: '#030359',
							padding: 1,
							maxTicksLimit: 10
						},
						border: {
							color: 'rgba(3, 3, 89, 0.3)',
							width: 1
						},
						min: 0,
						max: 3
					}

					// irrigation: {
					// 	type: 'linear',
					// 	position: 'right',
					// 	grid: {
					// 		display: true,
					// 		drawOnChartArea: false,
					// 		drawTicks: true,
					// 		tickLength: 7,
					// 		tickWidth: 1,
					// 		color: 'rgba(60, 55, 205, 1)'
					// 	},
					// 	title: {
					// 		display: true,
					// 		align: 'start',
					// 		text: 'Irrigation Duration (m)',
					// 		color: '#050575',
					// 		font: {
					// 			size: 14
					// 		}
					// 	},
					// 	ticks: {
					// 		color: '#030359',
					// 		padding: 4,
					// 		maxTicksLimit: 15
					// 	},
					// 	border: {
					// 		color: 'rgba(3, 3, 89, 0.3)',
					// 		width: 1
					// 	}
					// }
				},
				layout: {
					padding: {
						left: 0,
						right: 0,
						top: 0,
						bottom: 0
					}
				},

				borderRadius: 10,
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					// horizontalCrosshairPlugin: {},
					annotationBox: {},
					topBorderPlugin: {},

					// weatherIconsPlugin: {},
					legend: {
						display: false,
						position: 'top'
					}
					// tooltip: {
					// 	mode: 'index',
					// 	intersect: false,
					// 	titleFont: {
					// 		size: 14
					// 	},
					// 	bodyFont: {
					// 		size: 12
					// 	},
					// 	padding: {
					// 		left: 5,
					// 		right: 5,
					// 		top: 5,
					// 		bottom: 5
					// 	},
					// 	enabled: true,
					// 	borderWidth: 0.1,
					// 	borderColor: '#070797',
					// 	position: 'nearest',
					// 	displayColors: true,
					// 	backgroundColor: '#fff',
					// 	titleColor: '#070797',
					// 	bodyColor: '#070797',
					// 	cornerRadius: 5,
					// 	boxPadding: 5,
					// 	usePointStyle: true,
					// 	titleMarginBottom: 5,
					// 	footerFont: {
					// 		size: 1110,
					// 		style: 'normal',
					// 		weight: 'lighter'
					// 	},
					// 	footerAlign: 'left',
					// 	footerSpacing: 5,
					// 	footerMarginTop: 5,
					// 	footerColor: '#070797',
					// 	caretPadding: 20,
					// 	caretSize: 5,
					// 	callbacks: {
					// 		footer: function (tooltipItems) {
					// 			const tooltipItem = tooltipItems[0];
					// 			const dataPoint = tooltipItem.raw;
					// 			// return `Data accuracy: ±2%.`;
					// 		}
					// 	}
					// }
					// Crosshair: {
					// 	line: {
					// 		color: '#030359',
					// 		width: 0.5,
					// 		dashPattern: [5, 5]
					// 	},

					// 	sync: {
					// 		enabled: false
					// 	},
					// 	snap: {
					// 		enabled: true
					// 	}
					// }
				},
				interaction: {
					mode: 'nearest', // intersect mode to nearest
					intersect: false, // ensures lines intersect even if not exactly on the point
					axis: 'x' // restrict interaction to the x-axis
				},
				hover: {
					mode: 'nearest', // intersect mode to nearest
					intersect: false // ensures lines intersect even if not exactly on the point
				}
			}
		});
	});

	$: {
		if (chart) {
			chart.data.datasets[0].data = dataEntries.map((entry) => ({
				x: new Date(entry.received_at),
				y: entry.moisture
			}));
			chart.data.datasets[1].data = dataEntries.map((entry) => ({
				x: new Date(entry.received_at),
				y: entry.temperature
			}));
			chart.data.datasets[2].data = dataEntries.map((entry) => ({
				x: new Date(entry.received_at),
				y: entry.ec
			}));
			chart.data.datasets[3].data = filteredIrrigationData.map((entry) => ({
				x: new Date(entry.startTime),
				y: entry.duration
			}));
			chart.update();
		}
	}

	onDestroy(() => {
		if (chart) {
			chart.destroy();
		}
	});
</script>

<div class="container">
	<div class="dropdown-row">
		<div class="dropdown">
			<button class="dropdown-toggle" on:click={toggleDropdown}>
				Select Dataset <span class={dropdownVisible ? 'arrow-up' : 'arrow-down'} />
			</button>
			<div class="dropdown-menu {dropdownVisible ? 'visible' : ''}">
				<button on:click={() => toggleDataset(0)} class:inactive={!datasetsVisibility[0]}>
					<span class="legend-circle" style="background-color: rgba(51, 207, 237, 0.9);" />
					Moisture
				</button>
				<button on:click={() => toggleDataset(1)} class:inactive={!datasetsVisibility[1]}>
					<span class="legend-circle" style="background-color: #00ff95;" />
					Soil Temperature
				</button>
				<button on:click={() => toggleDataset(2)} class:inactive={!datasetsVisibility[2]}>
					<span class="legend-circle" style="background-color: #4d8fc9;" />
					Electrical Conductivity
				</button>
				<button on:click={() => toggleDataset(3)} class:inactive={!datasetsVisibility[3]}>
					<span class="legend-circle" style="background-color: rgba(153, 102, 255, 0.8);" />
					Irrigation Duration
				</button>
			</div>
		</div>

		<div class="dropdown">
			<button class="dropdown-toggle" on:click={toggleThresholdDropdown}>
				Thresholds <span class={thresholdDropdownVisible ? 'arrow-up' : 'arrow-down'} />
			</button>
			<div class="dropdown-menu {thresholdDropdownVisible ? 'visible' : ''}">
				<button
					on:click={() => handleCheckboxChange('moisture')}
					class:inactive={!showMoistureBoxes}
				>
					<span class="legend-circle" style="background-color: rgba(51, 207, 237, 0.9);" />
					Moisture Threshold
				</button>
				<button
					on:click={() => handleCheckboxChange('temperature')}
					class:inactive={!showTemperatureBoxes}
				>
					<span class="legend-circle" style="background-color: #00ff95;" />
					Temperature Threshold
				</button>
				<button on:click={() => handleCheckboxChange('ec')} class:inactive={!showECBoxes}>
					<span class="legend-circle" style="background-color: #4d8fc9;" />
					EC Threshold
				</button>
			</div>
		</div>
	</div>

	<div class="chart-container">
		<canvas bind:this={chartCanvas} class="crosshair-cursor" width="900" />
	</div>
</div>

<style>
	.crosshair-cursor {
		cursor: crosshair;
	}

	canvas {
		width: 100%;
		background-color: rgba(95, 95, 95, 0);
		padding: 1rem 0rem 0rem 0rem;
		border-radius: 10px;
	}
	.chart-container {
		width: 100%;
		height: 300px;
		position: relative;
	}

	.legend-circle {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		margin-right: 8px;
	}

	.inactive {
		text-decoration: line-through;
		color: lightgrey;
	}

	.inactive .legend-circle {
		background-color: grey;
	}
	.container {
		padding-top: 0rem; /* Adjust this value to push everything down */
	}

	.dropdown-toggle {
		background-color: #f8f8f8;
		color: rgb(1, 19, 78);
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 10px;
		cursor: pointer;
		font-size: 1rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.arrow-down::after,
	.arrow-up::after {
		content: '';
		display: inline-block;
		width: 0;
		height: 0;
		margin-left: 0.5rem;
		vertical-align: middle;
		border-left: 0.3rem solid transparent;
		border-right: 0.3rem solid transparent;
	}

	.arrow-down::after {
		border-top: 0.3rem solid rgb(1, 19, 78);
	}

	.arrow-up::after {
		border-bottom: 0.3rem solid rgb(1, 19, 78);
	}

	.dropdown-menu {
		display: none;
		position: absolute;
		background-color: #f8f8f8;
		box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
		border-radius: 20px;
		padding: 10px 0;
		z-index: 1;
	}

	.dropdown-menu.visible {
		display: block;
	}

	.dropdown-menu button {
		background-color: #f8f8f8;
		color: rgb(1, 19, 78);
		padding: 0.5rem 1rem;
		border: none;
		text-align: left;
		width: 100%;
		box-sizing: border-box;
		cursor: pointer;
		font-size: 1rem;
		display: flex;
		align-items: center;
	}

	.dropdown-menu button:hover {
		background-color: #bbbbbb;
	}

	.legend-circle {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		margin-right: 8px;
	}

	.dropdown-row {
		display: flex;
		gap: 0.5rem; /* Adjust the gap between dropdowns as needed */
		margin-bottom: 0rem;
	}
</style>
