<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import Chart from 'chart.js/auto';
	import 'chartjs-adapter-date-fns';

	export let datasets = [];
	export let options = {};
	export let title = '';
	export let xAxisLabel = '';
	export let yAxisLabel = '';
	export let dateRangeButtons = ['1d', '3d', '1w', '1m', '3m', '6m', '1y', 'all'];
	export let initialRange = '1d';

	let canvas: HTMLCanvasElement;
	let chart: Chart;
	let currentRange = initialRange;
	let startDate: string = '';
	let endDate: string = '';

	const dispatch = createEventDispatcher();

	$: if (datasets && canvas) {
		createChart();
	}

	function setDateRange(range: string) {
		currentRange = range;
		startDate = '';
		endDate = '';
		dispatch('rangeChange', { range });
	}

	function handleCustomDateChange() {
		if (startDate && endDate) {
			dispatch('dateRangeChange', {
				dateRange: {
					start: new Date(startDate),
					end: new Date(endDate)
				}
			});
		}
	}

	onMount(() => {
		createChart();
	});

	onDestroy(() => {
		if (chart) {
			chart.destroy();
		}
	});

	function createChart() {
		if (chart) {
			chart.destroy();
		}

		console.log('Creating chart with datasets:', datasets);

		const data = {
			datasets: datasets.map((dataset) => ({
				label: dataset.label,
				data: dataset.data,
				borderColor: dataset.color,
				backgroundColor: dataset.color,
				fill: false,
				tension: 0.1,
				pointRadius: 0,
				yAxisID: dataset.yAxisID || 'y',
				parsing: {
					xAxisKey: 'x',
					yAxisKey: 'y'
				}
			}))
		};

		const defaultOptions = {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				title: {
					display: !!title,
					text: title
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
						unit: 'hour'
					},
					title: {
						display: !!xAxisLabel,
						text: xAxisLabel
					}
				},
				y: {
					type: 'linear',
					display: true,
					position: 'left',
					title: {
						display: !!yAxisLabel,
						text: yAxisLabel
					}
				}
			}
		};

		const chartOptions = { ...defaultOptions, ...options };

		chart = new Chart(canvas, {
			type: 'line',
			data,
			options: chartOptions
		});
	}
</script>

<div class="chart-container">
	<div class="range-buttons">
		{#each dateRangeButtons as rangeButton}
			<button
				class:selected={currentRange === rangeButton}
				on:click={() => setDateRange(rangeButton)}
			>
				{rangeButton}
			</button>
		{/each}
		<button class:selected={currentRange === 'custom'} on:click={() => (currentRange = 'custom')}>
			Custom
		</button>
	</div>

	{#if currentRange === 'custom'}
		<div class="date-picker">
			<input
				type="date"
				bind:value={startDate}
				on:change={handleCustomDateChange}
				max={endDate || undefined}
			/>
			<span>to</span>
			<input
				type="date"
				bind:value={endDate}
				on:change={handleCustomDateChange}
				min={startDate || undefined}
			/>
		</div>
	{/if}

	<canvas bind:this={canvas} />
</div>

<style>
	.chart-container {
		position: relative;
		width: 100%;
		height: 400px;
	}

	.range-buttons {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.range-buttons button {
		padding: 0.5rem 1rem;
		border: none;
		background-color: #e0e0e0;
		cursor: pointer;
		border-radius: 4px;
	}

	.range-buttons button.selected {
		background-color: #007bff;
		color: white;
	}

	.date-picker {
		margin-bottom: 1rem;
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	input[type='date'] {
		padding: 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
	}
</style>
