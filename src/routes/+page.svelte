<!-- src/routes/+page.svelte -->

<script lang="ts">
	import TextInput from '$lib/components/ui/TextInput.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	export let data: { error?: string };
</script>

<div class="container">
	<div class="logo">
		<img src="/favicon.png" alt="Logo" />
		<span class="brand-name">Arddata<sup>™</sup></span>
	</div>

	<div class="content">
		<div class="form-section">
			<h1>Sign in to Your Account</h1>

			<form method="POST">
				<!-- <Button
					text="Sign in with Google"
					variant="google"
					icon="/google-icon.svg"
					on:click={() => (window.location.href = '/auth/google')}
				/> -->

				<!-- <div class="divider">
					<hr />
					<span>or</span>
					<hr />
				</div> -->

				<TextInput type="email" id="email" name="email" label="Email:" required />
				<TextInput type="password" id="password" name="password" label="Password:" required />
				<!-- <a href="/auth/forgot-password" class="forgot-password">Forgot Password?</a> -->
				<Button text="Sign In" variant="primary" type="submit" />

				{#if data?.error}
					<p class="error">{data.error}</p>
				{/if}

				<p class="signup-text">Don't have an account? <a href="/auth/signup">Sign up</a></p>
			</form>
		</div>

		<div class="image-section">
			<img src="/background8.jpg" alt="Login illustration" />
		</div>
	</div>
</div>

<style>
	.container {
		height: 100vh;
		width: 100vw;
		overflow: hidden;
		position: relative;
	}

	.logo {
		position: absolute;
		top: 2rem;
		left: 2rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.logo img {
		height: 50px;
		width: auto;
	}

	.brand-name {
		font-size: 1.5rem;
		font-weight: 600;
	}

	.brand-name sup {
		font-size: 0.5em;
	}

	.content {
		height: 100%;
		display: flex;
	}

	.form-section {
		width: 66.66%;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 2rem;
	}

	h1 {
		font-size: 2rem;
		margin-bottom: 3rem;
	}

	.image-section {
		width: 33.33%;
		background-color: #f5f5f5;
	}

	.image-section img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	form {
		width: 100%;
		max-width: 400px;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.error {
		color: red;
		margin-top: 0.5rem;
	}

	.signup-text {
		margin-top: 1.5rem;
		text-align: center;
	}

	.signup-text p {
		margin: 0.5rem 0;
	}

	.divider {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin: 0.5rem 0;
	}

	.divider hr {
		flex: 1;
		border: none;
		border-top: 1px solid #e0e0e0;
	}

	.divider span {
		color: #666;
		font-size: 1rem;
	}

	@media (max-width: 768px) {
		.image-section {
			display: none;
		}

		.form-section {
			width: 100%;
		}
	}

	.auth-links {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		margin-top: 1rem;
	}

	.forgot-password {
		color: #666;
		text-decoration: none;
		align-self: flex-start;
		font-size: 0.9rem;
		margin-top: -1rem;
	}

	.forgot-password:hover {
		text-decoration: underline;
	}
</style>
