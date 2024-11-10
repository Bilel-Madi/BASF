<!-- src/lib/components/icons/SignalIcon.svelte -->
<script lang="ts">
	export let strength: number | null;
	export let label: string = ''; // 'SNR' or 'RSSI'

	let signalLevel = 0;

	if (strength !== null && strength !== undefined) {
		if (label === 'SNR') {
			// SNR ranges typically from -20 to +20
			signalLevel = Math.floor(((strength + 20) / 40) * 100); // Normalize to 0-100
		} else if (label === 'RSSI') {
			// RSSI ranges typically from -150 to 0
			signalLevel = Math.floor(((strength + 150) / 150) * 100); // Normalize to 0-100
		}
		signalLevel = Math.min(Math.max(signalLevel, 0), 100);
	}

	// Determine color based on signal strength
	let color = '#9E9E9E'; // Grey by default
	if (signalLevel > 66) {
		color = '#4CAF50'; // Green
	} else if (signalLevel > 33) {
		color = '#FFC107'; // Yellow
	} else if (signalLevel > 0) {
		color = '#F44336'; // Red
	}
</script>

<svg
	width="24"
	height="24"
	viewBox="0 0 24 24"
	fill="none"
	xmlns="http://www.w3.org/2000/svg"
	aria-label={`${label} strength: ${strength}`}
>
	<!-- Bar 1 -->
	<rect x="2" y="18" width="3" height="4" fill={signalLevel > 0 ? color : '#E0E0E0'} />
	<!-- Bar 2 -->
	<rect x="6" y="14" width="3" height="8" fill={signalLevel > 33 ? color : '#E0E0E0'} />
	<!-- Bar 3 -->
	<rect x="10" y="10" width="3" height="12" fill={signalLevel > 66 ? color : '#E0E0E0'} />
	<!-- Bar 4 -->
	<rect x="14" y="6" width="3" height="16" fill={signalLevel === 100 ? color : '#E0E0E0'} />
</svg>

<style>
	svg {
		vertical-align: middle;
	}
</style>
