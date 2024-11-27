<!-- src/routes/auth/signup/+page.svelte -->

<script lang="ts">
	import TextInput from '$lib/components/ui/TextInput.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	export let data;
  
	let email = '';
	let password = '';
  
	// Reactive statement to display the invite message if present
	$: inviteMessage = data.invite
	  ? `You've been invited to join ${data.invite.organizationName}`
	  : '';
  </script>
  
  <div class="container">
	<div class="logo">
	  <img src="/Logo_black.png" alt="Logo" />
	</div>
  
	<div class="content">
	  <div class="form-section">
		<h1>Create Your Account</h1>
  
		{#if inviteMessage}
		  <div class="invite-message">
			{inviteMessage}
		  </div>
		{/if}
  
		<!-- Updated form tag: Removed use:enhance and action="?/" -->
		<form method="POST">
		  {#if data.invite}
			<input type="hidden" name="inviteToken" value={data.invite.token} />
		  {/if}
  
		  <TextInput
			type="email"
			id="email"
			name="email"
			label="Email:"
			required
			bind:value={email}
		  />
  
		  <TextInput
			type="password"
			id="password"
			name="password"
			label="Password:"
			required
			bind:value={password}
		  />
  
		  <Button text="Sign Up" variant="primary" type="submit" />
  
		  {#if data?.error}
			<p class="error">{data.error}</p>
		  {/if}
  
		  <p class="signup-text">
			Already have an account? <a href="/">Sign in</a>
		  </p>
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
  
	.signup-text {
	  margin-top: 1.5rem;
	  text-align: center;
	}
  
	form {
	  width: 100%;
	  max-width: 400px;
	  display: flex;
	  flex-direction: column;
	  gap: 1.5rem;
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
  
	.invite-message {
	  background-color: #e3f2fd;
	  padding: 1rem;
	  border-radius: 0.5rem;
	  margin-bottom: 2rem;
	  text-align: center;
	  color: #1976d2;
	}
  </style>
  