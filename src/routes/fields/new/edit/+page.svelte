<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Breadcrumbs from '$lib/ui/breadcrumbs.svelte';
	import mapboxgl from 'mapbox-gl';
	import MapboxDraw from '@mapbox/mapbox-gl-draw';
	import 'mapbox-gl/dist/mapbox-gl.css';
	import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
	import * as turf from '@turf/turf';

	// Define TypeScript interfaces for better type safety
	interface Field {
		name: string;
		crop_type?: string;
		soil_type?: string;
		size_hectares?: number;
		assigned_devices?: string[];
		location?: any; // GeoJSON object
	}

	let field: Field = {
		name: '',
		crop_type: '',
		soil_type: '',
		size_hectares: 0,
		assigned_devices: [],
		location: null
	};

	let selectedDevices: Array<{ _id: string; name: string }> = [];
	let allDevices: Array<{ _id: string; name: string }> = [];

	let mapContainer: HTMLElement;
	let map: mapboxgl.Map;
	let draw: MapboxDraw;
	let fieldGeometry: any = null;

	// Mapbox access token
	const MAPBOX_ACCESS_TOKEN =
		'pk.eyJ1IjoiYmlsZWxtYWRpIiwiYSI6ImNsbmJnM2ZrNTA1cXQybG56N2c0cjJ2bTcifQ.j-O_Igwc-2p3Na-mkusaDg';

	// Initialize Mapbox map
	function initializeMap() {
		mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

		map = new mapboxgl.Map({
			container: mapContainer,
			style: 'mapbox://styles/mapbox/satellite-v9',
			center: [35.5795, 32.2838], // Set your initial map center
			zoom: 12
		});

		// Wait for map to load before adding controls
		map.on('load', () => {
			map.addControl(new mapboxgl.NavigationControl());

			// Initialize Mapbox Draw
			draw = new MapboxDraw({
				displayControlsDefault: false,
				controls: {
					polygon: true,
					trash: true
				}
			});

			map.addControl(draw);

			// Handle the creation and update of features
			map.on('draw.create', updateGeometry);
			map.on('draw.update', updateGeometry);
			map.on('draw.delete', () => {
				fieldGeometry = null;
			});
		});
	}

	function updateGeometry() {
		const data = draw.getAll();
		if (data.features.length > 0) {
			fieldGeometry = data.features[0];

			// Calculate area in square meters
			const area = turf.area(fieldGeometry);
			// Convert to hectares (1 hectare = 10000 square meters)
			field.size_hectares = Number((area / 10000).toFixed(2));
		} else {
			fieldGeometry = null;
			field.size_hectares = 0;
		}
	}

	onMount(async () => {
		initializeMap();
		try {
			// Fetch all devices to assign to the field
			const resDevices = await fetch('/api/devices');
			if (resDevices.ok) {
				allDevices = await resDevices.json();
			} else {
				const error = await resDevices.json();
				alert('Error fetching devices: ' + error.message);
			}
		} catch (err) {
			console.error('Fetch devices error:', err);
			alert('An unexpected error occurred while fetching devices.');
		}
	});

	const crumbs = [
		{ name: 'Home', href: '/' },
		{ name: 'Fields', href: '/fields' },
		{ name: 'Add New Field', href: '/fields/new/edit' }
	];

	// Handle form submission
	async function handleSubmit(event: Event) {
		event.preventDefault();

		// Validate required fields
		if (!field.name) {
			alert('Field name is required.');
			return;
		}

		if (!fieldGeometry) {
			alert('Please draw the field geometry on the map.');
			return;
		}

		// Include the geometry in the field data
		field.location = fieldGeometry.geometry;

		try {
			// Create new field
			const res = await fetch('/api/fields', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(field)
			});

			if (res.ok) {
				const newField = await res.json();
				alert('Field created successfully.');
				goto(`/fields/${newField._id}`);
			} else {
				const error = await res.json();
				alert('Error creating field: ' + error.message);
			}
		} catch (err) {
			console.error('Submit error:', err);
			alert('An unexpected error occurred while creating the field.');
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
				// First, create the field to get its ID
				const resCreate = await fetch('/api/fields', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(field)
				});

				if (resCreate.ok) {
					const newField = await resCreate.json();
					field = newField;

					// Upload GeoJSON
					const resUpload = await fetch(`/api/fields/${newField._id}/upload`, {
						method: 'POST',
						body: formData
					});

					if (resUpload.ok) {
						const data = await resUpload.json();
						alert(data.message);
						goto(`/fields/${newField._id}`);
					} else {
						const error = await resUpload.json();
						alert('Error uploading GeoJSON: ' + error.message);
					}
				} else {
					const error = await resCreate.json();
					alert('Error creating field: ' + error.message);
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
	<header class="form-header">
		<h1>Add New Field</h1>
	</header>

	<!-- Map container -->
	<div class="map-container" bind:this={mapContainer} />

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
				placeholder="Draw field to calculate size"
				readonly
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

		<button type="submit" class="submit-button">Create Field</button>
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

	.map-container {
		position: relative;
		width: 100%;
		height: 400px; /* Adjust as needed */
		margin-bottom: 20px;
		border-radius: 10px;
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

	/* Responsive design */
	@media (max-width: 600px) {
		.field-form {
			padding: 20px;
		}
	}
</style>
