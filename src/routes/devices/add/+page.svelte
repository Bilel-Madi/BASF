<!-- src/routes/devices/add/+page.svelte -->

<script lang="ts">
	import { onMount } from 'svelte';
	import MapboxMap from '$lib/components/map/MapboxMap.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import TextInput from '$lib/components/ui/TextInput.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Breadcrumbs from '$lib/components/ui/Breadcrumbs.svelte';
	import { tick } from 'svelte';
	import jsQR from 'jsqr';
	import { colorMap } from '$lib/colorMap';
	import type { ZoneColor } from '@prisma/client';

	let eui = '';
	let error = '';
	let device = null;
	let zones = [];
	let showScanner = false;
	let videoElement: HTMLVideoElement;
	let canvasElement: HTMLCanvasElement;
	let canvasContext: CanvasRenderingContext2D;
	let videoStream: MediaStream;

	let name = '';
	let modelName = '';
	let installationDate = '';
	let installedDepth = '';
	let location = '';
	let showMapModal = false;
	let reportingInterval = '';
	let zoneId = '';

	let scannerOverlaySize = 250;

	const MAPBOX_ACCESS_TOKEN =
		'pk.eyJ1IjoiYmlsZWxtYWRpIiwiYSI6ImNsbmJnM2ZrNTA1cXQybG56N2c0cjJ2bTcifQ.j-O_Igwc-2p3Na-mkusaDg';

	const openMapModal = async () => {
		showMapModal = true;
		await tick(); // Wait for the DOM to update
	};

	const closeMapModal = () => {
		showMapModal = false;
	};

	function handleLocationSelected(event) {
		const { longitude, latitude } = event.detail;
		location = `${latitude},${longitude}`;
	}

	let mapRef;

	const breadcrumbItems = [
		{ label: 'Home', href: '/' },
		{ label: 'Devices', href: '/devices' },
		{ label: 'Add Device' }
	];

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

		const response = await fetch('/api/devices/add', {
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
	const startScanner = async () => {
		showScanner = true;
		await tick(); // Wait for the DOM to update and render the Modal

		// Ensure canvasElement is defined
		if (!canvasElement) {
			console.error('Canvas element is not defined');
			return;
		}

		canvasContext = canvasElement.getContext('2d', { willReadFrequently: true });

		try {
			videoStream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: 'environment' }
			});
			videoElement.srcObject = videoStream;
			videoElement.setAttribute('playsinline', 'true');
			await videoElement.play();

			requestAnimationFrame(tickScanner);
		} catch (error) {
			console.error('Error accessing camera:', error);
			stopScanner();
		}
	};

	const tickScanner = () => {
		if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
			canvasElement.height = videoElement.videoHeight;
			canvasElement.width = videoElement.videoWidth;
			canvasContext.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
			const imageData = canvasContext.getImageData(0, 0, canvasElement.width, canvasElement.height);

			try {
				const code = jsQR(imageData.data, imageData.width, imageData.height);

				if (code) {
					console.log('QR Code found:', code.data);
					eui = code.data;
					stopScanner();
					handleCheckDevice();
				} else {
					requestAnimationFrame(tickScanner);
				}
			} catch (err) {
				console.error('Error processing QR code:', err);
				requestAnimationFrame(tickScanner);
			}
		} else {
			requestAnimationFrame(tickScanner);
		}
	};

	const stopScanner = () => {
		showScanner = false;
		if (videoStream) {
			videoStream.getTracks().forEach((track) => track.stop());
		}
	};

	const getCurrentLocation = () => {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				// Success callback
				(position) => {
					const lat = position.coords.latitude;
					const lng = position.coords.longitude;
					location = `${lat},${lng}`;
					if (mapRef) {
						mapRef.setCenter([lng, lat], 18);
						mapRef.setMarkerPosition([lng, lat]);
					}
				},
				// Error callback
				(error) => {
					console.error('Error getting location:', error);
					let errorMessage = 'Unable to retrieve your location.';
					if (error.code === error.PERMISSION_DENIED) {
						errorMessage = 'Location permission denied.';
					} else if (error.code === error.POSITION_UNAVAILABLE) {
						errorMessage = 'Location information is unavailable.';
					} else if (error.code === error.TIMEOUT) {
						errorMessage = 'The request to get your location timed out.';
					}
					alert(errorMessage);
				}
			);
		} else {
			alert('Geolocation is not supported by this browser.');
		}
	};

	// Add project data to the exported data type
	export let data: {
		project: Project;
		zones: Zone[];
	};

	// Extract the project's center coordinates
	let projectCenter: [number, number] = [0, 0];

	$: if (data.project && data.project.center) {
		projectCenter = data.project.center.coordinates as [number, number];
	}

	function getPastelColor(color: ZoneColor | null): string {
		return color ? colorMap[color] : '#CCCCCC'; // Use the colorMap for known colors
	}
</script>

