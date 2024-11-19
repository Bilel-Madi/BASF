<!-- src/routes/auth/onboarding/+page.svelte -->

<script lang="ts">
	import TextInput from '$lib/components/ui/TextInput.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	export let data: { error?: string };
</script>

<div class="container">
	<div class="logo">
		<img src="/Logo_black.png" alt="Logo" />
	</div>

	<div class="content">
		<div class="form-section">
			<h1>Complete Your Profile</h1>

			<form method="POST">
				<TextInput
					type="text"
					id="organizationName"
					name="organizationName"
					label="Organization Name:"
					required
				/>
				<TextInput type="text" id="firstName" name="firstName" label="First Name:" required />
				<TextInput type="text" id="lastName" name="lastName" label="Last Name:" required />
				<Button text="Complete Setup" variant="primary" type="submit" />

				{#if data?.error}
					<p class="error">{data.error}</p>
				{/if}
			</form>
		</div>

		<div class="image-section">
			<img src="/background7.jpg" alt="Login illustration" />
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
		top: 0rem;
		left: 2rem;
	}

	.logo img {
		height: 100px;
		width: auto;
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

	.error {
		color: red;
		margin-top: 0.5rem;
		text-align: center;
	}

	form {
		width: 100%;
		max-width: 400px;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	@media (max-width: 768px) {
		.image-section {
			display: none;
		}

		.form-section {
			width: 100%;
		}
	}
</style>
