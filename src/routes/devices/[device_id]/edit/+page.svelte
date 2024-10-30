<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Breadcrumbs from '$lib/ui/breadcrumbs.svelte';

	// Define TypeScript interfaces for better type safety
	interface DeviceLocation {
		coordinates: [string, string];
	}

	interface Device {
		device_id: string;
		model_name: string;
		assigned_number: number;
		name?: string;
		installed_date?: string;
		installed_depth?: number;
		field?: string;
		location?: DeviceLocation;
		picture_url?: string;
	}

	let device_id = '';
	let device: Device = {
		device_id: '',
		model_name: '',
		assigned_number: 0,
		name: '',
		installed_date: '',
		installed_depth: 0,
		field: '',
		location: {
			coordinates: ['', '']
		}
	};

	// Reactive statement to get device_id from URL parameters
	$: device_id = $page.params.device_id;

	// Initialize device object if device_id is 'new'
	if (device_id === 'new') {
		device = {
			device_id: '',
			model_name: '',
			assigned_number: 0,
			name: '',
			installed_date: '',
			installed_depth: 0,
			field: '',
			location: {
				coordinates: ['', '']
			}
		};
	} else {
		// Fetch existing device data on mount
		onMount(async () => {
			if (device_id) {
				try {
					const res = await fetch(`/api/devices/${device_id}`);
					if (res.ok) {
						const fetchedDevice = await res.json();
						device = fetchedDevice;
						if (!device.location) {
							device.location = { coordinates: ['', ''] };
						}
						// Format the date for the input field
						if (device.installed_date) {
							device.installed_date = device.installed_date.slice(0, 10);
						}
					} else {
						const error = await res.json();
						alert('Error fetching device: ' + error.message);
					}
				} catch (err) {
					console.error('Fetch error:', err);
					alert('An unexpected error occurred while fetching device details.');
				}
			}
		});
	}

	// Handle form submission
	async function handleSubmit(event: Event) {
		event.preventDefault();

		if (device_id === 'new') {
			if (!device.device_id) {
				alert('Device ID is required');
				return;
			}
			device_id = device.device_id;
		}

		try {
			// Send the updated device data to the server
			const res = await fetch(`/api/devices/${device_id}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(device)
			});

			if (res.ok) {
				alert('Device metadata updated successfully');
				goto(`/devices/${device_id}`);
			} else {
				const error = await res.json();
				alert('Error updating device: ' + error.message);
			}
		} catch (err) {
			console.error('Submit error:', err);
			alert('An unexpected error occurred while updating the device.');
		}
	}

	// Handle image upload
	async function handleImageUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files ? target.files[0] : null;
		if (file) {
			const formData = new FormData();
			formData.append('picture', file);

			try {
				const res = await fetch(`/api/devices/${device_id}/upload`, {
					method: 'POST',
					body: formData
				});

				if (res.ok) {
					const data = await res.json();
					device.picture_url = data.picture_url;
				} else {
					const error = await res.json();
					alert('Error uploading image: ' + error.message);
				}
			} catch (err) {
				console.error('Image upload error:', err);
				alert('An unexpected error occurred while uploading the image.');
			}
		}
	}

	// Define breadcrumbs for this page
	const crumbs =
		device_id === 'new'
			? [
					{ name: 'Home', href: '/' },
					{ name: 'Devices', href: '/devices' },
					{ name: 'Add New Device', href: '/devices/new/edit' }
			  ]
			: [
					{ name: 'Home', href: '/' },
					{ name: 'Devices', href: '/devices' },
					{
						name: device ? device.name || device.device_id : 'Device',
						href: `/devices/${device_id}`
					},
					{ name: 'Edit', href: '' }
			  ];
</script>

<main>
	<Breadcrumbs {crumbs} />
	<header class="form-header">
		<h1>Edit Device: {device_id}</h1>
	</header>

	<form class="device-form" on:submit={handleSubmit}>
		{#if device_id === 'new'}
			<div class="form-group">
				<label for="device_id">Device ID (dev_eui):</label>
				<input
					type="text"
					id="device_id"
					bind:value={device.device_id}
					required
					placeholder="Enter Device ID"
				/>
			</div>
		{/if}

		<div class="form-group">
			<label for="model_name">Model Name:</label>
			<input
				type="text"
				id="model_name"
				bind:value={device.model_name}
				required
				placeholder="Enter Model Name"
			/>
		</div>

		<div class="form-group">
			<label for="assigned_number">Assigned Number:</label>
			<input
				type="number"
				id="assigned_number"
				bind:value={device.assigned_number}
				required
				placeholder="Enter Assigned Number"
			/>
		</div>

		<div class="form-group">
			<label for="name">Name:</label>
			<input type="text" id="name" bind:value={device.name} placeholder="Enter Device Name" />
		</div>

		<div class="form-group">
			<label for="installed_date">Installed Date:</label>
			<input type="date" id="installed_date" bind:value={device.installed_date} />
		</div>

		<div class="form-group">
			<label for="installed_depth">Installed Depth (cm):</label>
			<input
				type="number"
				id="installed_depth"
				bind:value={device.installed_depth}
				placeholder="Enter Installed Depth"
			/>
		</div>

		<div class="form-group">
			<label for="field">Field/Zone/Greenhouse:</label>
			<input
				type="text"
				id="field"
				bind:value={device.field}
				placeholder="Enter Field/Zone/Greenhouse"
			/>
		</div>

		<div class="form-group location-group">
			<label>Location:</label>
			<div class="location-inputs">
				<input
					type="number"
					step="any"
					placeholder="Longitude"
					bind:value={device.location.coordinates[0]}
				/>
				<input
					type="number"
					step="any"
					placeholder="Latitude"
					bind:value={device.location.coordinates[1]}
				/>
			</div>
		</div>

		<div class="form-group">
			<label for="picture">Device Picture:</label>
			<input type="file" id="picture" accept="image/*" on:change={handleImageUpload} />
			{#if device.picture_url}
				<div class="image-preview">
					<img src={device.picture_url} alt="Device Picture" />
				</div>
			{/if}
		</div>

		<button type="submit" class="submit-button">Save</button>
	</form>
</main>

<style>
	/* Reset some default styles for consistency across browsers */
	* {
		box-sizing: border-box;
		margin: 0;
		padding: 0;
	}

	/* Base styles for the main container */
	main {
		max-width: 800px;
		margin: 50px auto;
		padding: 0 20px;
		font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
		color: #333;
	}

	/* Header styling */
	.form-header {
		margin-bottom: 30px;
		text-align: center;
	}

	h1 {
		font-size: 2rem;
		font-weight: 600;
		color: #2c3e50;
	}

	/* Form styling */
	.device-form {
		background-color: #f9f9f9;
		padding: 30px;
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
	}

	.form-group {
		margin-bottom: 20px;
	}

	.form-group label {
		display: block;
		margin-bottom: 8px;
		font-weight: 500;
		color: #34495e;
	}

	.form-group input[type='text'],
	.form-group input[type='number'],
	.form-group input[type='date'],
	.form-group input[type='file'] {
		width: 100%;
		padding: 10px 15px;
		border: 1px solid #ccc;
		border-radius: 5px;
		font-size: 1rem;
		transition: border-color 0.3s ease;
	}

	.form-group input[type='text']:focus,
	.form-group input[type='number']:focus,
	.form-group input[type='date']:focus,
	.form-group input[type='file']:focus {
		border-color: #3498db;
		outline: none;
	}

	/* Location inputs */
	.location-group label {
		margin-bottom: 8px;
	}

	.location-inputs {
		display: flex;
		gap: 15px;
	}

	.location-inputs input {
		flex: 1;
	}

	/* Image preview */
	.image-preview {
		margin-top: 15px;
	}

	.image-preview img {
		max-width: 200px;
		border-radius: 5px;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
	}

	/* Submit button styling */
	.submit-button {
		display: inline-block;
		width: 100%;
		padding: 12px 0;
		background-color: #2ecc71;
		color: #fff;
		border: none;
		border-radius: 5px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: background-color 0.3s ease;
	}

	.submit-button:hover {
		background-color: #27ae60;
	}

	/* Responsive design */
	@media (max-width: 600px) {
		.location-inputs {
			flex-direction: column;
		}

		.image-preview img {
			max-width: 100%;
		}
	}
</style>
