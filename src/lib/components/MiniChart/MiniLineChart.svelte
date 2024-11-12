<!-- src/lib/components/MiniLineChart.svelte -->
<script lang="ts">
	export let data: number[] = [];
	export let color: string = '#15fdb7'; // Default color
	export let width: number = 100;
	export let height: number = 50;
	export let label: string | undefined = undefined; // Add label prop for modal view

	let pathData = '';

	// Add safety checks for data
	$: validData = data.filter((n) => n !== null && !isNaN(n));
	$: minY = validData.length ? Math.min(...validData) : 0;
	$: maxY = validData.length ? Math.max(...validData) : 1;

	// Adjust the range if all values are the same
	$: if (maxY === minY) {
		maxY += maxY * 0.1 || 1;
		minY -= minY * 0.1 || 0;
	}

	$: generatePath(validData, width, height, minY, maxY);

	function generatePath(data: number[], width: number, height: number, minY: number, maxY: number) {
		if (data.length === 0) return;

		const stepX = width / (data.length - 1 || 1);
		pathData = data
			.map((value, index) => {
				const x = index * stepX;
				const y = height - ((value - minY) / (maxY - minY)) * height;
				return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
			})
			.join(' ');
	}

	// Generate a unique gradient ID
	const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`;
</script>

<div class="chart-wrapper">
	{#if label}
		<div class="chart-label">{label}</div>
	{/if}
	<svg {width} {height} viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg">
		<defs>
			<linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
				<stop offset="0%" stop-color={color} stop-opacity="0.2" />
				<stop offset="100%" stop-color={color} stop-opacity="0" />
			</linearGradient>
		</defs>

		<!-- Area under the line -->
		<path
			d="{pathData} L {width} {height} L 0 {height} Z"
			fill="url(#{gradientId})"
			stroke="none"
		/>

		<!-- Line Path -->
		<path d={pathData} fill="none" stroke={color} stroke-width="2" />
	</svg>
</div>

<style>
	svg {
		display: block;
		width: 100%;
		height: auto;
	}
</style>
