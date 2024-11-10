<!-- src/lib/components/icons/BatteryIcon.svelte -->
<script lang="ts">
	export let level: number; // Battery level from 0 to 100

	// Determine battery status color based on level
	let color = '#4CAF50'; // Green by default
	if (level < 20) {
		color = '#F44336'; // Red
	} else if (level < 50) {
		color = '#FFC107'; // Yellow
	}
</script>

<svg
	width="24"
	height="24"
	viewBox="0 0 24 24"
	fill="none"
	xmlns="http://www.w3.org/2000/svg"
	aria-label={`Battery level: ${level}%`}
>
	<!-- Battery Body -->
	<rect x="1" y="6" width="18" height="12" rx="2" stroke={color} stroke-width="2" fill="none" />
	<!-- Battery Tip -->
	<rect x="20" y="10" width="2" height="4" fill={color} />
	<!-- Battery Level -->
	<rect x="3" y="8" width={(level / 100) * 14} height="8" fill={color} rx="1" />
</svg>

<style>
	svg {
		vertical-align: middle;
	}
</style>
