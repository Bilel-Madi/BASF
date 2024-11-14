<script lang="ts">
	export let tabs: Array<{ id: string; label: string }>;
	export let activeTab: string;
</script>

<div class="tabs-container">
	<div class="tabs">
		{#each tabs as tab}
			<button
				class="tab-button"
				class:active={activeTab === tab.id}
				on:click={() => (activeTab = tab.id)}
			>
				{tab.label}
			</button>
		{/each}
	</div>
</div>

<style>
	.tabs-container {
		position: relative;
		overflow-x: auto;
		-webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
		scrollbar-width: none; /* Firefox */
		-ms-overflow-style: none; /* IE and Edge */
	}

	/* Hide scrollbar for Chrome, Safari and Opera */
	.tabs-container::-webkit-scrollbar {
		display: none;
	}

	.tabs {
		display: flex;
		gap: 1rem;
		border-bottom: 1px solid rgb(23, 0, 151);
		margin-bottom: 1rem;
		min-width: min-content; /* Ensures tabs don't shrink */
		padding-bottom: 2px; /* Prevent border from being cut off */
	}

	.tab-button {
		padding: 0.15rem 0rem 0.75rem 0; /* No padding on the left */
		border: none;
		margin-right: 1rem;
		background: none;
		cursor: pointer;
		font-weight: 500;
		border-bottom: 2px solid transparent;
		margin-bottom: -2px;
		white-space: nowrap; /* Prevent text wrapping */
		color: #666666;
	}

	.tab-button:hover {
		color: var(--color-text-primary);
	}

	.tab-button.active {
		color: var(--color-primary);
		border-bottom-color: var(--color-primary);
	}
</style>
