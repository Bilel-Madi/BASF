<!-- src/lib/components/MiniChart.svelte -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Chart from 'chart.js/auto';

	export let data: number[] = [];
	export let color: string = '#15fdb7'; // Default color
	export let width: number = 100;
	export let height: number = 50;
	export let label: string | undefined = undefined; // For modal view

	let chart;
	let canvas;

	onMount(() => {
		const ctx = canvas.getContext('2d');
		chart = new Chart(ctx, {
			type: 'line',
			data: {
				labels: data.map((_, index) => index), // x-axis labels (not displayed)
				datasets: [
					{
						data: data,
						borderColor: color,
						fill: 'none', // fill under the line
						tension: 0.4, // smoothness of the line
						pointRadius: 0, // no points
						borderWidth: 2 // make the line slimmer
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						display: false // no legend
					},
					tooltip: {
						enabled: false // disable tooltips
					}
				},
				scales: {
					x: {
						display: false, // hide x-axis
						grid: {
							display: false // hide x grid lines
						}
					},
					y: {
						display: false, // hide y-axis
						grid: {
							display: false // hide y grid lines
						},
						suggestedMin: Math.min(...data),
						suggestedMax: Math.max(...data)
					}
				}
			}
		});
	});

	$: if (chart) {
		// Update chart data when `data` changes
		chart.data.datasets[0].data = data;
		chart.update();
	}

	onDestroy(() => {
		// Clean up the chart instance
		if (chart) {
			chart.destroy();
		}
	});
</script>

<div class="chart-wrapper">
	{#if label}
		<div class="chart-label">{label}</div>
	{/if}
	<div class="chart-container" style="width: {width}px; height: {height}px;">
		<canvas bind:this={canvas} />
	</div>
</div>

<style>
	.chart-wrapper {
		position: relative;
	}

	.chart-container {
		position: relative;
		width: 100%;
		height: 100%;
	}

	canvas {
		display: block;
		width: 100%;
		height: 100%;
	}
</style>
