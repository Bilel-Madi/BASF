<script lang="ts">
	import { enhance } from '$app/forms';
	import { browser } from '$app/environment';
	import type { PageData } from './$types';

	export let data: PageData;
	$: ({ project } = data);

	$: isPublic = project.isPublic ?? false;
	$: publicUrl = project.publicSlug ? `/demo/${project.publicSlug}` : null;

	async function togglePublicAccess() {
		const response = await fetch(`/api/projects/${project.id}/public-access`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				isPublic: !isPublic,
				publicTitle: project.publicTitle,
				publicDescription: project.publicDescription
			})
		});

		if (response.ok) {
			const result = await response.json();
			isPublic = !isPublic;
			publicUrl = result.publicUrl;
		}
	}

	function copyToClipboard(text: string) {
		if (browser) {
			navigator.clipboard.writeText(text);
		}
	}

	$: fullPublicUrl = browser ? window.location.origin + publicUrl : '';
</script>

<div class="page-container">
	<div class="settings-section">
		<h2>Project Settings</h2>

		<div class="setting-group">
			<h3>Public Access</h3>
			<label class="checkbox-label">
				<input type="checkbox" bind:checked={isPublic} on:change={togglePublicAccess} />
				<span>Make this project public</span>
			</label>

			{#if publicUrl && browser}
				<div class="public-url">
					<p>Public URL:</p>
					<div class="url-copy">
						<input readonly value={fullPublicUrl} />
						<button on:click={() => copyToClipboard(fullPublicUrl)}>Copy</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.page-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	.settings-section {
		background: white;
		padding: 2rem;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.setting-group {
		margin: 2rem 0;
	}

	h2 {
		margin: 0 0 2rem 0;
		color: var(--color-text-primary);
	}

	h3 {
		margin: 0 0 1rem 0;
		color: var(--color-text-primary);
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
	}

	.public-url {
		margin-top: 1.5rem;
	}

	.url-copy {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}

	input[type='checkbox'] {
		width: 1.2rem;
		height: 1.2rem;
	}

	input[readonly] {
		flex: 1;
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		background: #f5f5f5;
	}

	button {
		padding: 0.5rem 1rem;
		background: var(--color-primary);
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-weight: 500;
		transition: background-color 0.2s;
	}

	button:hover {
		background: var(--color-primary-dark);
	}
</style>
