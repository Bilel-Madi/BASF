<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Breadcrumbs from '$lib/ui/breadcrumbs.svelte';

	// Define TypeScript interfaces for better type safety
	interface Field {
		_id: string;
		name: string;
		crop_type?: string;
		soil_type?: string;
		size_hectares?: number;
		assigned_devices?: string[];
		location?: any; // GeoJSON object
	}

	let field_id = '';
	let field: Field = {
		_id: '',
		name: '',
		crop_type: '',
		soil_type: '',
		size_hectares: 0,
		assigned_devices: [],
		location: null
	};

	let allDevices: Array<{ _id: string; name: string }> = [];

	// Get the field ID from the URL
	$: field_id = $page.params.field_id;

	onMount(async () => {
		if (field_id) {
			try {
				// Fetch field details
				const resField = await fetch(`/api/fields/${field_id}`);
				if (resField.ok) {
					field = await resField.json();
				} else {
					const error = await resField.json();
					alert('Error fetching field: ' + error.message);
				}

				// Fetch all devices to allow re-assignment
				const resDevices = await fetch('/api/devices');
				if (resDevices.ok) {
					allDevices = await resDevices.json();
				} else {
					const error = await resDevices.json();
					alert('Error fetching devices: ' + error.message);
				}
			} catch (err) {
				console.error('Fetch error:', err);
				alert('An unexpected error occurred while fetching field details.');
			}
		}
	});

	const crumbs = [
		{ name: 'Home', href: '/' },
		{ name: 'Fields', href: '/fields' },
		{ name: field.name || 'Field', href: `/fields/${field_id}` },
		{ name: 'Edit', href: '' }
	];

	// Handle form submission
	async function handleSubmit(event: Event) {
		event.preventDefault();

		// Validate required fields
		if (!field.name) {
			alert('Field name is required.');
			return;
		}

		try {
			// Update field
			const res = await fetch(`/api/fields/${field_id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(field)
			});

			if (res.ok) {
				alert('Field updated successfully.');
				goto(`/fields/${field_id}`);
			} else {
				const error = await res.json();
				alert('Error updating field: ' + error.message);
			}
		} catch (err) {
			console.error('Submit error:', err);
			alert('An unexpected error occurred while updating the field.');
		}
	}

	// Handle GeoJSON file upload
	async function uploadGeoJSON(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files ? target.files[0] : null;
		if (file) {
			const formData = new FormData();
			formData.append('geojson', file);

			try {
				const res = await fetch(`/api/fields/${field_id}/upload`, {
					method: 'POST',
					body: formData
				});

				if (res.ok) {
					const data = await res.json();
					alert(data.message);
					// Refresh field details
					const resField = await fetch(`/api/fields/${field_id}`);
					if (resField.ok) {
						field = await resField.json();
					}
				} else {
					const error = await res.json();
					alert('Error uploading GeoJSON: ' + error.message);
				}
			} catch (err) {
				console.error('Upload error:', err);
				alert('An unexpected error occurred while uploading GeoJSON.');
			}
		}
	}
</script>

<main>
	<Breadcrumbs {crumbs} />
	{#if field}
		<header class="form-header">
			<h1>Edit Field: {field.name}</h1>
		</header>

		<form class="field-form" on:submit={handleSubmit}>
			<div class="form-group">
				<label for="name">Field Name:</label>
				<input
					type="text"
					id="name"
					bind:value={field.name}
					required
					placeholder="Enter Field Name"
				/>
			</div>

			<div class="form-group">
				<label for="crop_type">Crop Type:</label>
				<input
					type="text"
					id="crop_type"
					bind:value={field.crop_type}
					placeholder="Enter Crop Type"
				/>
			</div>

			<div class="form-group">
				<label for="soil_type">Soil Type:</label>
				<input
					type="text"
					id="soil_type"
					bind:value={field.soil_type}
					placeholder="Enter Soil Type"
				/>
			</div>

			<div class="form-group">
				<label for="size_hectares">Size (hectares):</label>
				<input
					type="number"
					id="size_hectares"
					bind:value={field.size_hectares}
					placeholder="Enter Size in Hectares"
					min="0"
					step="0.01"
				/>
			</div>

			<div class="form-group">
				<label for="assigned_devices">Assign Devices:</label>
				<select id="assigned_devices" multiple bind:value={field.assigned_devices}>
					{#each allDevices as device}
						<option value={device._id}>{device.name || device.device_id}</option>
					{/each}
				</select>
			</div>

			<div class="form-group geojson-group">
				<label for="geojson">Upload GeoJSON File:</label>
				<input
					type="file"
					id="geojson"
					accept=".geojson,application/geo+json"
					on:change={uploadGeoJSON}
				/>
			</div>

			<button type="submit" class="submit-button">Save Changes</button>
		</form>
	{:else}
		<p class="loading">Loading field details...</p>
	{/if}
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
	.field-form {
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
	.form-group select,
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
	.form-group select:focus,
	.form-group input[type='file']:focus {
		border-color: #3498db;
		outline: none;
	}

	/* Select styling */
	select[multiple] {
		height: 150px;
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

	/* GeoJSON upload */
	.geojson-group {
		margin-bottom: 20px;
	}

	/* Loading state */
	.loading {
		text-align: center;
		font-size: 1.2rem;
		color: #7f8c8d;
		margin-top: 50px;
	}

	/* Responsive design */
	@media (max-width: 600px) {
		.field-form {
			padding: 20px;
		}
	}
</style>
