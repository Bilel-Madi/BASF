<!-- src/routes/+page.svelte -->

<script lang="ts">
	export let data: { error?: string };
</script>

<h1>Login</h1>

<form method="POST">
	<div>
		<label for="email">Email:</label>
		<input type="email" id="email" name="email" required />
	</div>

	<div>
		<label for="password">Password:</label>
		<input type="password" id="password" name="password" required />
	</div>

	<button type="submit">Login</button>

	{#if data?.error}
		<p style="color: red;">{data.error}</p>
	{/if}
</form>

<p>Or</p>
<a href="/auth/google">Login with Google</a>

<p>Don't have an account? <a href="/auth/signup">Sign up</a></p>
