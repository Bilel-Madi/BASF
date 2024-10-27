<script>
	let isMenuOpen = false;
	function toggleMenu() {
		isMenuOpen = !isMenuOpen;
	}
</script>

<header id="main-header">
	<div class="logo-and-title">
		<img src="logo1.png" alt="Ardsense Logo" class="header-logo" />
		<div>
			<h4>Arddata™</h4>
		</div>
		<div><h5>Soilmetrics Precision Agriculture</h5></div>
	</div>
	<div class="nav-container">
		<nav>
			<ul>
				<li>
					<a href="#" title="">
						<span>Connected Devices : </span>
					</a>
				</li>
				<li>
					<a href="#" title="2 Valves are Online">
						<div class="material-symbols-outlined valve">valve</div>
						<span>2</span>
					</a>
				</li>
				<li>
					<a href="#" title="8 Soil Sensors are Online">
						<div class="material-symbols-outlined nest_remote_comfort_sensor">
							nest_remote_comfort_sensor
						</div>
						<span>8</span>
					</a>
				</li>
				<li>
					<a href="#" title="1 Gateway is Online">
						<div class="material-symbols-outlined sensors">sensors</div>
						<span>1</span>
					</a>
				</li>
			</ul>
		</nav>

		<div class="notification-icon">
			<div class="material-symbols-outlined">notifications</div>
			<div class="notification-badge">1</div>
		</div>
		<div class="hamburger {isMenuOpen ? 'open' : ''}" on:click={toggleMenu}>
			<div />
			<div />
			<div />
		</div>
	</div>
</header>

<div class="menu {isMenuOpen ? 'open' : ''}">
	<div class="menu-items">
		<div class="menu-item">
			<img src="fields.svg" alt="Fields" />
			<span>Fields</span>
		</div>
		<div class="menu-item">
			<img src="devices.svg" alt="Devices" />
			<span>Devices</span>
		</div>
		<div class="menu-item">
			<img src="analytics.svg" alt="Analytics" />
			<span>Analytics</span>
		</div>
		<div class="menu-item">
			<img src="settings.svg" alt="Settings" />
			<span>Settings</span>
		</div>
		<div class="menu-item">
			<img src="about.svg" alt="About" />
			<span>About</span>
		</div>
	</div>
	<hr class="menu-separator" />
	<div class="menu-footer">
		<img src="logo-color.png" alt="Arddata Logo" class="footer-logo" />
		<p>Arddata™ - All Rights Reserved 2024</p>
		<p>For support call: +00962797233316</p>
		<p><a href="http://www.arddata.com" target="_blank">www.arddata.com</a></p>
	</div>
</div>

<section id="main">
	<div id="main-content">
		<slot />
	</div>
</section>

<style>
	/* Main header */
	#main-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background-color: var(--header-base, #333);
		padding: 1rem 1.5rem;
		height: 3.8rem;
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
		background-color: #0d0c46;
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
		#main-header nav ul li {
			display: none;
		}

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
		top: -5px;
		right: -5px;
		background-color: rgb(255, 30, 0);
		color: white;
		border-radius: 50%;
		width: 16px;
		height: 16px;
		display: flex;
		justify-content: center;
		align-items: center;
		font-size: 12px;
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
		transform: translateY(0);
		opacity: 1;
	}

	.menu-items {
		display: grid;
		grid-template-columns: repeat(3, 1fr); /* 3 items per row */
		gap: 3rem;
	}

	.menu-item {
		text-align: center;
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
		nav ul li {
			display: none;
		}

		.logo-and-title h5 {
			display: none;
		}

		#main-content {
			padding: 0;
		}

		#main-header {
			width: 100%;
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
</style>
