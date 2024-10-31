<!-- src/components/MapComponent.svelte -->
<script lang="ts">
	import mapboxgl from 'mapbox-gl';
	import 'mapbox-gl/dist/mapbox-gl.css';
	import { onMount, onDestroy } from 'svelte';

	let mapContainer;
	let map;
	let devices = [];
	let fieldsGeoJSON = null;
	let markers = [];
	let mapLoaded = false;

	const MAPBOX_ACCESS_TOKEN =
		'pk.eyJ1IjoiYmlsZWxtYWRpIiwiYSI6ImNsbmJnM2ZrNTA1cXQybG56N2c0cjJ2bTcifQ.j-O_Igwc-2p3Na-mkusaDg';

	const initialCoordinates = [35.5795, 32.2838];
	const initialZoom = 15;

	async function fetchDevices() {
		try {
			const response = await fetch('/api/devices');
			if (response.ok) {
				const data = await response.json();
				devices = data.filter((device) => device.location && device.location.coordinates);
			} else {
				console.error('Failed to fetch devices:', await response.text());
			}
		} catch (error) {
			console.error('Error fetching devices:', error);
		}
	}

	async function fetchFields() {
		try {
			const response = await fetch('/api/fields/geojson');
			if (response.ok) {
				fieldsGeoJSON = await response.json();
			} else {
				console.error('Failed to fetch fields:', await response.text());
			}
		} catch (error) {
			console.error('Error fetching fields:', error);
		}
	}

	function initializeMap() {
		mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

		map = new mapboxgl.Map({
			container: mapContainer,
			style: 'mapbox://styles/mapbox/satellite-v9',
			center: initialCoordinates,
			zoom: initialZoom
		});

		map.addControl(new mapboxgl.NavigationControl());

		map.on('load', () => {
			mapLoaded = true;
			addFieldsLayer();
			addDeviceMarkers();
		});
	}

	function addFieldsLayer() {
		if (!fieldsGeoJSON) return;

		map.addSource('fields', {
			type: 'geojson',
			data: fieldsGeoJSON
		});

		map.addLayer({
			id: 'fields-fill',
			type: 'fill',
			source: 'fields',
			paint: {
				'fill-color': [
					'match',
					['get', 'crop_type'],
					'Cucumber',
					'#4CAF50',
					'Tomato',
					'#FF5722',
					'Lettuce',
					'#8BC34A',
					/* other */ '#CCCCCC'
				],
				'fill-opacity': 0.5
			}
		});

		map.addLayer({
			id: 'fields-outline',
			type: 'line',
			source: 'fields',
			paint: {
				'line-color': '#000000',
				'line-width': 2
			}
		});

		map.on('click', 'fields-fill', (e) => {
			if (e.features.length > 0) {
				const field = e.features[0];
				const fieldName = field.properties.name;
				const cropType = field.properties.crop_type;
				const sizeHectares = field.properties.size_hectares;
				const content = `
			<strong>${fieldName}</strong><br/>
			Crop Type: ${cropType || 'N/A'}<br/>
			Size: ${sizeHectares || 'N/A'} hectares
		  `;
				new mapboxgl.Popup().setLngLat(e.lngLat).setHTML(content).addTo(map);
			}
		});

		map.on('mouseenter', 'fields-fill', () => {
			map.getCanvas().style.cursor = 'pointer';
		});

		map.on('mouseleave', 'fields-fill', () => {
			map.getCanvas().style.cursor = '';
		});
	}

	function addDeviceMarkers() {
		if (!devices || devices.length === 0) return;

		markers.forEach((marker) => marker.remove());
		markers = [];

		devices.forEach((device) => {
			const [longitude, latitude] = device.location.coordinates;
			const popupContent = `
		  <strong>${device.name || 'Device'}</strong><br/>
		  Device ID: ${device.device_id}<br/>
		  Device Type: ${device.device_type || 'N/A'}<br/>
		  Reporting Interval: ${device.reporting_interval || 'N/A'} mins<br/>
		`;

			const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(popupContent);

			const marker = new mapboxgl.Marker({ color: getDeviceColor(device) })
				.setLngLat([longitude, latitude])
				.setPopup(popup)
				.addTo(map);

			markers.push(marker);
		});

		// Adjust the map view to include all markers
		const bounds = new mapboxgl.LngLatBounds();
		devices.forEach((device) => {
			bounds.extend(device.location.coordinates);
		});
		map.fitBounds(bounds, { padding: 50 });
	}

	function getDeviceColor(device) {
		switch (device.device_type) {
			case 'soil_moisture':
				return '#2196F3'; // Blue
			case 'co2_sensor':
				return '#9C27B0'; // Purple
			default:
				return '#FF9800'; // Orange
		}
	}

	onMount(async () => {
		await fetchDevices();
		await fetchFields();
		initializeMap();
	});

	onDestroy(() => {
		if (map) map.remove();
	});
</script>

<div class="map-container" bind:this={mapContainer} />

<style>
	.map-container {
		position: relative;
		width: 100%;
		height: 600px;
	}

	/* Optional: Custom styles for device markers */
	.device-marker {
		background-image: url('/path/to/custom-icon.png');
		background-size: cover;
		width: 30px;
		height: 30px;
		border-radius: 50%;
	}
</style>
