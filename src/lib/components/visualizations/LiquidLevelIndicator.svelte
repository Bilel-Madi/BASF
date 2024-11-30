<script lang="ts">
	export let level: number = 0;
	export let maxLevel: number = 5;
	export let width: string = '100%';
	export let height: string = '200px';
	export let showLabels: boolean = true;
	export let showAnimation: boolean = true;

	$: fillPercentage = level != null ? (level / maxLevel) * 100 : 0;
	$: fillHeight = Math.min(Math.max(fillPercentage || 0, 0), 100);

	// Simplified color gradient based on level
	$: colorGradient =
		!level || fillPercentage < 20
			? 'linear-gradient(180deg, #2B4C7E 0%, #1A365E 100%)'
			: fillPercentage < 40
			? 'linear-gradient(180deg, #3A669E 0%, #2B4C7E 100%)'
			: fillPercentage < 60
			? 'linear-gradient(180deg, #4B82BE 0%, #3A669E 100%)'
			: fillPercentage < 80
			? 'linear-gradient(180deg, #3A669E 0%, #2B4C7E 100%)'
			: 'linear-gradient(180deg, #2B4C7E 0%, #1A365E 100%)';

	// Simplified status text with null check
	$: status =
		!level || fillPercentage < 20
			? 'Empty'
			: fillPercentage < 40
			? 'Low'
			: fillPercentage < 60
			? 'Half'
			: fillPercentage < 80
			? 'Full'
			: 'Critical';
</script>

<div class="container" style="width: {width}; height: {height};">
	<div class="content-wrapper">
		<div class="well">
			<div
				class="water"
				class:animate={showAnimation}
				style="height: {fillHeight}%; background: {colorGradient};"
			>
				<div class="water-surface" />
			</div>
			<div class="measurement-lines">
				{#each Array(21) as _, i}
					<div class="line" style="bottom: {i * 5}%">
						{#if i % 2 === 0 && showLabels}
							<span class="line-label">{((maxLevel * (i * 5)) / 100).toFixed(1)}m</span>
						{/if}
					</div>
				{/each}
			</div>
		</div>
		<div class="info-panel">
			<div class="depth-indicator">
				<span class="label">Current Depth</span>
				<span class="value">{level.toFixed(2)}m</span>
				<span class="max-value">Maximum: {maxLevel}m</span>
			</div>
			<div class="status-indicator" style="color: {colorGradient.match(/#[A-F0-9]{6}/)[0]}">
				{status}
			</div>
		</div>
	</div>
</div>

<style>
	.container {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
	}

	.content-wrapper {
		display: flex;
		gap: 2rem;
		padding: 1rem;
		height: 100%;
		max-height: 300px;
		width: 100%;
		align-items: center;
	}

	.well {
		position: relative;
		width: 100px;
		height: 100%;
		min-height: 200px;
		background: #ffffff;
		border-radius: 2px;
		border: 1px solid #e0e0e0;
		overflow: hidden;
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
	}

	.water {
		position: absolute;
		bottom: 0;
		width: 100%;
		transition: height 0.8s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.water-surface {
		position: absolute;
		top: 0;
		width: 100%;
		height: 2px;
		background: rgba(255, 255, 255, 0.3);
		box-shadow: 0 0 4px rgba(255, 255, 255, 0.5);
	}

	.measurement-lines {
		position: absolute;
		width: 100%;
		height: 100%;
	}

	.line {
		position: absolute;
		width: 100%;
		height: 1px;
		background: rgba(0, 0, 0, 0.05);
	}

	.line:nth-child(even) {
		width: 30%;
	}

	.line-label {
		position: absolute;
		right: 105%;
		transform: translateY(-50%);
		font-size: 0.75rem;
		color: #666666;
		font-family: monospace;
	}

	.info-panel {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		flex: 1;
	}

	.depth-indicator {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.label {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #666666;
	}

	.value {
		font-size: 2rem;
		font-weight: 300;
		color: #2b4c7e;
		font-family: monospace;
	}

	.max-value {
		font-size: 0.75rem;
		color: #999999;
	}

	.status-indicator {
		font-size: 0.875rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	@media (max-width: 768px) {
		.content-wrapper {
			flex-direction: column;
			align-items: center;
			gap: 1rem;
			padding: 0.5rem;
		}

		.well {
			width: 80px;
			min-height: 160px;
		}

		.info-panel {
			width: 100%;
			align-items: center;
			text-align: center;
		}

		.value {
			font-size: 1.5rem;
		}
	}
</style>
