<script lang="ts">
	export let items: { label: string; href?: string }[];
</script>

<nav class="breadcrumbs" aria-label="Breadcrumbs">
	<ol>
		{#each items as { label, href }, i}
			<li>
				{#if href && i !== items.length - 1}
					<a {href}>{label}</a>
				{:else}
					<span class="current">{label}</span>
				{/if}
				{#if i !== items.length - 1}
					<span class="separator">›</span>
				{/if}
			</li>
		{/each}
	</ol>
</nav>

<style>
	.breadcrumbs {
		margin-bottom: 1rem;
	}

	ol {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
	}

	li {
		display: flex;
		align-items: center;
	}

	a {
		color: #666;
		text-decoration: none;
		font-size: 0.9rem;
	}

	a:hover {
		color: #333;
		text-decoration: underline;
	}

	.current {
		color: #333;
		font-weight: 500;
		font-size: 0.9rem;
	}

	.separator {
		margin: 0 0.5rem;
		color: #666;
	}
</style>
