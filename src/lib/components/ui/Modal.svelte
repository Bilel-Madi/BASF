<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();
</script>

<div class="modal-backdrop" on:click={() => dispatch('close')}>
	<div class="modal-content" on:click|stopPropagation>
		<slot />
	</div>
</div>

<style>
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
		padding: 1rem;
	}

	.modal-content {
		background: white;
		padding: clamp(1rem, 4vw, 2rem);
		border-radius: 10px;
		width: 100%;
		max-width: 600px;
		max-height: 90vh;
		overflow-y: auto;
	}

	@media (max-width: 480px) {
		.modal-content {
			max-height: 95vh;
			border-radius: 8px;
		}
	}
</style>
