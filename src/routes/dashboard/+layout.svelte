<!-- src/routes/dashboard/+layout.svelte -->
<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	let isMenuOpen = false;
	let showToast1 = false;
	let showToast2 = false;
	let showToast3 = false;
	let showMobileToast = false;
	let notificationCount = 3;
	let deferredPrompt;

	function toggleMenu() {
		isMenuOpen = !isMenuOpen;
		document.body.classList.toggle('locked', isMenuOpen); // Toggle the locked class
	}

	function closeMenu() {
		isMenuOpen = false;
		document.body.classList.remove('locked'); // Remove the locked class
	}

	function showComingSoon() {
		alert('Coming soon : This page is currently under construction.');
	}

	function showNotification() {
		if (notificationCount > 0) {
			if (notificationCount === 3) {
				showToast1 = true;
				setTimeout(() => {
					showToast1 = false;
				}, 4000);
			} else if (notificationCount === 2) {
				showToast2 = true;
				setTimeout(() => {
					showToast2 = false;
				}, 4000);
			} else if (notificationCount === 1) {
				showToast3 = true;
				setTimeout(() => {
					showToast3 = false;
				}, 4000);
			}
			notificationCount -= 1;
		}

		const notificationBadge = document.querySelector('.notification-badge');
		if (notificationBadge) {
			notificationBadge.textContent = notificationCount > 0 ? notificationCount.toString() : '';
			if (notificationCount === 0) {
				notificationBadge.style.display = 'none';
			}
		}
	}

	function closeToast1() {
		showToast1 = false;
	}

	function closeToast2() {
		showToast2 = false;
	}

	function closeToast3() {
		showToast3 = false;
	}

	function closeMobileToast() {
		showMobileToast = false;
	}

	function navigateTo(url) {
		window.location.assign(url);
	}

	function showMobileToastNotification() {
		showMobileToast = true;
	}

	onMount(() => {
		if (typeof window !== 'undefined') {
			const clockElement = document.getElementById('gmt-clock');
			function updateClock() {
				const now = new Date();
				const gmtPlus3 = new Date(now.getTime() + 3 * 60 * 60 * 1000);
				let hours = gmtPlus3.getUTCHours();
				const minutes = String(gmtPlus3.getUTCMinutes()).padStart(2, '0');
				const ampm = hours >= 12 ? 'PM' : 'AM';
				hours = hours % 12;
				hours = hours ? hours : 12; // the hour '0' should be '12'
				clockElement.textContent = `${hours}:${minutes} ${ampm}`;
			}
			setInterval(updateClock, 1000);
			updateClock(); // Initial call to set the clock immediately

			// Capture the beforeinstallprompt event and store it
			window.addEventListener('beforeinstallprompt', (e) => {
				e.preventDefault();
				deferredPrompt = e;
			});
		}
	});

	// Function to show the install prompt
	function promptInstall() {
		if (deferredPrompt) {
			deferredPrompt.prompt();
			deferredPrompt.userChoice.then((choiceResult) => {
				if (choiceResult.outcome === 'accepted') {
					console.log('User accepted the A2HS prompt');
				} else {
					console.log('User dismissed the A2HS prompt');
				}
				deferredPrompt = null;
			});
		}
	}
</script>

<header id="main-header">
	<div class="logo-and-title">
		<img src="/logo1.png" alt="Arddata Logo" class="header-logo" />
		<div>
			<h4>Arddata™</h4>
		</div>
		<div class="soilmetrics"><h5>Soilmetrics Precision Agriculture</h5></div>
	</div>
	<div class="nav-container">
		<nav on:click={showMobileToastNotification}>
			<ul>
				<li>
					<a href="#" title="">
						<span>Connected Devices : </span>
					</a>
				</li>
				<li>
					<a href="#" title="1 Valves are Online">
						<div class="material-symbols-outlined valve">valve</div>
						<span>1</span>
					</a>
				</li>
				<li>
					<a href="#" title="6 Soil Sensors are Online">
						<div class="material-symbols-outlined nest_remote_comfort_sensor">
							nest_remote_comfort_sensor
						</div>
						<span>6</span>
					</a>
				</li>
				<li>
					<a href="#" title="1 Gateway is Online">
						<div class="material-symbols-outlined sensors">sensors</div>
						<span>1</span>
					</a>
				</li>
				<li
					id="gmt-clock"
					style="color: white; margin-left: 0px; width: 60px; text-align: center;"
				/>
			</ul>
		</nav>
		<div class="notification-icon" on:click={showNotification}>
			<div class="material-symbols-outlined">notifications</div>
			<div class="notification-badge">{notificationCount}</div>
		</div>
		<div class="hamburger" class:open={isMenuOpen} on:click={toggleMenu}>
			<div />
			<div />
			<div />
		</div>
	</div>
