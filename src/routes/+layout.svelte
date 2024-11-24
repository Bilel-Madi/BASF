<!-- src/routes/+layout.svelte -->
<script>
	import { fade } from 'svelte/transition';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let isMenuOpen = false;
	let connectedDevices = 0;
	let currentTime = new Date();
	let isLoading = true;
	let timeInterval;
	let showColon = true;
	let isProjectDropdownOpen = false;

	onMount(() => {
		// Start the time interval
		timeInterval = setInterval(() => {
			currentTime = new Date();
			showColon = !showColon;
		}, 1000);

		// Fetch devices
		fetchConnectedDevices();

		// Cleanup on component destroy
		return () => {
			if (timeInterval) clearInterval(timeInterval);
		};
	});

	function closeMenu() {
		isMenuOpen = false;
	}

	$: shouldShowHeader = !['/auth/signup', '/', '/auth/onboarding'].includes($page.url.pathname);

	// Format time to HH:mm
	$: formattedTime = (() => {
		const timeStr = currentTime.toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		});
		// Split the time and join with a conditional colon
		const [hours, minutes] = timeStr.split(':');
		return `${hours}${showColon ? ':' : ' '}${minutes}`;
	})();

	// Add this reactive statement to handle logo visibility
	$: logoClass = isMenuOpen ? 'logo hidden' : 'logo';

	async function fetchConnectedDevices() {
		try {
			isLoading = true;
			const response = await fetch('/api/devices/connected-count');
			const data = await response.json();
			connectedDevices = data.reduce((sum, item) => sum + item._count._all, 0);
		} catch (error) {
			console.error('Failed to fetch connected devices:', error);
			connectedDevices = 0; // Set default value on error
		} finally {
			isLoading = false;
		}
	}

	function handleKeydown(event) {
		if (event.key === 'Escape' && isMenuOpen) {
			closeMenu();
		}
	}

	export let data;
	const { userDetails } = data;

	// Close project dropdown when clicking outside
	function handleClickOutside(event) {
		if (isProjectDropdownOpen && !event.target.closest('.project-selector')) {
			isProjectDropdownOpen = false;
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} on:click={handleClickOutside} />

{#if shouldShowHeader}
	<header>
		<div class="left-section">
			<div class={logoClass}>
				<img src="/logo1.png" alt="Logo" />
			</div>

			<div class="project-selector">
				<button
					class="project-button"
					on:click={() => (isProjectDropdownOpen = !isProjectDropdownOpen)}
				>
					<span class="project-name">{userDetails?.projectName || 'Select Project'}</span>
					<span class="material-symbols-outlined">expand_more</span>
				</button>

				{#if isProjectDropdownOpen}
					<div class="project-dropdown" transition:fade={{ duration: 100 }}>
						{#each userDetails?.projects || [] as project}
							<a
								href="/projects/{project.id}"
								class="project-item"
								class:active={project.id === userDetails?.projectId}
							>
								{project.name}
							</a>
						{/each}
						<div class="dropdown-footer">
							<a href="/projects" class="manage-projects">
								<span class="material-symbols-outlined">settings</span>
								Manage Projects
							</a>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<div class="right-section">
			<div class="status-widget">
				<span>Connected Devices&nbsp;: </span>
				<span>&nbsp;</span>
				<img src="/devices.png" alt="Sensor" class="status-icon" />
				<span class="count">
					{#if isLoading}
						<span class="loading">...</span>
					{:else}
						{connectedDevices}
					{/if}
				</span>
				<div class="divider" style="margin: 0 0.5rem;" />
				<img src="/gateway.png" alt="Gateway" class="status-icon" />
				<span class="count">1</span>
				<div class="divider" />
				<span class="clock">{formattedTime}</span>
			</div>

			<button
				class="hamburger"
				class:open={isMenuOpen}
				on:click={() => (isMenuOpen = !isMenuOpen)}
				aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
				aria-expanded={isMenuOpen}
			>
				<span class="top" />
				<span class="middle" />
				<span class="bottom" />
			</button>
		</div>
	</header>

	{#if isMenuOpen}
		<div class="menu-overlay" transition:fade={{ duration: 50 }}>
			<nav>
				<div class="menu-grid">
					<a href="/dashboard" on:click={closeMenu}>
						<span>Dashboard</span>
					</a>
					<a href="/projects" on:click={closeMenu}>
						<span>Projects<sup class="count-badge">{userDetails?.projectCount || 0}</sup></span>
					</a>
					<a href="/zones" on:click={closeMenu}>
						<span>Zones<sup class="count-badge">{userDetails?.zoneCount || 0}</sup></span>
					</a>
					<a href="/devices" on:click={closeMenu}>
						<span>Devices<sup class="count-badge">{userDetails?.deviceCount || 0}</sup></span>
					</a>
					<a href="/analytics" on:click={closeMenu}>
						<span>Analytics</span>
					</a>
					<a href="/settings" on:click={closeMenu}>
						<span>Settings</span>
					</a>
					<a href="/about" on:click={closeMenu}>
						<span>About</span>
					</a>
				</div>

				<div class="menu-bottom">
					<div class="user-info">
						<div class="user-avatar" />
						<div class="user-header">
							<h2>Hello <span class="username">{userDetails?.firstName || 'User'}</span>!</h2>
							<p class="org-info">
								{userDetails?.organizationName || 'Organization'} -
								{userDetails?.projectName || 'Project'}
							</p>
						</div>
					</div>

					<div class="menu-footer">
						<img src="/logo1.png" alt="Arddata Logo" class="footer-logo" />
						<p class="copyright">Arddata™ - All Rights Reserved 2024</p>
						<p class="support">
							For support email us at: <a href="mailto:info@misbargeo.com">info@misbargeo.com</a>
						</p>
						<p class="website">
							<a href="https://www.arddata.com" target="_blank">www.arddata.com</a>
						</p>
						<div class="footer-actions">
							<div class="status-widget">
								<span class="status-dot" />
								<span class="system-status">All Systems Operational&nbsp;&nbsp;</span>
							</div>
							<a href="/auth/logout" class="logout" on:click={closeMenu}>Logout</a>
						</div>
					</div>
				</div>
			</nav>
		</div>
	{/if}
{/if}

<div class="content" class:no-margin={!shouldShowHeader}>
	<slot />
</div>

<style>
	header {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: 4rem;
		background-color: #1b0ab1;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0 1rem;
		z-index: 100;
	}

	.logo {
		height: 2.5rem;
	}

	.logo img {
		height: 100%;
		width: auto;
		object-fit: contain;
	}

	.hamburger {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		width: 25px;
		height: 15px;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		position: relative;
	}

	.hamburger span {
		width: 100%;
		height: 2px;
		background-color: white;
		border-radius: 2px;
		position: absolute;
		transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
	}

	.hamburger .top {
		top: 0;
		transform-origin: center;
	}

	.hamburger .middle {
		top: 50%;
		transform: translateY(-50%);
	}

	.hamburger .bottom {
		bottom: 0;
		transform-origin: center;
	}

	.hamburger.open .top {
		transform: translateY(5px) rotate(45deg);
	}

	.hamburger.open .middle {
		opacity: 0;
	}

	.hamburger.open .bottom {
		transform: translateY(-8.5px) rotate(-45deg);
	}

	.menu-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: #1b0ab1;
		z-index: 99;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	nav {
		display: flex;
		flex-direction: column;
		width: 100%;
		max-width: auto;
		margin: 0 auto;
		padding: 1.5rem;
		padding-top: 6rem;
		height: 100%;
		justify-content: space-between;
	}
	nav a span {
		color: white;
	}

	.menu-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 2rem;
	}

	@media (min-width: 768px) {
		.menu-grid {
			grid-template-columns: repeat(4, 1fr);
		}
	}

	.menu-grid a {
		color: white;
		text-decoration: none;
		font-size: 2rem;
		transition: all 0.3s ease;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		align-items: left;
		gap: 1rem;
		opacity: 0;
		animation: menuItemFadeIn 0.4s forwards;
		animation-delay: calc(var(--menu-item-order) * 0.1s);
	}

	@keyframes menuItemFadeIn {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (max-width: 767px) {
		.menu-grid {
			gap: 1rem;
		}
		.menu-grid a {
			font-size: 1.5rem;
			padding: 0.5rem;
		}
	}

	.menu-footer {
		text-align: left;
		color: white;
		margin-top: auto;
		padding-top: 2rem;
		border-top: 1px solid rgba(255, 255, 255, 0.2);
		max-width: 100%;
	}

	.footer-logo {
		height: 3rem;
		width: auto;
		margin-bottom: 1rem;
	}

	.menu-footer p {
		margin: 0.5rem 0;
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.8);
	}

	.menu-footer a {
		color: rgba(255, 255, 255, 0.8);
		text-decoration: none;
		transition: color 0.3s ease;
	}

	.menu-footer a:hover {
		color: white;
	}

	.logout {
		display: inline-block;
		margin-top: 2rem;
		padding: 0.4rem 1rem;
		background-color: #ff3e00;
		border-radius: 15px;
		color: white !important;
	}

	.logout:hover {
		background-color: #ff6240;
	}

	.content {
		margin-top: 4rem;
		width: 100%;
	}

	.content.no-margin {
		margin-top: 0;
	}

	.status-widget {
		display: flex;
		align-items: center;
		gap: 0.15rem;
		background-color: rgb(0, 71, 202);
		padding: 0.5rem 1rem;
		border-radius: 1rem;
		font-size: 0.9rem;
	}

	.status-widget span {
		color: white;
	}

	.status-widget .status-icon {
		width: 24px;
		height: 24px;
		object-fit: contain;
		margin: 0 0.25rem;
	}

	.status-widget .count {
		color: white;
		margin: 0;
	}

	.status-widget .divider {
		width: 1px;
		height: 20px;
		background-color: rgba(255, 255, 255, 0.2);
		margin: 0 0.5rem;
	}

	.status-widget .clock {
		font-family: monospace;
		font-size: 1rem;
		min-width: 5ch;
	}

	@media (max-width: 600px) {
		.status-widget span:not(.clock):not(.count):not(.system-status):not(.status-dot) {
			display: none;
		}

		.status-widget {
			font-size: 0.8rem;
			padding: 0.4rem 0.6rem;
			gap: 0.1rem;
		}

		.status-widget .clock {
			font-family: monospace;
			font-size: 0.8rem;
			min-width: 6ch;
		}
		.status-widget .status-icon {
			width: 20px;
			height: 20px;
			object-fit: contain;
			margin: 0 0.25rem;
		}
	}

	.right-section {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.logo.hidden {
		opacity: 0;
		visibility: hidden;
	}

	.logo {
		height: 2.5rem;
		transition: opacity 0.3s ease, visibility 0.3s ease;
	}

	.loading {
		animation: pulse 1.5s infinite;
	}

	@keyframes pulse {
		0% {
			opacity: 1;
		}
		50% {
			opacity: 0.4;
		}
		100% {
			opacity: 1;
		}
	}

	/* Improve menu item hover states */
	.menu-grid a:hover {
		background-color: rgba(255, 255, 255, 0.1);
		transform: translateY(-2px);
		border-radius: 8px;
	}

	/* Improve status widget responsiveness */
	.status-widget {
		/* ... existing styles ... */
		transition: all 0.3s ease;
	}

	.status-widget:hover {
		background-color: rgb(0, 81, 232);
	}

	.footer-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 2rem;
	}

	/* Update the logout button margin */
	.logout {
		margin-top: 0; /* Remove the previous margin */
		float: none; /* Remove the float */
	}

	@media (max-width: 600px) {
		.footer-actions {
			gap: 1rem;
			align-items: stretch;
		}

		.footer-actions .status-widget {
			order: 1;
		}

		.footer-actions .logout {
			order: 2;
		}
	}

	.status-dot {
		width: 8px;
		height: 8px;
		background-color: #00d87e;
		border-radius: 50%;
		display: inline-block;
		margin-right: 8px;
	}

	/* Optional: Add a subtle glow effect to the dot */
	.status-dot {
		box-shadow: 0 0 8px rgba(0, 255, 0, 0.5);
	}

	.count-badge {
		font-size: 0.7rem;
		background-color: #00ffbf;
		color: black;
		padding: 0.25rem;
		border-radius: 25%;
		margin-left: 0.5rem;
		position: relative;
		top: -1.5em;
		font-weight: 700;
		min-width: 1.2rem;
		height: 1.2rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
	}

	.menu-bottom {
		margin-top: auto;
	}

	.user-info {
		padding: 2rem 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.2);
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 1rem;
		text-align: left;
	}

	.user-avatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: linear-gradient(135deg, #00ff87 0%, #60efff 50%, #ff59f8 100%);
		border: 3px solid rgba(255, 255, 255, 0.2);
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
		animation: gradientShift 10s ease infinite;
		background-size: 300% 300%;
		flex-shrink: 0;
	}

	@keyframes gradientShift {
		0% {
			background-position: 0% 50%;
		}
		50% {
			background-position: 100% 50%;
		}
		100% {
			background-position: 0% 50%;
		}
	}

	.user-info h2 {
		margin-top: 0.5rem;
		color: white;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin: 0;
	}

	.username {
		color: white;
		font-weight: 600;
	}

	.user-header {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.org-info {
		color: rgba(255, 255, 255, 0.8);
		font-size: 0.9rem;
		margin: 0;
	}

	/* Update menu grid items to handle the new badge positioning */
	.menu-grid a span {
		display: inline-flex;
		align-items: baseline;
	}

	.left-section {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.project-selector {
		position: relative;
		display: none; /* Hidden by default on mobile */
	}

	.project-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background-color: rgb(0, 71, 202);
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 1rem;
		color: white;
		cursor: pointer;
		transition: background-color 0.3s ease;
		font-size: 0.9rem;
	}

	.project-button:hover {
		background-color: rgb(0, 81, 232);
	}

	.project-name {
		color: white;
	}

	.project-dropdown {
		position: absolute;
		top: calc(100% + 0.5rem);
		left: 0;
		background-color: rgb(0, 71, 202);
		border-radius: 1rem;
		min-width: 200px;
		z-index: 1000;
		overflow: hidden;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
	}

	.project-item {
		display: block;
		padding: 0.75rem 1rem;
		color: white;
		text-decoration: none;
		transition: background-color 0.3s ease;
	}

	.project-item:hover {
		background-color: rgb(0, 81, 232);
	}

	.project-item.active {
		background-color: rgba(0, 240, 195, 0.1);
	}

	.dropdown-footer {
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		padding: 0.75rem 1rem;
	}

	.manage-projects {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: white;
		text-decoration: none;
		font-size: 0.9rem;
		opacity: 0.8;
		transition: opacity 0.3s ease;
	}

	.manage-projects:hover {
		opacity: 1;
	}

	/* Show project selector on desktop */
	@media (min-width: 768px) {
		.project-selector {
			display: block;
		}
	}

	/* Mobile styles */
	@media (max-width: 767px) {
		.menu-bottom .project-selector {
			display: block;
			width: 100%;
			margin-top: 1rem;
		}

		.menu-bottom .project-button {
			width: 100%;
			justify-content: space-between;
		}

		.menu-bottom .project-dropdown {
			position: relative;
			margin-top: 0.5rem;
			width: 100%;
		}
	}

	/* Responsive adjustments */
	@media (max-width: 600px) {
		.project-button {
			padding: 0.4rem 0.6rem;
			font-size: 0.8rem;
		}
	}
</style>
