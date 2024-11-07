<nav>
	<a href="/auth/logout" role="button">Logout</a>
</nav>

<slot />

<style>
	nav {
		position: fixed;
		top: 1rem;
		right: 1rem;
	}

	a {
		padding: 0.5rem 1rem;
		background-color: #ff3e00;
		color: white;
		text-decoration: none;
		border-radius: 4px;
	}

	a:hover {
		background-color: #ff6240;
	}
</style>
