<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Chart, registerables } from 'chart.js';
	import { DateTime } from 'luxon';
	import 'chartjs-scale-timestack';
	import type { Device } from '@prisma/client';
	import { DEVICE_READINGS } from '$lib/constants/deviceReadings';

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
			shades: ['#1976D2', '#2196F3', '#64B5F6', '#0D47A1', '#1565C0']
		},
		temperature: {
			base: '#4CAF50', // Main green
			shades: ['#4CAF50', '#66BB6A', '#81C784', '#2E7D32', '#388E3C']
		},
		ec: {
			base: '#795548', // Main brown
			shades: ['#795548', '#8D6E63', '#A1887F', '#4E342E', '#5D4037']
		},
		co2: {
			base: '#8BC34A', // Main lime green
			shades: ['#8BC34A', '#9CCC65', '#AED581', '#558B2F', '#689F38']
		},
		humidity: {
			base: '#9C27B0', // Main purple
			shades: ['#9C27B0', '#AB47BC', '#BA68C8', '#6A1B9A', '#7B1FA2']
		},
		pressure: {
			base: '#FF9800', // Main orange
			shades: ['#FF9800', '#FFA726', '#FFB74D', '#E65100', '#EF6C00']
		}
	};

	function getReadingColor(readingType: string, index: number = 0): string {
		const normalizedType = readingType.toLowerCase();
		let colorConfig;

		for (const [type, config] of Object.entries(READING_COLORS)) {
			if (normalizedType.includes(type)) {
				colorConfig = config;
				break;
			}
		}

		if (!colorConfig) {
			return '#757575';
		}

		if (selectedDevices.length === 1) {
			return colorConfig.base;
		}

		return colorConfig.shades[index % colorConfig.shades.length];
	}

	const SCALE_CONFIGS = {
		ec: {
			id: 'ec',
			position: 'left',
			min: 200,
			max: 1500,
			title: {
				display: true,
				text: 'EC (µS/cm)',
				position: 'top',
				align: 'start',
				color: '#050575',
				font: {
					size: 14
				},
				padding: {
					top: 14
				}
			},
			ticks: {
				color: '#030359',
				padding: 4
			},
			border: {
				display: true,
				color: 'rgba(3, 3, 89, 0.3)',
				width: 1
			}
		},
		moisture: {
			id: 'moisture',
			position: 'left',
			min: 10,
			max: 45,
			title: {
				display: true,
				text: 'Moisture RH',
				position: 'top',
				align: 'start',
				color: '#050575',
				font: {
					size: 14
				},
				padding: {
					top: 14
				}
			},
			ticks: {
				callback: function (value) {
					return `${value}%`;
				},
				color: '#030359',
				padding: 4
			},

			border: {
				display: true,
				color: 'rgba(3, 3, 89, 0.3)',
				width: 1
			}
		},
		temperature: {
			id: 'temperature',
			position: 'right',
			min: 0,
			max: 50,
			title: {
				display: true,
				text: 'Temperature °C',
				position: 'top',
				align: 'start',
				color: '#050575',
				font: {
					size: 14
				},
				padding: {
					top: 14
				}
			},
			ticks: {
				callback: function (value) {
					return `${value}°C`;
				},
				color: '#030359',
				padding: 4
			},
			border: {
				display: true,
				color: 'rgba(3, 3, 89, 0.3)',
				width: 1
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

	$: if (chart && data) {
		updateChart();
	}

	function updateChart() {
		if (!chart) return;

		const datasets = [];
		const usedScales = new Set(['x']); // Always include x-axis

		data.forEach((deviceData, deviceIndex) => {
			if (!deviceData?.data) return;

			const deviceReadings =
				DEVICE_READINGS[deviceData.device.type as keyof typeof DEVICE_READINGS] || [];

			selectedReadings.forEach((readingType) => {
				if (deviceReadings.some((r) => r.value === readingType)) {
					const scaleId = SCALE_CONFIGS[readingType]?.id || 'default';
					usedScales.add(scaleId);

					const color = getReadingColor(readingType, deviceIndex);
					const dataset = {
						label: `${deviceData.device.name} - ${
							deviceReadings.find((r) => r.value === readingType)?.label || readingType
						}`,
						data: deviceData.data
							.filter((reading) => reading[readingType] !== undefined)
							.map((reading) => ({
								x: new Date(reading.receivedAt).getTime(), // Convert to milliseconds
								y: reading[readingType]
							})),
						borderColor: color,
						backgroundColor:
							readingType === 'moisture'
								? function (context) {
										const chart = context.chart;
										const { ctx } = chart;
										return getGradient(ctx, color);
								  }
								: color,
						fill: readingType === 'moisture',
						yAxisID: scaleId,
						tension: 0.1,
						borderWidth: 2.5,
						pointRadius: 0,
						pointHitRadius: 55,
						pointHoverRadius: 5
					};
					datasets.push(dataset);
				}
			});
		});

		// Only add scales that are actually being used
		chart.options.scales = {
			x: {
				type: 'timestack',
				timescale: {
					datetime: {
						zone: 'local',
						locale: 'en-US'
					},
					density: 0.5
				},
				ticks: {
					color: '#000238', // Blue color for the text
					align: 'center',
					padding: 2,
					font: {
						size: 11
					}
				},
				grid: {
					color: '#e8e8e8',
					drawTicks: true,
					tickLength: 8,
					tickWidth: 4
				}
			}
		};

		Object.entries(SCALE_CONFIGS).forEach(([readingType, scaleConfig]) => {
			if (usedScales.has(scaleConfig.id)) {
				chart.options.scales[scaleConfig.id] = {
					...scaleConfig,
					display: true,
					grid: {
						drawOnChartArea: false,
						drawTicks: true,
						display: true,
						tickLength: 6,
						tickWidth: 1,
						color: 'rgba(60, 55, 205, 1)'
					}
				};
			}
		});

		chart.data.datasets = datasets;
		chart.update('none');
	}

	// Add this plugin definition before the onMount function
	const topBorderPlugin = {
		id: 'topBorder',
		beforeDraw(chart: Chart) {
			const { ctx, chartArea } = chart;
			if (!chartArea) return;

			ctx.save();
			ctx.beginPath();
			ctx.strokeStyle = '#e8e8e8';
			ctx.lineWidth = 1;
			ctx.moveTo(chartArea.left, chartArea.top);
			ctx.lineTo(chartArea.right, chartArea.top);
			ctx.stroke();
			ctx.restore();
		}
	};

	// Register the plugin globally
	Chart.register(topBorderPlugin);

	// Add these new constants for the ranges
	const ANNOTATION_RANGES = {
		moisture: [
			{ lower: 10, upper: 15, color: 'rgba(255, 99, 71, 0.03)', lineColor: '#FF6347' },
			{ lower: 15, upper: 25, color: 'rgba(245, 243, 154, 0.03)', lineColor: '#00ff95' },
			{ lower: 25, upper: 40, color: 'rgba(0, 255, 149, 0.03)', lineColor: '#00ff95' },
			{ lower: 40, upper: 45, color: 'rgba(173, 216, 230, 0.0)', lineColor: '#00ff95' }
		]
		// Add other reading types as needed
	};

	// Add this before the chart initialization
	const annotationBoxPlugin = {
		id: 'annotationBox',
		beforeDraw(chart) {
			const { ctx, chartArea, scales } = chart;
			if (!chartArea) return;

			const { left, right } = chartArea;
			const boxWidth = right - left;

			// Draw boxes for each reading type that has a scale
			Object.entries(ANNOTATION_RANGES).forEach(([readingType, ranges]) => {
				const scaleId = SCALE_CONFIGS[readingType]?.id;
				if (scales[scaleId]) {
					drawAnnotationBoxes(ctx, scales[scaleId], left, right, boxWidth, ranges);
				}
			});
		}
	};

	function drawAnnotationBoxes(ctx, scale, left, right, boxWidth, ranges) {
		ranges.forEach((range, index) => {
			const boxTop = scale.getPixelForValue(range.upper);
			const boxBottom = scale.getPixelForValue(range.lower);
			const boxHeight = boxBottom - boxTop;

			ctx.save();

			// Draw the filled box
			ctx.fillStyle = range.color;
			ctx.fillRect(left, boxTop, boxWidth, boxHeight);

			// Draw the dashed line unless it's the highest box
			if (index !== ranges.length - 1) {
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

	// Register the plugin globally
	Chart.register(annotationBoxPlugin);

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
					topBorder: {},
					legend: {
						position: 'bottom',
						align: 'start',

						labels: {
							usePointStyle: true,
							pointStyle: 'circle',
							boxWidth: 8,
							boxHeight: 8,
							padding: 10,
							color: '#050575',
							font: {
								size: 12,
								weight: '200'
							}
						}
					},
					tooltip: {
						mode: 'index',
						intersect: false,
						callbacks: {
							title: function (context) {
								const timestamp = context[0].parsed.x;
								return DateTime.fromMillis(timestamp).toLocaleString(DateTime.DATETIME_MED);
							},
							label: function (context) {
								let label = context.dataset.label || '';
								if (label) {
									label += ': ';
								}
								const value = context.parsed.y;
								const readingType = context.dataset.label.split(' - ')[1].toLowerCase();

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
					},
					annotationBox: {}
				},
				scales: {
					x: {
						type: 'timestack',
						timescale: {
							datetime: {
								zone: 'local',
								locale: 'en-US'
							},
							density: 0.5
						},
						ticks: {
							color: '#1976D2' // Blue color for the text
						},
						grid: {
							color: '#1976D2' // Blue color for the ticks
						}
					}
					// Y-axes will be added dynamically in updateChart()
				}
			}
		});
	});

	onDestroy(() => {
		if (chart) chart.destroy();
	});

	function getGradient(ctx: CanvasRenderingContext2D, color: string): CanvasGradient {
		const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
		gradient.addColorStop(0, `${color}33`); // 20% opacity version of the color
		gradient.addColorStop(0.5, `${color}00`); // 0% opacity version of the color
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
