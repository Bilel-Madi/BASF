<!-- src/lib/components/chart/MultiLineChart.svelte -->

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Chart, registerables } from 'chart.js';
	import 'chartjs-adapter-date-fns';
	import type { Device } from '@prisma/client';
	import { DEVICE_READINGS } from '$lib/constants/deviceReadings';
	import { enUS } from 'date-fns/locale';

	Chart.register(...registerables);

	export let data: Array<{
		device: Device;
		data: Array<Record<string, any>>;
	}> = [];
	export let devices: Device[] = [];
	export let selectedDevices: Device[] = [];
	export let selectedReadings: string[] = [];
	export let timeFrame: string;
	export let timeFrames: string[] = [];

	let chartCanvas: HTMLCanvasElement;
	let chart: Chart;

	// Get available readings based on selected devices
	$: availableReadings = [
		...new Set(
			selectedDevices.flatMap(
				(device) => DEVICE_READINGS[device.type as keyof typeof DEVICE_READINGS] || []
			)
		)
	];

	// Define scale configurations for different reading types
	const SCALE_CONFIGS = {
		ec: {
			id: 'ec',
			position: 'right',
			min: 0,
			max: 3000,
			title: {
				display: true,
				text: 'EC (µS/cm)'
			},
			grid: {
				drawOnChartArea: false // only show grid for primary axis
			}
		},
		moisture: {
			id: 'moisture',
			position: 'left',
			min: 0,
			max: 60,
			title: {
				display: true,
				text: 'Moisture %'
			},
			grid: {
				drawOnChartArea: false,
				drawTicks: true
			},
			border: {
				display: true
			}
		},
		temperature: {
			id: 'temperature',
			position: 'left',
			min: 0,
			max: 50,
			title: {
				display: true,
				text: '°C'
			}
		},
		co2: {
			id: 'co2',
			position: 'right',
			min: 0,
			max: 2000,
			title: {
				display: true,
				text: 'PPM'
			},
			grid: {
				drawOnChartArea: false
			}
		},
		humidity: {
			id: 'humidity',
			position: 'left',
			min: 0,
			max: 100,
			title: {
				display: true,
				text: 'Humidity %'
			}
		},
		pressure: {
			id: 'pressure',
			position: 'right',
			min: 900,
			max: 1100,
			title: {
				display: true,
				text: 'hPa'
			},
			grid: {
				drawOnChartArea: false
			}
		}
	};

	function toggleDevice(device: Device) {
		selectedDevices = selectedDevices.includes(device)
			? selectedDevices.filter((d) => d !== device)
			: [...selectedDevices, device];

		// Clear readings that are no longer available
		const newAvailableReadings = DEVICE_READINGS[device.type as keyof typeof DEVICE_READINGS] || [];
		selectedReadings = selectedReadings.filter((reading) =>
			newAvailableReadings.some((r) => r.value === reading)
		);
	}

	function toggleReading(reading: string) {
		selectedReadings = selectedReadings.includes(reading)
			? selectedReadings.filter((r) => r !== reading)
			: [...selectedReadings, reading];
	}

	// Update chart when data or selections change
	$: if (chart && data) {
		updateChart();
	}

	function updateChart() {
		if (!chart) return;

		const datasets = [];
		const usedScales = new Set(['x']); // Always include x-axis
		const dataRanges: Record<string, { min: number; max: number }> = {};

		// First pass: collect all data points and find min/max for each reading type
		data.forEach((deviceData) => {
			if (!deviceData?.data) return;

			const deviceReadings =
				DEVICE_READINGS[deviceData.device.type as keyof typeof DEVICE_READINGS] || [];

			selectedReadings.forEach((readingType) => {
				if (deviceReadings.some((r) => r.value === readingType)) {
					const values = deviceData.data
						.filter((reading) => reading[readingType] !== undefined)
						.map((reading) => reading[readingType]);

					if (values.length > 0) {
						const min = Math.min(...values);
						const max = Math.max(...values);

						if (!dataRanges[readingType]) {
							dataRanges[readingType] = { min, max };
						} else {
							dataRanges[readingType].min = Math.min(dataRanges[readingType].min, min);
							dataRanges[readingType].max = Math.max(dataRanges[readingType].max, max);
						}
					}
				}
			});
		});

		// Update SCALE_CONFIGS with dynamic ranges
		const DYNAMIC_SCALE_CONFIGS = {
			...SCALE_CONFIGS,
			...Object.entries(dataRanges).reduce((acc, [readingType, range]) => {
				const padding = (range.max - range.min) * 0.1; // 10% padding
				const baseConfig = SCALE_CONFIGS[readingType];

				return {
					...acc,
					[readingType]: {
						...baseConfig,
						min: Math.floor(range.min - padding),
						max: Math.ceil(range.max + padding)
					}
				};
			}, {})
		};

		// Second pass: create datasets using the same logic as before
		data.forEach((deviceData) => {
			if (!deviceData?.data) return;

			const deviceReadings =
				DEVICE_READINGS[deviceData.device.type as keyof typeof DEVICE_READINGS] || [];

			selectedReadings.forEach((readingType) => {
				if (deviceReadings.some((r) => r.value === readingType)) {
					const scaleId = DYNAMIC_SCALE_CONFIGS[readingType]?.id || 'default';
					usedScales.add(scaleId);

					const dataset = {
						label: `${deviceData.device.name} - ${
							deviceReadings.find((r) => r.value === readingType)?.label || readingType
						}`,
						data: deviceData.data
							.filter((reading) => reading[readingType] !== undefined)
							.map((reading) => ({
								x: new Date(reading.receivedAt),
								y: reading[readingType]
							})),
						borderColor: getRandomColor(),
						fill: false,
						yAxisID: scaleId,
						pointRadius: 0,
						tension: 0.4
					};
					datasets.push(dataset);
				}
			});
		});

		// Find the date range in the data
		let firstDate: Date | null = null;
		let lastDate: Date | null = null;

		data.forEach((deviceData) => {
			if (!deviceData?.data?.length) return;

			deviceData.data.forEach((reading) => {
				const date = new Date(reading.receivedAt);
				if (!firstDate || date < firstDate) firstDate = date;
				if (!lastDate || date > lastDate) lastDate = date;
			});
		});

		if (firstDate && lastDate) {
			const timeUnit = getTimeUnit(firstDate, lastDate);

			// Update the time axis configuration
			chart.options.scales = {
				...chart.options.scales,
				x: {
					...chart.options.scales.x,
					time: {
						unit: timeUnit,
						displayFormats: {
							hour: 'HH:mm',
							day: 'MMM d',
							week: 'MMM d',
							month: 'MMM yyyy'
						}
					}
				}
			};
		}

		chart.data.datasets = datasets;
		chart.update();
	}

	onMount(() => {
		const ctx = chartCanvas.getContext('2d');
		if (!ctx) return;

		chart = new Chart(ctx, {
			type: 'line',
			data: { datasets: [] },
			options: {
				responsive: true,
				maintainAspectRatio: false,
				interaction: {
					mode: 'nearest',
					axis: 'x',
					intersect: false
				},
				scales: {
					x: {
						type: 'time',
						time: {
							unit: 'hour',
							displayFormats: {
								hour: 'HH:mm',
								day: 'MMM d',
								week: 'MMM d',
								month: 'MMM yyyy'
							}
						},
						ticks: {
							maxTicksLimit: 10,
							autoSkip: true,
							display: true
						},
						display: true,
						grid: {
							display: true
						},
						adapters: {
							date: {
								locale: enUS
							}
						}
					}
				},
				plugins: {
					legend: {
						position: 'top'
					},
					tooltip: {
						mode: 'index',
						intersect: false,
						callbacks: {
							label: function (context) {
								let label = context.dataset.label || '';
								if (label) {
									label += ': ';
								}
								const value = context.parsed.y;
								const readingType = context.dataset.label.split(' - ')[1].toLowerCase();

								// Add appropriate units
								if (readingType.includes('temperature')) {
									label += value.toFixed(1) + ' °C';
								} else if (readingType.includes('humidity') || readingType.includes('moisture')) {
									label += value.toFixed(1) + ' %';
								} else if (readingType.includes('ec')) {
									label += value.toFixed(0) + ' µS/cm';
								} else if (readingType.includes('co2')) {
									label += value.toFixed(0) + ' PPM';
								} else if (readingType.includes('pressure')) {
									label += value.toFixed(1) + ' hPa';
								} else {
									label += value.toFixed(1);
								}
								return label;
							}
						}
					}
				}
			}
		});
	});

	onDestroy(() => {
		if (chart) chart.destroy();
	});

	function getRandomColor() {
		const letters = '0123456789ABCDEF';
		let color = '#';
		for (let i = 0; i < 6; i++) {
			color += letters[Math.floor(Math.random() * 16)];
		}
		return color;
	}

	// Add this function to determine the appropriate time unit
	function getTimeUnit(firstDate: Date, lastDate: Date): string {
		const diffInHours = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60);

		if (diffInHours <= 24) return 'hour';
		if (diffInHours <= 72) return 'day'; // For 3 days
		if (diffInHours <= 168) return 'day'; // For 1 week
		if (diffInHours <= 336) return 'week'; // For 2 weeks
		if (diffInHours <= 730) return 'week'; // For 1 month
		if (diffInHours <= 2190) return 'month'; // For 3 months
		if (diffInHours <= 4380) return 'month'; // For 6 months
		return 'month'; // For anything longer
	}

	// Function to handle time frame change
	function handleTimeFrameChange(frame: string) {
		timeFrame = frame;
		// Dispatch an event to notify parent component
		dispatch('timeFrameChange', frame);
	}

	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();
