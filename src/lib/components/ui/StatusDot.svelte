<!-- src/lib/components/StatusDot.svelte -->
<script>
	export let color = '#00d87e';
	export let size = '10px';
</script>

<div class="status-dot" style="--dot-size: {size}; --dot-color: {color};" />

<style>
	.status-dot {
		width: var(--dot-size);
		height: var(--dot-size);
		background-color: var(--dot-color);
		border-radius: 50%;
		position: relative;
	}

	.status-dot::after {
		content: '';
		position: absolute;
		left: calc(-0.5 * var(--dot-size));
		top: calc(-0.5 * var(--dot-size));
		width: calc(2 * var(--dot-size));
		height: calc(2 * var(--dot-size));
		border-radius: 50%;
		background-color: var(--dot-color);
		opacity: 0;
		animation: pulsate 1s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}

	@keyframes pulsate {
		0% {
			transform: scale(0.5);
			opacity: 0.5;
		}
		70% {
			transform: scale(1.2);
			opacity: 0;
		}
		100% {
			transform: scale(1.2);
			opacity: 0;
		}
	}
</style>