<div class="page-container">
	<Breadcrumbs items={breadcrumbItems} />
	<div class="header">
		<h1 class="title">Add New Device</h1>
	</div>

	<div class="form-container">
		<TextInput
			type="text"
			id="eui"
			name="eui"
			label="Device EUI"
			bind:value={eui}
			required={false}
		/>
		<div class="button-group">
			<Button text="Scan QR Code" variant="google" type="button" on:click={startScanner} />
			<Button text="Check Device" type="button" on:click={handleCheckDevice} />
		</div>
	</div>

	{#if error}
		<p class="error">{error}</p>
	{/if}

	{#if device}
		<div class="card">
			<h2>Device Found: {device.eui}</h2>
			<form on:submit|preventDefault={handleSubmit} class="device-form">
				<TextInput
					type="text"
					id="name"
					name="name"
					label="Name"
					bind:value={name}
					required={true}
				/>
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
				<div class="location-input-group">
					<TextInput
						type="text"
						id="location"
						name="location"
						label="Location (latitude,longitude)"
						bind:value={location}
						required={true}
						placeholder="e.g., 12.34,56.78"
					/>
					<Button text="Pick on Map" type="button" on:click={openMapModal} />
				</div>
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
		</div>
	{/if}
</div>

{#if showScanner}
	<Modal on:close={stopScanner}>
		<div class="scanner-container">
			<div class="scanner-content">
				<p class="scanner-text">Scan the Device QR Code</p>
				<div class="video-container">
					<video bind:this={videoElement} />
					<canvas bind:this={canvasElement} class="hidden-canvas" />
					<div class="scanner-overlay">
						<div class="scanner-square" />
					</div>
				</div>
				<Button text="Cancel" variant="google" type="button" on:click={stopScanner} />
			</div>
		</div>
	</Modal>
{/if}
{#if showMapModal}
	<Modal on:close={closeMapModal}>
		<div class="map-modal-content">
			<MapboxMap
				bind:this={mapRef}
				accessToken={MAPBOX_ACCESS_TOKEN}
				center={projectCenter}
				zoom={15}
				allowMarkerPlacement={true}
				on:locationSelected={handleLocationSelected}
				mapFeatures={[
					// Project boundary
					{
						type: 'Feature',
						geometry: data.project.geometry,
						properties: {
							type: 'projectBoundary',
							id: data.project.id,
							name: data.project.name
						}
					},
					// Zone boundaries
					...data.zones.map((zone) => ({
						type: 'Feature',
						geometry: zone.geometry,
						properties: {
							type: 'zone',
							id: zone.id,
							name: zone.name,
							color: getPastelColor(zone.color)
						}
					}))
				]}
			/>
			<div class="modal-actions">
				<Button text="Current Location" on:click={getCurrentLocation} />
				<Button
					text="Clear"
					variant="danger"
					on:click={() => {
						mapRef.clearMarker();
						location = '';
					}}
				/>
				<Button text="Close" variant="secondary" on:click={closeMapModal} />
			</div>
		</div>
	</Modal>
{/if}

<style>
	.page-container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 2rem;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	.title {
		font-size: 1.875rem;
		font-weight: 600;
		color: #111827;
	}

	.form-container {
		max-width: 600px;
		margin: 0 auto;
	}

	.button-group {
		display: flex;
		gap: 1rem;
		margin-top: 1rem;
		@media (max-width: 400px) {
			flex-direction: column;
		}
	}

	.device-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		max-width: 600px;
		margin: 2rem auto;
		padding: 0 1rem;
	}
	.location-input-group {
		display: flex;
		align-items: flex-end;
		gap: 0.5rem;
		width: 100%;
	}

	.location-input-group :global(div) {
		width: 80%;
	}

	.location-input-group :global(button) {
		width: 20%;
		font-size: 0.9rem;
		padding: 0.5rem 0.75rem;
		white-space: nowrap;
	}

	.map-modal-content {
		display: flex;
		flex-direction: column;
		align-items: stretch;
	}

	.map-modal-content {
		display: flex;
		flex-direction: column;
		align-items: stretch;
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 1rem;
		flex-wrap: wrap;
	}

	@media (max-width: 480px) {
		.modal-actions {
			justify-content: center;
		}
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
		width: 100%;
		max-width: 500px;
		margin: 0 auto;
	}

	.scanner-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.scanner-text {
		font-size: 1.2rem;
		font-weight: 600;
		color: #333;
		margin-bottom: 1rem;
	}

	.video-container {
		position: relative;
		width: 100%;
		aspect-ratio: 1/1;
		overflow: hidden;
		border-radius: 10px;
	}

	.video-container video {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.hidden-canvas {
		display: none;
	}

	.scanner-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.scanner-square {
		width: min(250px, 80vw);
		height: min(250px, 80vw);
		border: 2px solid #15fdb7;
		box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
		position: relative;
	}

	.scanner-square::before,
	.scanner-square::after {
		content: '';
		position: absolute;
		width: 20px;
		height: 20px;
		border-color: #15fdb7;
		border-style: solid;
	}

	.scanner-square::before {
		top: -2px;
		left: -2px;
		border-width: 2px 0 0 2px;
	}

	.scanner-square::after {
		bottom: -2px;
		right: -2px;
		border-width: 0 2px 2px 0;
	}

	@media (max-width: 480px) {
		.scanner-container {
			width: 100%;
			max-width: 100%;
			padding: 0.5rem;
		}

		.scanner-text {
			font-size: 1rem;
			margin-bottom: 0.5rem;
		}

		select {
			padding: 0.5rem;
			font-size: 0.9rem;
		}
	}

	.card {
		margin: 2rem auto;
	}

	h2 {
		font-size: 1.5rem;
		font-weight: 600;
		color: #111827;
		margin-bottom: 1.5rem;
		text-align: center;
	}
</style>
