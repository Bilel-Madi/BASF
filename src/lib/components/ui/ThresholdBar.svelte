<!-- src/lib/components/ui/ThresholdBar.svelte -->
<script lang="ts">
	export let value: number;
	export let min: number = 0;
	export let max: number = 100;
	export let thresholds: Array<{ start: number; end: number; color: string; label: string }> = [];

	// Calculate the position of the value indicator
	$: valuePercentage = ((value - min) / (max - min)) * 100;

	// Find the current threshold for the value
	$: currentThreshold = thresholds.find((t) => value >= t.start && value <= t.end);

	// Generate smooth gradient
	function generateSmoothGradient(
		thresholds: Array<{ start: number; end: number; color: string }>,
		min: number,
		max: number
	) {
		if (!thresholds.length) return '';

		const sortedThresholds = [...thresholds].sort((a, b) => a.start - b.start);
		const gradientStops = sortedThresholds.map((threshold) => {
			const position = ((threshold.start - min) / (max - min)) * 100;
			return `${threshold.color} ${position}%`;
		});

		// Add final color stop
		const lastThreshold = sortedThresholds[sortedThresholds.length - 1];
		const finalPosition = ((lastThreshold.end - min) / (max - min)) * 100;
		gradientStops.push(`${lastThreshold.color} ${finalPosition}%`);

		return gradientStops.join(', ');
	}

	// Create reactive gradient
	$: gradient = generateSmoothGradient(thresholds, min, max);
</script>

<div class="threshold-bar-container">
	<div
		class="threshold-bar"
		role="progressbar"
		aria-valuemin={min}
		aria-valuemax={max}
		aria-valuenow={value}
		aria-label="Sensor Value"
	>
		<div
			class="threshold-bar__background"
			style="background: linear-gradient(to right, {gradient || '#f0f0f0'});"
		>
			<div class="vertical-bars" />
		</div>
		<div class="threshold-bar__indicator" style="left: {valuePercentage}%;">
			<div class="threshold-bar__dial" />
		</div>

		{#each thresholds.slice(1) as threshold}
			<div
				class="threshold-marker"
				style="left: {((threshold.start - min) / (max - min)) * 100}%"
			/>
		{/each}
	</div>
</div>

<style>
	.threshold-bar-container {
		position: relative;
		width: 100%;
	}

	.threshold-bar {
		position: relative;
		width: 100%;
		height: 24px;
		border-radius: 8px;
		background: rgba(240, 240, 240, 0.1);
		overflow: visible;
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.1);
	}

	.threshold-bar__background {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		border-radius: 8px;
		transition: background 0.5s ease;
		opacity: 0.9;
		overflow: hidden;
	}

	.vertical-bars {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-image: repeating-linear-gradient(
			to right,
			rgba(255, 255, 255) 1px,
			rgba(255, 255, 255) 1px,
			transparent 2px,
			transparent 6px
		);
	}

	.threshold-bar__indicator {
		position: absolute;
		top: 50%;
		transform: translate(-50%, -50%);
		z-index: 2;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.threshold-bar__dial {
		position: relative;
		width: 2px;
		height: 36px;
		background: rgb(40, 40, 40);
		border-radius: 1px;
		transition: all 0.3s ease;
		transform-origin: bottom center;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.threshold-bar__dial::before {
		content: '';
		position: absolute;
		bottom: -4px;
		left: 50%;
		transform: translateX(-50%);
		width: 6px;
		height: 6px;
		background: rgb(40, 40, 40);
		border-radius: 50%;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.threshold-marker {
		position: absolute;
		top: 0px;
		width: 1px;
		height: 24px;
		background: rgba(0, 0, 0, 0.15);
		transform: translateX(-50%);
		box-shadow: 1px 0 0 rgba(255, 255, 255, 0.1);
	}

	@media (max-width: 600px) {
		.threshold-bar {
			height: 20px;
		}

		.threshold-bar__dial {
			height: 32px;
		}

		.threshold-bar__dial::before {
			width: 9px;
			height: 9px;
			bottom: -4px;
		}

		.threshold-marker {
			height: 20px;
		}
	}
</style>
