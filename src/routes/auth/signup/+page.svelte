<!-- src/routes/auth/signup/+page.svelte -->

<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { invalidate } from '$app/navigation';

	// Destructure the `data` prop to access server-side errors
	export let data: { error?: string };

	// Local state for form inputs (optional, for enhanced control)
	let email: string = '';
	let password: string = '';

	// Optional: Handle form submission via SvelteKit's enhanced forms
	const handleSubmit = async (event: Event) => {
		// Prevent default form submission
		event.preventDefault();

		// Create FormData object
		const form = event.target as HTMLFormElement;
		const formData = new FormData(form);

		// Submit the form data using fetch for better control
		const response = await fetch(form.action, {
			method: form.method,
			body: formData
		});

		if (response.redirected) {
			// If the response is a redirect, navigate to the new location
			window.location.href = response.url;
		} else {
			// Otherwise, invalidate the current page data to fetch new data
			invalidate();
		}
	};
</script>

<h1>Sign Up</h1>

<form method="POST" action="/auth/signup" on:submit|preventDefault={handleSubmit}>
	<div>
		<label for="email">Email:</label>
		<input
			type="email"
			id="email"
			name="email"
			bind:value={email}
			required
			placeholder="you@example.com"
		/>
	</div>

	<div>
		<label for="password">Password:</label>
		<input
			type="password"
			id="password"
			name="password"
			bind:value={password}
			required
			minlength="6"
			placeholder="Enter a secure password"
		/>
	</div>

	<button type="submit">Sign Up</button>

	{#if data?.error}
		<p class="error">{data.error}</p>
	{/if}
</form>

<p style="text-align: center; margin-top: 1rem;">
	Already have an account? <a href="/">Login here</a>.
</p>

<style>
	/* Basic styling for the signup form */
	form {
		max-width: 400px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
	}

	div {
		margin-bottom: 1rem;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: bold;
	}

	input {
		width: 100%;
		padding: 0.5rem;
		box-sizing: border-box;
	}

	button {
		padding: 0.75rem;
		background-color: #4caf50;
		color: white;
		border: none;
		cursor: pointer;
		font-size: 1rem;
	}

	button:hover {
		background-color: #45a049;
	}

	.error {
		color: red;
		margin-top: 1rem;
		text-align: center;
	}
</style>
