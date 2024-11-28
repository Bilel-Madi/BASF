<!-- Button.svelte -->
<script>
	export let text = 'Button';
	export let variant = 'primary';
	export let icon = null;
</script>

<button class="button {variant}" on:click>
	{#if icon}
		<img src={icon} alt="" class="icon" />
	{/if}
	{text}
</button>

<style>
	.button {
		width: 100%;
		max-width: 400px;
		padding: 0.75rem;
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 8px;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.primary {
		background-color: #15fdb7;
		color: #000;
	}

	.google {
		background-color: #fff;
		border: 1px solid #dadce0;
		padding: 0.8rem 2rem;
	}

	.icon {
		width: 20px;
		height: 20px;
	}

	.button:hover {
		opacity: 0.9;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}

	.button:active {
		opacity: 0.8;
	}

	.button:focus {
		outline: 2px solid rgba(21, 253, 183, 0.5);
		outline-offset: 1px;
	}
</style>