</script>

<div class="chart-wrapper">
	<div class="controls">
		<div class="control-group">
			<details class="dropdown">
				<summary>Devices</summary>
				<div class="checkbox-list">
					{#each devices as device}
						<label class="checkbox-label">
							<input
								type="checkbox"
								checked={selectedDevices.includes(device)}
								on:change={() => toggleDevice(device)}
							/>
							<span class="device-name">
								{device.name}
								<span class="device-type">({device.type})</span>
							</span>
						</label>
					{/each}
				</div>
			</details>
		</div>

		<div class="control-group">
			<details class="dropdown">
				<summary>Readings</summary>
				<div class="checkbox-list">
					{#each availableReadings as reading}
						<label class="checkbox-label">
							<input
								type="checkbox"
								checked={selectedReadings.includes(reading.value)}
								on:change={() => toggleReading(reading.value)}
							/>
							{reading.label}
						</label>
					{/each}
				</div>
			</details>
		</div>
	</div>

	<div class="chart-container">
		<div class="chart-header">
			<div class="time-controls">
				{#each timeFrames as frame}
					<button
						class:selected={timeFrame === frame}
						on:click={() => handleTimeFrameChange(frame)}
					>
						{frame}
					</button>
				{/each}
			</div>
		</div>
		<canvas bind:this={chartCanvas} />
	</div>
</div>

<style>
	.chart-wrapper {
		height: 100%;
		display: flex;
		flex-direction: column;
		min-height: 0;
	}

	.controls {
		display: flex;
		gap: 2rem;
		margin-bottom: 1rem;
	}

	.control-group {
		flex: 1;
	}

	.dropdown {
		position: relative;
	}

	.dropdown summary {
		padding: 0.75rem 1rem;
		background: white;
		border: 1px solid #ddd;
		border-radius: 4px;
		cursor: pointer;
		font-weight: 600;
		user-select: none;
	}

	.dropdown summary:hover {
		background: #f8f9fa;
	}

	.dropdown summary:focus {
		outline: none;
		border-color: #007bff;
	}

	/* Remove default arrow */
	.dropdown summary::-webkit-details-marker {
		display: none;
	}

	/* Custom arrow */
	.dropdown summary::after {
		content: '▼';
		float: right;
		font-size: 0.8em;
		transition: transform 0.2s;
	}

	.dropdown[open] summary::after {
		transform: rotate(180deg);
	}

	.checkbox-list {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		margin-top: 0.25rem;
		background: white;
		border: 1px solid #ddd;
		border-radius: 4px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		z-index: 1000;
		max-height: 200px;
		overflow-y: auto;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		cursor: pointer;
	}

	.checkbox-label:hover {
		background: #f8f9fa;
	}

	.checkbox-label input {
		margin: 0;
	}

	.device-name {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.device-type {
		font-size: 0.8em;
		color: #666;
	}

	.chart-container {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
		position: relative;
	}

	.chart-header {
		flex: 0 0 auto;
		padding-bottom: 0.5rem;
	}

	.time-controls {
		display: flex;
		gap: 0.25rem;
		flex-wrap: wrap;
	}

	.time-controls button {
		padding: 0.25rem 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		background: white;
		cursor: pointer;
		font-size: 0.8rem;
	}

	.time-controls button.selected {
		background: #1b0ab1;
		color: white;
		border-color: #1b0ab1;
	}

	.time-controls button:hover:not(.selected) {
		background: #f0f0f0;
	}

	canvas {
		flex: 1;
		width: 100% !important;
		min-height: 0;
	}
</style>
