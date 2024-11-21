<script lang="ts">
	import ThresholdBar from '$lib/components/ui/ThresholdBar.svelte';
	import type { Threshold } from '$lib/stores/thresholds';

	export let label: string;
	export let value: number;
	export let unit: string;
	export let thresholds: Threshold[];
	export let min: number;
	export let max: number;

	$: currentThreshold = thresholds.find((t) => value >= t.start && value <= t.end);
</script>

<div class="reading-item">
	<div class="reading-header">
		<div class="reading-title">
			<span class="label">{label}:</span>
			<span class="current-value">{value} {unit}</span>
		</div>
		<div class="status-tag" style="background-color: {currentThreshold?.color || '#f0f0f0'}">
			{currentThreshold?.label || ''}
		</div>
	</div>
	<ThresholdBar {value} {min} {max} {thresholds} />
</div>

<style>
	.reading-item {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.reading-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.reading-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.label {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		font-weight: 500;
	}

	.current-value {
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.status-tag {
		padding: 4px 8px;
		border-radius: 10px;
		color: white;
		font-size: 10px;
		font-weight: 500;
		opacity: 0.8;
		margin-left: auto;
	}
</style>
