<!-- src/lib/components/MiniLineChart.svelte -->
<script lang="ts">
	export let data: number[] = [];
	export let color: string = '#15fdb7'; // Default color
	export let width: number = 100;
	export let height: number = 50;

	let pathData = '';
	let minY = Math.min(...data);
	let maxY = Math.max(...data);

	// Handle cases where all data points are the same
	if (maxY - minY === 0) {
		maxY += 1;
	}

	$: generatePath();

	function generatePath() {
		if (data.length === 0) return;

		const stepX = width / (data.length - 1 || 1);
		pathData = data
			.map((value, index) => {
				const x = index * stepX;
				const y = height - ((value - minY) / (maxY - minY)) * height;
				return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
			})
			.join(' ');
	}

	// Generate a unique gradient ID
	const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`;
</script>

<svg {width} {height} viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg">
	<defs>
		<linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
			<stop offset="0%" stop-color={color} stop-opacity="0.2" />
			<stop offset="100%" stop-color={color} stop-opacity="0" />
		</linearGradient>
	</defs>

	<!-- Area under the line -->
	<path d="{pathData} L {width} {height} L 0 {height} Z" fill="url(#{gradientId})" stroke="none" />

	<!-- Line Path -->
	<path d={pathData} fill="none" stroke={color} stroke-width="2" />
</svg>

<style>
	svg {
		display: block;
		width: 100%;
		height: auto;
	}
</style>
