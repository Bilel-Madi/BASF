<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import TextInput from '$lib/components/ui/TextInput.svelte';
	import Button from '$lib/components/ui/Button.svelte';

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

<div class="page-container">
	<h1 class="title">Add New Device</h1>

	<form class="form-container" on:submit|preventDefault={handleCheckDevice}>
		<TextInput
			type="text"
			id="eui"
			name="eui"
			label="Device EUI"
			bind:value={eui}
			required={true}
		/>
		<div class="button-group">
			<Button text="Scan QR Code" variant="google" on:click={startScanner} />
			<Button text="Check Device" type="submit" />
		</div>
	</form>
</div>

{#if error}
	<p class="error">{error}</p>
{/if}

{#if device}
	<h2>Device Found: {device.eui}</h2>
	<form on:submit|preventDefault={handleSubmit} class="device-form">
		<TextInput type="text" id="name" name="name" label="Name" bind:value={name} required={true} />
		<TextInput
			type="text"
			id="modelName"
			name="modelName"
			label="Model Name"
			bind:value={modelName}
			required={true}
		/>
		<TextInput
			type="date"
			id="installationDate"
			name="installationDate"
			label="Installation Date"
			bind:value={installationDate}
			required={true}
		/>
		{#if device.type === 'SOIL_MOISTURE'}
			<TextInput
				type="number"
				id="installedDepth"
				name="installedDepth"
				label="Installed Depth (cm)"
				bind:value={installedDepth}
				required={true}
			/>
		{/if}
		<TextInput
			type="text"
			id="location"
			name="location"
			label="Location (latitude,longitude)"
			bind:value={location}
			required={true}
			placeholder="e.g., 12.34,56.78"
		/>
		<TextInput
			type="number"
			id="reportingInterval"
			name="reportingInterval"
			label="Reporting Interval (minutes)"
			bind:value={reportingInterval}
			required={true}
		/>

		<div class="select-group">
			<label for="zoneId">Assign to Zone</label>
			<select id="zoneId" bind:value={zoneId} required>
				<option value="" disabled>Select a zone</option>
				{#each zones as zone}
					<option value={zone.id}>{zone.name}</option>
				{/each}
			</select>
		</div>

		<Button text="Register Device" type="submit" />
	</form>
{/if}

{#if showScanner}
	<div class="scanner-container">
		<video bind:this={videoElement} />
		<canvas bind:this={canvasElement} style="display: none;" />
		<Button text="Stop Scanner" variant="google" on:click={stopScanner} />
	</div>
{/if}

<style>
	.page-container {
		max-width: 600px;
		margin: 0 auto;
	}

	.title {
		font-size: 1.8rem;
		margin-bottom: 4rem;
		color: #333;
	}

	.form-container {
		max-width: 600px;
		margin: 0 auto;
	}

	.button-group {
		display: flex;
		gap: 1rem;
		margin-top: 1rem;
	}

	.device-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		max-width: 600px;
		margin: 2rem auto;
	}

	.select-group {
		margin: 1rem 0;
	}

	.select-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 600;
		font-size: 0.87rem;
	}

	select {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid #ebebeb;
		border-radius: 10px;
		font-size: 1rem;
		transition: all 0.2s ease;
	}

	select:focus {
		outline: none;
		border-color: #15fdb7;
		box-shadow: 0 0 0 1px rgba(21, 253, 183, 0.5);
	}

	.error {
		color: #dc2626;
		font-size: 0.9rem;
		margin: 1rem 0;
	}

	.scanner-container {
		margin-top: 1rem;
	}

	.scanner-container video {
		width: 100%;
		border-radius: 10px;
		margin-bottom: 1rem;
	}
</style>