</header>

<div class="menu" class:open={isMenuOpen}>
	<div class="menu-items">
		<div class="menu-item" style="--menu-item-order: 1;" on:click={() => navigateTo('/')}>
			<img src="analytics.svg" alt="Fields" />
			<span>Dashboard</span>
		</div>
		<div class="menu-item" style="--menu-item-order: 2;" on:click={() => navigateTo('/devices')}>
			<img src="devices.svg" alt="Devices" />
			<span>Devices</span>
		</div>
		<div class="menu-item" style="--menu-item-order: 3;" on:click={showComingSoon}>
			<img src="fields.svg" alt="Fields" />
			<span>Fields</span>
		</div>
		<div class="menu-item" style="--menu-item-order: 4;" on:click={showComingSoon}>
			<img src="dashboard.svg" alt="Analytics" />
			<span>Analytics</span>
		</div>
		<div class="menu-item" style="--menu-item-order: 5;" on:click={showComingSoon}>
			<img src="settings.svg" alt="Settings" />
			<span>Settings</span>
		</div>
		<div class="menu-item" style="--menu-item-order: 6;" on:click={showComingSoon}>
			<img src="about.svg" alt="About" />
			<span>About</span>
		</div>
	</div>
	<hr class="menu-separator" />
	<div class="menu-footer">
		<img src="logo-color.png" alt="Arddata Logo" class="footer-logo" />
		<p class="mobile-only"><a href="#" on:click={promptInstall}>Install the App</a></p>
		<p>Arddata™ - All Rights Reserved 2024</p>
		<p>For support email us at : info@misbargeo.com</p>
		<p><a href="http://www.arddata.com" target="_blank">www.arddata.com</a></p>
	</div>
</div>

<section id="main">
	<div id="main-content">
		<slot />
	</div>
</section>

