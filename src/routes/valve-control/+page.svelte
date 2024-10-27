<script>
	import { error } from '@sveltejs/kit';

	// Function to send a POST request to the +server.ts endpoint
	async function controlValve(action) {
		try {
			const response = await fetch('/valve-control', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ data: action === 'open' ? 'ff1d2000' : 'ff1d0000' })
			});

			if (!response.ok) {
				// Handle non-OK responses from the server
				const errMsg = await response.text();
				throw new Error(errMsg);
			}

			// Optionally, handle the response data
			const data = await response.json();
			console.log('Response:', data);
		} catch (e) {
			// Handle errors, such as network issues or JSON parsing errors
			console.error('Error:', e.message);
		}
	}
</script>

<div class="container">
	<h1>صمام التحكم</h1>
	<button on:click={() => controlValve('open')}>فتح الصمام</button>
	<button on:click={() => controlValve('close')}>إغلاق الصمام</button>
</div>

<style>
	@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;700&display=swap');

	h1,
	button {
		font-family: 'IBM Plex Sans Arabic', sans-serif;
	}

	h1 {
		font-weight: 700;
		color: #333;
		text-align: center;
		margin-bottom: 2rem;
		font-size: 2rem;
	}

	.container {
		display: flex;
		justify-content: center;
		align-items: center;
		flex-direction: column;
	}

	button {
		background-color: #060aeb; /* Green */
		border: none;
		color: white;
		padding: 15px 32px;
		text-align: center;
		text-decoration: none;
		display: inline-block;
		font-size: 16px;
		margin: 4px 2px;
		cursor: pointer;
		border-radius: 12px;
		transition: background-color 0.3s ease;

		/* Ensure both buttons are the same size */
		width: 150px; /* Example width */
		height: 50px; /* Example height */
		display: flex;
		justify-content: center;
		align-items: center;
	}
</style>
