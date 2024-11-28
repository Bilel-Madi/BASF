<!-- src/routes/auth/signup/+page.svelte -->

<script lang="ts">
	import TextInput from '$lib/components/ui/TextInput.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	export let data;

	let email = '';
	let password = '';
	let confirmPassword = '';
	let errors: { [key: string]: string } = {};

	// Email validation regex
	const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

	// Password requirements
	const passwordRequirements = {
		minLength: 8,
		hasUpperCase: /[A-Z]/,
		hasLowerCase: /[a-z]/,
		hasNumber: /[0-9]/,
		hasSpecial: /[!@#$%^&*(),.?":{}|<>]/
	};

	// Enhanced password strength calculation
	$: passwordStrength = {
		length: password.length >= passwordRequirements.minLength,
		uppercase: passwordRequirements.hasUpperCase.test(password),
		lowercase: passwordRequirements.hasLowerCase.test(password),
		number: passwordRequirements.hasNumber.test(password),
		special: passwordRequirements.hasSpecial.test(password),
		noCommonPatterns: !/(123|abc|qwerty|password)/i.test(password),
		noRepeatingChars: !/(.)\1{2,}/.test(password)
	};

	$: strengthScore = Object.values(passwordStrength).filter(Boolean).length;
	$: strengthText = !password
		? ''
		: strengthScore <= 2
		? 'Very Weak'
		: strengthScore <= 3
		? 'Weak'
		: strengthScore <= 5
		? 'Good'
		: strengthScore <= 6
		? 'Strong'
		: 'Very Strong';

	$: strengthColor = !password
		? '#e0e0e0'
		: strengthScore <= 2
		? '#ff4444'
		: strengthScore <= 3
		? '#ffa700'
		: strengthScore <= 5
		? '#ffdb4a'
		: strengthScore <= 6
		? '#99cc33'
		: '#00cc00';

	// Debounced password match check
	let matchCheckTimeout: NodeJS.Timeout;
	$: {
		if (confirmPassword) {
			clearTimeout(matchCheckTimeout);
			matchCheckTimeout = setTimeout(() => {
				passwordsMatch = password === confirmPassword;
			}, 300);
		}
	}

	$: passwordsMatch = password && confirmPassword && password === confirmPassword;
	$: showMatchFeedback = password && confirmPassword;

	function validateForm() {
		errors = {};

		// Email validation
		if (!email) {
			errors.email = 'Email is required';
		} else if (!emailRegex.test(email)) {
			errors.email = 'Please enter a valid email address';
		}

		// Password validation
		if (!password) {
			errors.password = 'Password is required';
		} else {
			if (password.length < passwordRequirements.minLength) {
				errors.password = 'Password must be at least 8 characters long';
			} else if (!passwordRequirements.hasUpperCase.test(password)) {
				errors.password = 'Password must contain at least one uppercase letter';
			} else if (!passwordRequirements.hasLowerCase.test(password)) {
				errors.password = 'Password must contain at least one lowercase letter';
			} else if (!passwordRequirements.hasNumber.test(password)) {
				errors.password = 'Password must contain at least one number';
			} else if (!passwordRequirements.hasSpecial.test(password)) {
				errors.password = 'Password must contain at least one special character';
			}
		}

		// Confirm password validation
		if (password !== confirmPassword) {
			errors.confirmPassword = 'Passwords do not match';
		}

		return Object.keys(errors).length === 0;
	}

	function handleSubmit(event: SubmitEvent) {
		if (!validateForm()) {
			event.preventDefault();
		}
	}

	// Reactive statement to display the invite message if present
	$: inviteMessage = data.invite
		? `You've been invited to join ${data.invite.organizationName}`
		: '';

	// Add state for password visibility
	let showPassword = false;
	let showConfirmPassword = false;

	// Optional: function to toggle password visibility
	const togglePasswordVisibility = (field: 'password' | 'confirm') => {
		if (field === 'password') {
			showPassword = !showPassword;
		} else {
			showConfirmPassword = !showConfirmPassword;
		}
	};
</script>

<div class="container">
	<div class="logo">
		<img src="/favicon.png" alt="Logo" />
		<span class="brand-name">Arddata<sup>™</sup></span>
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
			<form method="POST" action="?/signup" on:submit={handleSubmit}>
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
					error={errors.email}
				/>

				<div class="input-group">
					<div class="password-input-wrapper">
						<TextInput
							type={showPassword ? 'text' : 'password'}
							id="password"
							name="password"
							label="Password:"
							required
							bind:value={password}
							error={errors.password}
						/>
						<button
							type="button"
							class="password-toggle"
							on:click={() => togglePasswordVisibility('password')}
							aria-label={showPassword ? 'Hide password' : 'Show password'}
						>
							{#if showPassword}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<path
										d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
									/>
									<line x1="1" y1="1" x2="23" y2="23" />
								</svg>
							{:else}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
									<circle cx="12" cy="12" r="3" />
								</svg>
							{/if}
						</button>
					</div>

					{#if password.length > 0}
						<div class="password-feedback" role="alert" aria-live="polite">
							<div class="strength-indicator">
								<div class="strength-label">
									<span>Password Strength:</span>
									<span style="color: {strengthColor}">{strengthText}</span>
								</div>
								<div class="strength-bars">
									{#each Array(5) as _, i}
										<div
											class="strength-bar"
											class:active={strengthScore > i}
											style="--strength-color: {strengthColor}"
											aria-hidden="true"
										/>
									{/each}
								</div>
							</div>

							<div class="requirements-grid">
								<div class="requirement" class:met={passwordStrength.length}>
									<span class="icon" aria-hidden="true">
										{passwordStrength.length ? '✓' : '○'}
									</span>
									<span>8+ characters</span>
								</div>
								<div class="requirement" class:met={passwordStrength.uppercase}>
									<span class="icon" aria-hidden="true">
										{passwordStrength.uppercase ? '✓' : '○'}
									</span>
									<span>Uppercase letter</span>
								</div>
								<div class="requirement" class:met={passwordStrength.lowercase}>
									<span class="icon" aria-hidden="true">
										{passwordStrength.lowercase ? '✓' : '○'}
									</span>
									<span>Lowercase letter</span>
								</div>
								<div class="requirement" class:met={passwordStrength.number}>
									<span class="icon" aria-hidden="true">
										{passwordStrength.number ? '✓' : '○'}
									</span>
									<span>Number</span>
								</div>
								<div class="requirement" class:met={passwordStrength.special}>
									<span class="icon" aria-hidden="true">
										{passwordStrength.special ? '✓' : '○'}
									</span>
									<span>Special character</span>
								</div>
								<div class="requirement" class:met={passwordStrength.noCommonPatterns}>
									<span class="icon" aria-hidden="true">
										{passwordStrength.noCommonPatterns ? '✓' : '○'}
									</span>
									<span>No common patterns</span>
								</div>
							</div>
						</div>
					{/if}
				</div>

				<div class="input-group">
					<div class="password-input-wrapper">
						<TextInput
							type={showConfirmPassword ? 'text' : 'password'}
							id="confirmPassword"
							name="confirmPassword"
							label="Confirm Password:"
							required
							bind:value={confirmPassword}
							error={errors.confirmPassword}
						/>
						<button
							type="button"
							class="password-toggle"
							on:click={() => togglePasswordVisibility('confirm')}
							aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
						>
							{#if showConfirmPassword}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<path
										d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
									/>
									<line x1="1" y1="1" x2="23" y2="23" />
								</svg>
							{:else}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
									<circle cx="12" cy="12" r="3" />
								</svg>
							{/if}
						</button>
					</div>

					{#if showMatchFeedback}
						<div
							class="password-match-feedback"
							class:matching={passwordsMatch}
							role="alert"
							aria-live="polite"
						>
							<span class="icon" aria-hidden="true">
								{passwordsMatch ? '✓' : '✗'}
							</span>
							<span>{passwordsMatch ? 'Passwords match' : 'Passwords do not match'}</span>
						</div>
					{/if}
				</div>

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

	.input-group {
		position: relative;
		margin-bottom: 1.5rem;
	}

	.password-feedback {
		border-radius: 0.5rem;
		padding: 1rem;
		margin-top: 0.5rem;
		font-size: 0.875rem;
	}

	.strength-indicator {
		margin-bottom: 1rem;
	}

	.strength-label {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
		font-weight: 500;
	}

	.strength-bars {
		display: flex;
		gap: 4px;
		height: 4px;
	}

	.strength-bar {
		flex: 1;
		background-color: #e0e0e0;
		border-radius: 2px;
		transition: all 0.3s ease;
	}

	.strength-bar.active {
		background-color: var(--strength-color);
	}

	.requirements-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 0.5rem;
	}

	.requirement {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: #666;
		transition: color 0.3s ease;
	}

	.requirement.met {
		color: #00cc00;
	}

	.icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.25rem;
		height: 1.25rem;
		font-size: 1rem;
	}

	.password-match-feedback {
		position: absolute;
		top: 100%;
		left: 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: #dc3545;
		transition: all 0.3s ease;
		margin-top: 0.25rem;
	}

	.password-match-feedback.matching {
		color: #00cc00;
	}

	@media (max-width: 640px) {
		.requirements-grid {
			grid-template-columns: 1fr;
		}
	}

	.password-input-wrapper {
		position: relative;
		width: 100%;
	}

	.password-toggle {
		position: absolute;
		right: 0.75rem;
		top: 65%;
		transform: translateY(-50%);
		background: none;
		border: none;
		padding: 0.25rem;
		color: #bbbbbb;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: color 0.2s ease;
		z-index: 2;
		opacity: 0.4;
	}

	.password-toggle:hover {
		color: #666;
	}

	.password-toggle:focus {
		outline: none;
		color: #666;
	}

	.password-toggle:focus-visible {
		outline: 2px solid #e9e9e9;
		outline-offset: 2px;
		border-radius: 4px;
	}

	.password-toggle svg {
		width: 1.25rem;
		height: 1.25rem;
		stroke-width: 1.5px;
	}
</style>