{#if showToast1 || showToast2 || showToast3 || showMobileToast}
	<div class="overlay" />

	<div class="toast-container">
		{#if showToast1}
			<div class="toast">
				<div class="toast-content">
					<div class="toast-header">
						<div class="status-container">
							<div class="status-dot" />
							<span>System Healthy</span>
						</div>
						<button class="close-button" on:click={closeToast1}>×</button>
					</div>
					<div class="toast-body">All systems are operational.</div>
				</div>
			</div>
		{/if}

		{#if showToast2}
			<div class="toast">
				<div class="toast-content">
					<div class="toast-header">
						<div class="status-container">
							<div class="status-dot yellow" />
							<span>Fields Health</span>
						</div>
						<button class="close-button" on:click={closeToast2}>×</button>
					</div>
					<div class="toast-body">
						Watermelon 1 Field Moisture and EC are below optimal level, please consider irrigating
						the field.
					</div>
				</div>
			</div>
		{/if}

		{#if showToast3}
			<div class="toast">
				<div class="toast-content">
					<div class="toast-header">
						<div class="status-container">
							<div class="status-dot" />
							<span>Contact Us</span>
						</div>
						<button class="close-button" on:click={closeToast3}>×</button>
					</div>
					<div class="toast-body">
						For more information on Arddata's App contact us at
						<p>info@misbargeo.com</p>
					</div>
				</div>
			</div>
		{/if}

		{#if showMobileToast}
			<div class="toast mobile-toast">
				<div class="toast-content">
					<div class="toast-header">
						<div class="status-container">
							<span>Connected Devices :</span>
						</div>
						<button class="close-button" on:click={closeMobileToast}>×</button>
					</div>
					<div class="toast-body">
						<div class="status-container">
							<div class="material-symbols-outlined sensors">sensors</div>
							<span>1&nbsp; Gateway is connected</span>
						</div>
						<div class="status-container">
							<div class="material-symbols-outlined nest_remote_comfort_sensor">
								nest_remote_comfort_sensor
							</div>
							<span>6&nbsp; Soil moisture sensors are connected</span>
						</div>
						<div class="status-container">
							<div class="material-symbols-outlined valve">valve</div>
							<span>1&nbsp; Solenoid valve controller is connected</span>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
{/if}

<style>
	@media only screen and (max-width: 750px) {
		/* Display the install link only on mobile devices */
		.mobile-only {
			display: block;
		}
	}

	@media only screen and (min-width: 751px) {
		/* Hide the install link on devices wider than 750px */
		.mobile-only {
			display: none;
		}
	}
	body.locked {
		overflow: hidden;
	}
	/* Main header */
	#main-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background-color: var(--header-base, #333);
		padding: 1rem 1.5rem;
		height: 4rem;
	}

	.logo-and-title {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
	}

	.header-logo {
		height: 25px;
		width: auto;
	}

	.soilmetrics {
		margin-left: 1rem;
	}

	#main-header h4 {
		color: rgb(255, 255, 255);
		font-size: 1.2rem;
		font-weight: 500;
	}

	#main-header h5 {
		color: rgb(255, 255, 255);
		font-size: 0.95rem;
		font-weight: 300;
	}

	.nav-container {
		display: flex;
		align-items: center;
		gap: 20px; /* Adjust the gap as needed */
	}

	#main-header nav,
	#main-header ul,
	#main-header a {
		margin: 0;
		padding: 0;
		display: flex;
		align-items: center;
		gap: 0rem;
		color: #02236b;
	}

	#main-header nav a {
		display: flex;
		align-items: center;
		text-decoration: none;
	}

	#main-header nav a span {
		margin-left: 5px;
		display: inline-block;
		color: white;
	}

	#main-header nav {
		background-color: #0b096e;
		border-radius: 8px;
		padding: 0.3rem 1rem;
	}

	#main-header nav ul {
		list-style: none;
		margin: 0;
		padding: 0;
		gap: 1rem;
	}

	#main-header a span {
		display: none;
	}

	#main {
		position: relative;
	}

	#sidebar__nav ul a {
		display: flex;
		padding: 0.75rem 0;
		gap: 0.75rem;
		align-items: center;
		text-decoration: none;
		color: var(--sidebar-link-color);
		padding-right: 3rem;
		transition: color 0.3s ease-in-out;
	}

	#main-content {
		padding: 0.3rem;
		background-color: #fdfdfd;
	}

	@media only screen and (max-width: 750px) {
		#main-content {
			padding: 0rem;
		}

		#main-header {
			position: relative;
			top: 0;
			left: 0;
			width: 100%;
			background-color: transparent;
			z-index: 1000;
		}

		.logo-and-title h5 {
			display: none;
		}
	}

	/* Hamburger Menu */
	.hamburger {
		cursor: pointer;
		display: inline-block;
	}

	.hamburger div {
		width: 25px;
		height: 2px; /* Updated height */
		background-color: white;
		margin: 5px 0; /* Adjusted margin for better spacing */
		border-radius: 8px; /* Rounded edges */
		transition: all 0.4s ease;
		transform-origin: center; /* Smooth rotation from the center */
	}

	/* Hamburger Animation */
	.hamburger.open div:nth-child(1) {
		transform: rotate(-45deg) translate(-5px, 5px);
	}

	.hamburger.open div:nth-child(2) {
		opacity: 0;
		transform: scale(0); /* Scaling effect */
	}

	.hamburger.open div:nth-child(3) {
		transform: rotate(45deg) translate(-5px, -5px);
	}

	.hamburger div:not(:nth-child(2)) {
		transition: transform 0.4s ease-in-out, background-color 0.4s ease-in-out;
	}

	/* Notification Icon */
	.notification-icon {
		position: relative;
		cursor: pointer;
		display: flex;
		align-items: center;
	}

	.notification-icon .material-symbols-outlined {
		font-size: 24px;
		color: white;
	}

	.notification-badge {
		position: absolute;
		top: -7px;
		right: -6px;
		background-color: rgb(255, 38, 0);
		color: #ffffff;
		border-radius: 50%;
		width: 16px;
		height: 16px;
		display: flex;
		justify-content: center;
		align-items: center;
		font-size: 12px;

		padding: 0.55rem;
	}

	/* Mega Menu */
	.menu {
		display: none;
		position: absolute;
		top: 50px;
		right: 20px;
		background-color: white;
		padding: 2rem;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
		z-index: 1000;
		transition: transform 0.4s ease, opacity 0.4s ease;
		transform: translateY(-20px);
		opacity: 0;
		border-radius: 15px;
	}

	.menu.open {
		display: block;
		transform: translateY(0) scale(1);
		opacity: 1;
		animation: menuSlideIn 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55);
	}

	@keyframes menuSlideIn {
		from {
			opacity: 0;
			transform: translateY(-30px) scale(0.9);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	.menu-items {
		display: grid;
		grid-template-columns: repeat(3, 1fr); /* 3 items per row */
		gap: 0rem;
	}

	.menu-item {
		text-align: center;
		transition: transform 0.2s ease, opacity 0.3s ease, background-color 0.3s ease;
		opacity: 0;
		transform: translateX(-20px);
		animation: menuItemFadeIn 0.2s forwards;
		animation-delay: calc(var(--menu-item-order) * 0.06s);
		border-radius: 8px; /* To keep the border radius same as the image */
		padding: 1.5rem;
	}

	.menu-item:hover {
		background-color: #f7f7f7; /* Change this color as needed */
		cursor: pointer;
	}

	@keyframes menuItemFadeIn {
		from {
			opacity: 0;
			transform: translateX(-20px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	.menu-item img {
		width: 6rem; /* Image size 2rem */
		height: 6rem;
		border-radius: 8px;
	}

	.menu-item span {
		display: block;
		margin-top: 0.5rem;
		font-weight: bold;
	}

	.menu-separator {
		border: 0;
		height: 1px;
		background: #ddd;
		margin: 1rem 0;
		margin-top: 3rem;
	}

	.menu-footer {
		text-align: start;
		color: #333;
		font-size: 0.9rem;
	}

	.menu-footer a {
		text-decoration: none;
	}

	.menu-footer a:hover {
		text-decoration: underline;
	}

	.menu-footer .footer-logo {
		height: 35px;
		width: auto;
		display: block;
		margin-bottom: 1rem;
	}

	/* Responsive Styles */
	@media only screen and (max-width: 750px) {
		.logo-and-title h5 {
			display: none;
		}

		#main-content {
			padding: 0;
		}

		#main-header {
			width: 80%;
			background-color: transparent;
		}
	}

	/* Main Content Styles */
	#main-content {
		padding: 0.3rem;
		background-color: #fdfdfd;
	}

	/* Independent icon colors */
	.material-symbols-outlined.valve {
		color: #00ff95; /* Example color for valve */
	}

	.material-symbols-outlined.nest_remote_comfort_sensor {
		color: #00ff95; /* Example color for sensors */
	}

	.material-symbols-outlined.sensors {
		color: #00ff95; /* Example color for gateway */
	}

	/* Toast Notification */

	.overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.5); /* Adjust the opacity as needed */
		z-index: 1000; /* Make sure it's behind the toast */
		pointer-events: none; /* Allow clicks to pass through to underlying elements */
	}
	.toast-container {
		position: fixed;
		bottom: 20px;
		right: 20px;
		display: flex;
		flex-direction: column;
		gap: 10px; /* Adjust the gap between toasts */
		z-index: 1001;
	}

	.toast {
		width: 400px;
		background-color: #1f1d83;
		border: 0px solid #ccc;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
		border-radius: 15px;
		overflow: hidden;
		animation: fadeIn 0.5s, fadeOut 0.5s 3.5s; /* Fade in and out */
	}

	.toast-content {
		padding: 1rem;
		display: flex;
		flex-direction: column;
	}

	.toast-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		color: white;
	}

	.toast-header .status-container {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.toast-body {
		color: white;
		margin-top: 2rem;
		margin-bottom: 1rem;
		line-height: 1.2rem;
	}
	.toast-body p {
		color: white;
		font-size: 0.9rem;
	}

	.status-dot {
		width: 10px;
		height: 10px;
		background-color: #00ff95;
		border-radius: 50%;
	}

	.status-dot.yellow {
		background-color: #ffd900;
	}

	.toast-header span {
		color: white;
	}

	.close-button {
		background: none;
		border: none;
		font-size: 1.2rem;
		cursor: pointer;
		color: #ffffff;
	}

	.close-button:hover {
		color: #00ff95;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes fadeOut {
		from {
			opacity: 1;
			transform: translateX(0);
		}
		to {
			opacity: 0;
			transform: translateX(100%);
		}
	}

	@media only screen and (max-width: 750px) {
		.hamburger {
			display: block; /* Ensure the hamburger menu is visible */
		}
	}

	@media only screen and (max-width: 750px) {
		.menu {
			display: none; /* Initially hide the menu */
			position: fixed; /* Fix the position */
			top: 50px;
			left: 5px;
			width: 98%;
			height: 100%;
			background-color: white; /* Full-screen background */
			padding: 2rem;
			box-shadow: none; /* Remove the shadow */
			z-index: 1000;
			transition: transform 0.4s ease, opacity 0.4s ease;
			transform: translateY(-100%);
			opacity: 0;
			overflow-y: auto; /* Allow scrolling */
		}

		.menu.open {
			display: block;
			transform: translateY(0);
			opacity: 1;
		}

		.menu-items {
			display: grid;
			grid-template-columns: repeat(2, 1fr); /* Stack items vertically */
			gap: 1rem;
		}

		.menu-item {
			opacity: 1;
			transform: none;
			animation: none;
		}
	}

	@media only screen and (max-width: 750px) {
		.menu-item {
			transition: transform 0.2s ease, opacity 0.3s ease, background-color 0.3s ease;
		}

		.menu-item:hover {
			background-color: #f7f7f7;
			cursor: pointer;
		}
	}

	/* Responsive Styles for Toast Notifications */
	@media only screen and (max-width: 750px) {
		.toast-container {
			bottom: 10px;
			right: 10px;
			left: 10px; /* Center toasts horizontally */
		}

		.toast {
			width: auto; /* Adjust width to fit the screen */
			max-width: 100%; /* Ensure some margin on both sides */
		}

		.toast-content {
			padding: 0.8rem;
		}

		.toast-header {
			flex-direction: column;
			align-items: flex-start;
		}

		.toast-header .status-container {
			margin-bottom: 0.5rem;
		}

		.toast-body {
			margin-top: 1rem;
			margin-bottom: 0.5rem;
		}

		.close-button {
			align-self: flex-end;
		}
	}

	/* Hide the first <li> element in mobile view */
	@media only screen and (max-width: 750px) {
		nav ul li:first-child {
			display: none;
		}

		/* Adjust the remaining navigation items */
		nav ul {
			padding: 0;
			margin: 0;
			list-style: none;
			display: flex;
			flex-direction: row;
			justify-content: space-between; /* Distribute the remaining items evenly */
			gap: 3px; /* Adjust the gap as needed */
			padding: 0;
		}

		/* Adjust the space between logo and Arddata */
		.logo-and-title {
			gap: 3px; /* Adjust the gap value as needed */
			margin-right: -2rem;
		}

		.logo-and-title h5 {
			display: none;
		}

		nav ul li {
			flex: 1; /* Allow items to grow and fill the space */
			text-align: center; /* Center align the text */
		}

		nav ul li a {
			display: flex;
			flex-direction: row; /* Align items in a row */
			align-items: center;
			justify-content: center;
			padding: 5px 5px;
			text-decoration: none;
			color: white; /* Adjust color as needed */
			font-size: 0.7rem; /* Adjust font size as needed */
			gap: 3px; /* Adjust the gap between icon and text as needed */
		}

		nav ul li a .material-symbols-outlined {
			font-size: 1.1rem; /* Adjust icon size as needed */
		}

		/* Remove the clock element */
		#gmt-clock {
			display: none;
		}
		.nav-container {
			gap: 15px; /* Reduce gap between navigation items */
			padding: 0.5rem 2rem; /* Adjust padding as needed */
		}
		#main-header {
			padding: 0.5rem 1rem; /* Adjust padding as needed */

			background-color: transparent;
		}
	}

	.toast-body .status-container {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 8px;
	}
	.toast-body .status-container span {
		color: white; /* Set text color to white */
	}
	.toast-body .status-container .material-symbols-outlined {
		font-size: 24px;
		color: #00ff95; /* Example color, adjust as needed */
	}

	/* Ensure the mobile toast notification looks similar to other toasts but without the status dot */
	.toast-header .status-container {
		gap: 8px;
	}

	/* Add this CSS for the mobile toast */
	.toast.mobile-toast {
		animation: fadeIn 0.5s; /* Only fade-in animation for mobile toast */
	}

	/* Keep the fade-out animation for other toasts */
	.toast:not(.mobile-toast) {
		animation: fadeIn 0.5s, fadeOut 0.5s 3.5s; /* Fade in and out */
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes fadeOut {
		from {
			opacity: 1;
			transform: translateX(0);
		}
		to {
			opacity: 0;
			transform: translateX(100%);
		}
	}
</style>
