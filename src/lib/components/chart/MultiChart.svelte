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

	// Define base colors for each reading type
	const READING_COLORS = {
		moisture: {
			base: '#1976D2', // Main blue
			shades: [
				'#1976D2', // Main blue
				'#2196F3', // Lighter blue
				'#64B5F6', // Even lighter blue
				'#0D47A1', // Darker blue
				'#1565C0' // Another shade of blue
			]
		},
		temperature: {
			base: '#4CAF50', // Main green
			shades: [
				'#4CAF50', // Main green
				'#66BB6A', // Lighter green
				'#81C784', // Even lighter green
				'#2E7D32', // Darker green
				'#388E3C' // Another shade of green
			]
		},
		ec: {
			base: '#795548', // Main brown
			shades: [
				'#795548', // Main brown
				'#8D6E63', // Lighter brown
				'#A1887F', // Even lighter brown
				'#4E342E', // Darker brown
				'#5D4037' // Another shade of brown
			]
		},
		co2: {
			base: '#8BC34A', // Main lime green
			shades: [
				'#8BC34A', // Main lime green
				'#9CCC65', // Lighter lime green
				'#AED581', // Even lighter lime green
				'#558B2F', // Darker lime green
				'#689F38' // Another shade of lime green
			]
		},
		humidity: {
			base: '#9C27B0', // Main purple
			shades: [
				'#9C27B0', // Main purple
				'#AB47BC', // Lighter purple
				'#BA68C8', // Even lighter purple
				'#6A1B9A', // Darker purple
				'#7B1FA2' // Another shade of purple
			]
		},
		pressure: {
			base: '#FF9800', // Main orange
			shades: [
				'#FF9800', // Main orange
				'#FFA726', // Lighter orange
				'#FFB74D', // Even lighter orange
				'#E65100', // Darker orange
				'#EF6C00' // Another shade of orange
			]
		}
	};

	// Replace getRandomColor with this function
	function getReadingColor(readingType: string, index: number = 0): string {
		const normalizedType = readingType.toLowerCase();
		let colorConfig;

		// Find the matching color config
		for (const [type, config] of Object.entries(READING_COLORS)) {
			if (normalizedType.includes(type)) {
				colorConfig = config;
				break;
			}
		}

		if (!colorConfig) {
			// Fallback color if no match is found
			return '#757575';
		}

		// If there's only one device, use the base color
		if (selectedDevices.length === 1) {
			return colorConfig.base;
		}

		// Otherwise, use a shade based on the index
		return colorConfig.shades[index % colorConfig.shades.length];
	}

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
				drawOnChartArea: false,
				drawTicks: false,
				display: false
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
				drawTicks: false,
				display: false
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
			},
			grid: {
				drawOnChartArea: false,
				drawTicks: false,
				display: false
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
				drawOnChartArea: false,
				drawTicks: false,
				display: false
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
			},
			grid: {
				drawOnChartArea: false,
				drawTicks: false,
				display: false
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
				drawOnChartArea: false,
				drawTicks: false,
				display: false
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

		// Second pass: create datasets and track which scales are actually used
		data.forEach((deviceData, deviceIndex) => {
			if (!deviceData?.data) return;

			const deviceReadings =
				DEVICE_READINGS[deviceData.device.type as keyof typeof DEVICE_READINGS] || [];

			selectedReadings.forEach((readingType) => {
				if (deviceReadings.some((r) => r.value === readingType)) {
					const scaleId = DYNAMIC_SCALE_CONFIGS[readingType]?.id || 'default';
					usedScales.add(scaleId); // Track which scales are being used

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
						borderColor: getReadingColor(readingType, deviceIndex),
						backgroundColor: function (context) {
							const chart = context.chart;
							const { ctx } = chart;
							return getGradient(ctx, getReadingColor(readingType, deviceIndex));
						},
						fill: true,
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
				x: {
					type: 'time',
					time: {
						unit: timeUnit,
						displayFormats: {
							hour: 'HH:mm',
							day: 'MMM d',
							week: 'MMM d',
							month: 'MMM yyyy'
						}
					},
					grid: {
						display: true,
						drawOnChartArea: true
					}
				}
			};

			// Only add scales that are actually being used
			Object.entries(DYNAMIC_SCALE_CONFIGS).forEach(([readingType, scaleConfig]) => {
				if (usedScales.has(scaleConfig.id)) {
					chart.options.scales[scaleConfig.id] = {
						...scaleConfig,
						display: true, // Show axis
						grid: {
							drawOnChartArea: false,
							drawTicks: false,
							display: false
						}
					};
				}
			});

			chart.data.datasets = datasets;
			chart.update('none'); // Use 'none' animation for smoother updates
		}
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
				plugins: {
					legend: {
						position: 'top',
						labels: {
							usePointStyle: true,
							pointStyle: 'circle',
							boxWidth: 8,
							boxHeight: 8,
							padding: 20
						}
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
						grid: {
							display: true,
							drawOnChartArea: true
						},
						adapters: {
							date: {
								locale: enUS
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

	// Add this function near the top with your other utility functions
	function getGradient(ctx: CanvasRenderingContext2D, color: string): CanvasGradient {
		const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
		gradient.addColorStop(0, `${color}33`); // 20% opacity version of the color
		gradient.addColorStop(1, `${color}00`); // 0% opacity version of the color
		return gradient;
	}
</script>

<div class="chart-wrapper">
	<div class="chart-container">
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

	.chart-container {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
		position: relative;
	}

	canvas {
		flex: 1;
		width: 100% !important;
		min-height: 0;
	}
</style>
