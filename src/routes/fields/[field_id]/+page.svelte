<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import Breadcrumbs from '$lib/ui/breadcrumbs.svelte';
	import type { PageLoad } from './$types';

	// Define TypeScript interfaces for better type safety
	interface Field {
		_id: string;
		name: string;
		crop_type?: string;
		soil_type?: string;
		size_hectares?: number;
		assigned_devices?: Array<{ _id: string; name: string }>;
		location?: any; // GeoJSON object
	}

	interface Device {
		_id: string;
		device_id: string;
		name?: string;
		model_name?: string;
	}

	let field_id = '';
	let field: Field | null = null;
	let assignedDevices: Device[] = [];
	let geojson: string | null = null;

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

				// Fetch assigned devices
				if (field?.assigned_devices && field.assigned_devices.length > 0) {
					const deviceIds = field.assigned_devices.map((device) => device._id).join(',');
					const resDevices = await fetch(`/api/devices?ids=${deviceIds}`);
					if (resDevices.ok) {
						assignedDevices = await resDevices.json();
					} else {
						const error = await resDevices.json();
						alert('Error fetching assigned devices: ' + error.message);
					}
				}

				// Fetch GeoJSON data if available
				if (field?.location) {
					geojson = JSON.stringify(field.location, null, 2);
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
		{ name: field ? field.name : 'Field Detail', href: `/fields/${field_id}` }
	];

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
						geojson = JSON.stringify(field.location, null, 2);
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

	// Handle field deletion
	async function deleteField() {
		if (confirm('Are you sure you want to delete this field?')) {
			try {
				const res = await fetch(`/api/fields/${field_id}`, {
					method: 'DELETE'
				});
				if (res.ok) {
					alert('Field deleted successfully.');
					goto('/fields');
				} else {
					const error = await res.json();
					alert('Error deleting field: ' + error.message);
				}
			} catch (err) {
				console.error('Delete error:', err);
				alert('An unexpected error occurred while deleting the field.');
			}
		}
	}
</script>

<main>
	<Breadcrumbs {crumbs} />
	{#if field}
		<header class="field-header">
			<h1>Field Details: {field.name}</h1>
			<div class="field-actions">
				<a class="edit-button" href="/fields/{field._id}/edit">Edit Field</a>
				<button class="delete-button" on:click={deleteField}>Delete Field</button>
			</div>
		</header>

		<section class="field-info">
			<div class="field-metadata">
				<p><strong>Crop Type:</strong> {field.crop_type || 'N/A'}</p>
				<p><strong>Soil Type:</strong> {field.soil_type || 'N/A'}</p>
				<p><strong>Size:</strong> {field.size_hectares || 'N/A'} hectares</p>
			</div>
			<div class="geojson-upload">
				<label for="geojson">Upload GeoJSON File:</label>
				<input
					type="file"
					id="geojson"
					accept=".geojson,application/geo+json"
					on:change={uploadGeoJSON}
				/>
				{#if geojson}
					<div class="geojson-preview">
						<h3>GeoJSON Data:</h3>
						<pre>{geojson}</pre>
					</div>
				{/if}
			</div>
		</section>

		<section class="assigned-devices">
			<h2>Assigned Devices</h2>
			{#if assignedDevices.length > 0}
				<ul>
					{#each assignedDevices as device}
						<li>
							<a href="/devices/{device.device_id}">{device.name || device.device_id}</a> - {device.model_name ||
								'Unknown Model'}
						</li>
					{/each}
				</ul>
			{:else}
				<p>No devices assigned to this field.</p>
			{/if}
		</section>
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
		max-width: 900px;
		margin: 50px auto;
		padding: 0 20px;
		font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
		color: #333;
	}

	/* Header styling */
	.field-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 30px;
	}

	h1 {
		font-size: 2rem;
		font-weight: 600;
		color: #2c3e50;
	}

	/* Edit and Delete buttons */
	.edit-button,
	.delete-button {
		background-color: #e67e22;
		color: #fff;
		padding: 10px 18px;
		text-decoration: none;
		border: none;
		border-radius: 5px;
		font-size: 0.95rem;
		cursor: pointer;
		transition: background-color 0.3s ease;
		margin-left: 10px;
	}

	.edit-button:hover {
		background-color: #d35400;
	}

	.delete-button {
		background-color: #e74c3c;
	}

	.delete-button:hover {
		background-color: #c0392b;
	}

	/* Field info section */
	.field-info {
		display: flex;
		flex-direction: column;
		gap: 20px;
		margin-bottom: 30px;
	}

	.field-metadata p {
		margin-bottom: 10px;
		font-size: 1rem;
		line-height: 1.5;
	}

	.field-metadata strong {
		color: #34495e;
	}

	/* GeoJSON upload section */
	.geojson-upload label {
		display: block;
		margin-bottom: 8px;
		font-weight: 500;
		color: #34495e;
	}

	.geojson-upload input[type='file'] {
		padding: 10px 15px;
		border: 1px solid #ccc;
		border-radius: 5px;
		font-size: 1rem;
		transition: border-color 0.3s ease;
	}

	.geojson-upload input[type='file']:focus {
		border-color: #3498db;
		outline: none;
	}

	.geojson-preview {
		margin-top: 15px;
		background-color: #f9f9f9;
		padding: 15px;
		border-radius: 5px;
		border-left: 4px solid #3498db;
	}

	.geojson-preview pre {
		white-space: pre-wrap;
		word-wrap: break-word;
		font-family: 'Courier New', Courier, monospace;
		font-size: 0.95rem;
	}

	/* Assigned devices section */
	.assigned-devices {
		margin-top: 30px;
	}

	.assigned-devices h2 {
		font-size: 1.5rem;
		color: #2c3e50;
		margin-bottom: 15px;
	}

	.assigned-devices ul {
		list-style: disc inside;
	}

	.assigned-devices li {
		margin-bottom: 8px;
		font-size: 1rem;
	}

	.assigned-devices a {
		color: #3498db;
		text-decoration: none;
		font-weight: 500;
	}

	.assigned-devices a:hover {
		text-decoration: underline;
	}

	/* Loading state */
	.loading {
		text-align: center;
		font-size: 1.2rem;
		color: #7f8c8d;
		margin-top: 50px;
	}

	/* Responsive design */
	@media (max-width: 768px) {
		.field-info {
			flex-direction: column;
			align-items: center;
		}

		.geojson-preview pre {
			font-size: 0.9rem;
		}
	}
</style>
