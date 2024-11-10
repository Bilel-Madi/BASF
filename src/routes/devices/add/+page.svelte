<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	let eui = '';
	let error = '';
	let device = null;
	let zones = [];
	let showScanner = false;
	let videoElement;
	let canvasElement;
	let canvasContext;
	let videoStream;

	let name = '';
	let modelName = '';
	let installationDate = '';
	let installedDepth = '';
	let location = '';
	let reportingInterval = '';
	let zoneId = '';

	const handleCheckDevice = async () => {
		const response = await fetch('/api/devices/check', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ eui })
		});

		if (response.ok) {
			device = await response.json();
			error = '';
		} else {
			error = await response.text();
			device = null;
		}
	};

	const handleSubmit = async (event) => {
		event.preventDefault();

		const response = await fetch('/devices/add', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				eui,
				name,
				modelName,
				installationDate,
				installedDepth,
				location,
				reportingInterval,
				zoneId
			})
		});

		if (response.ok) {
			await goto('/devices');
		} else {
			error = await response.text();
		}
	};

	// Fetch zones for the user
	onMount(async () => {
		const res = await fetch('/api/zones');
		if (res.ok) {
			zones = await res.json();
		} else {
			console.error('Error fetching zones');
		}
	});

	// QR Code scanning functions
	import jsQR from 'jsqr';

	const startScanner = async () => {
		showScanner = true;
		videoStream = await navigator.mediaDevices.getUserMedia({
			video: { facingMode: 'environment' }
		});
		videoElement.srcObject = videoStream;
		videoElement.setAttribute('playsinline', 'true');
		await videoElement.play();
		requestAnimationFrame(tick);
	};

	const tick = () => {
		if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
			canvasElement.height = videoElement.videoHeight;
			canvasElement.width = videoElement.videoWidth;
			canvasContext.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
			const imageData = canvasContext.getImageData(0, 0, canvasElement.width, canvasElement.height);
			const code = jsQR(imageData.data, imageData.width, imageData.height);

			if (code) {
				eui = code.data;
				stopScanner();
			} else {
				requestAnimationFrame(tick);
			}
		} else {
			requestAnimationFrame(tick);
		}
	};

	const stopScanner = () => {
		showScanner = false;
		videoStream.getTracks().forEach((track) => track.stop());
	};
</script>

<h1>Add New Device</h1>

<form on:submit|preventDefault={handleCheckDevice}>
	<label for="eui">Device EUI:</label>
	<input type="text" id="eui" bind:value={eui} required />
	<button type="button" on:click={startScanner}>Scan QR Code</button>
	<button type="submit">Check Device</button>
</form>

{#if error}
	<p style="color: red;">{error}</p>
{/if}

{#if device}
	<h2>Device Found: {device.eui}</h2>
	<form on:submit|preventDefault={handleSubmit}>
		<div>
			<label>Name:</label>
			<input type="text" bind:value={name} required />
		</div>
		<div>
			<label>Model Name:</label>
			<input type="text" bind:value={modelName} required />
		</div>
		<div>
			<label>Installation Date:</label>
			<input type="date" bind:value={installationDate} required />
		</div>
		{#if device.type === 'SOIL_MOISTURE'}
			<div>
				<label>Installed Depth (cm):</label>
				<input type="number" step="0.01" bind:value={installedDepth} required />
			</div>
		{/if}
		<div>
			<label>Location (latitude,longitude):</label>
			<input type="text" bind:value={location} placeholder="e.g., 12.34,56.78" required />
		</div>
		<div>
			<label>Reporting Interval (minutes):</label>
			<input type="number" bind:value={reportingInterval} required />
		</div>
		<div>
			<label>Assign to Zone:</label>
			<select bind:value={zoneId} required>
				<option value="" disabled>Select a zone</option>
				{#each zones as zone}
					<option value={zone.id}>{zone.name}</option>
				{/each}
			</select>
		</div>
		<button type="submit">Register Device</button>
	</form>
{/if}

{#if showScanner}
	<div>
		<video bind:this={videoElement} style="width: 100%;" />
		<canvas bind:this={canvasElement} style="display: none;" />
		<button on:click={stopScanner}>Stop Scanner</button>
	</div>
{/if}

<style>
	form {
		margin-bottom: 1rem;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
	}

	input,
	select {
		width: 100%;
		padding: 0.5rem;
		margin-bottom: 1rem;
	}

	button {
		margin-right: 1rem;
	}
</style>
