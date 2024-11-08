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
		border: none;
		border-radius: 10px;
		font-size: 1rem;
		cursor: pointer;
		transition: background-color 0.2s ease;
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
	}

	.google {
		background-color: rgb(247, 246, 246);
		border: 1px solid #dadce0;
		font-weight: 400;
		font-size: 1rem;
		padding: 0.75rem;
	}

	.icon {
		width: 22px;
		height: 22px;
	}

	.button:hover {
		background-color: #2bf1b6;
	}

	.button:focus {
		outline: none;
		box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.5);
	}

	.button.google:hover {
		background-color: rgb(234, 240, 237);
	}
</style>
