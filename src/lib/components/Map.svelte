<!-- src/components/MapComponent.svelte -->
<script lang="ts">
	import mapboxgl from 'mapbox-gl';
	import 'mapbox-gl/dist/mapbox-gl.css';
	import { onMount, onDestroy } from 'svelte';
	import { selectedSensorStore } from '$lib/stores/selectedSensorStore';

	let mapContainer: HTMLElement;
	let map: mapboxgl.Map;
	let devices: any[] = [];
	let fieldsGeoJSON: any = null;

	const MAPBOX_ACCESS_TOKEN =
		'pk.eyJ1IjoiYmlsZWxtYWRpIiwiYSI6ImNsbmJnM2ZrNTA1cXQybG56N2c0cjJ2bTcifQ.j-O_Igwc-2p3Na-mkusaDg';

	const initialCoordinates: [number, number] = [35.5795, 32.2838];
	const initialZoom: number = 10;

	// Fetch devices from the API
	async function fetchDevices() {
		try {
			const response = await fetch('/api/devices');
			if (response.ok) {
				const data = await response.json();
				devices = data.filter((device: any) => device.location && device.location.coordinates);
			} else {
				console.error('Failed to fetch devices:', await response.text());
			}
		} catch (error) {
			console.error('Error fetching devices:', error);
		}
	}

	// Fetch fields GeoJSON from the API
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

	// Initialize the Mapbox map
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
			addFieldsLayer();
			addDeviceMarkers();
			addGlobalClickHandler();
		});
	}

	// Create a pulsating dot for devices
	function createPulsatingDot(color: string) {
		const size = 100;

		return {
			width: size,
			height: size,
			data: new Uint8Array(size * size * 4),

			onAdd: function () {
				const canvas = document.createElement('canvas');
				canvas.width = this.width;
				canvas.height = this.height;
				this.context = canvas.getContext('2d');
			},

			render: function () {
				const duration = 2000; // 2 seconds for the pulse
				const t = (performance.now() % duration) / duration;

				const radius = (size / 2) * 0.3;
				const outerRadius = (size / 2) * 0.7 * t + radius;
				const context = this.context;

				// Draw outer circle
				context.clearRect(0, 0, this.width, this.height);
				context.beginPath();
				context.arc(this.width / 2, this.height / 2, outerRadius, 0, Math.PI * 2);
				context.fillStyle = `rgba(${color}, ${1 - t})`;
				context.fill();

				// Draw inner circle
				context.beginPath();
				context.arc(this.width / 2, this.height / 2, radius, 0, Math.PI * 2);
				context.fillStyle = `rgba(${color}, 1)`;
				context.strokeStyle = 'white';
				context.lineWidth = 2 + 2 * (1 - t);
				context.fill();
				context.stroke();

				// Update the image's data with data from the canvas
				this.data = context.getImageData(0, 0, this.width, this.height).data;

				// Continuously repaint the map to animate the dot
				map.triggerRepaint();

				return true;
			}
		};
	}

	// Add fields as a layer on the map
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
	}

	// Add device markers to the map using pulsating dots
	function addDeviceMarkers() {
		if (!devices || devices.length === 0) return;

		// Remove existing device layer and source if they exist
		if (map.getLayer('devices')) {
			map.removeLayer('devices');
		}
		if (map.getSource('devices')) {
			map.removeSource('devices');
		}

		// Create pulsating dot images
		// Blue for soil moisture sensors, Green for CO2 sensors
		map.addImage('pulsing-dot-blue', createPulsatingDot('33, 150, 243'), { pixelRatio: 2 });
		map.addImage('pulsing-dot-green', createPulsatingDot('76, 175, 80'), { pixelRatio: 2 });

		// Create a GeoJSON FeatureCollection from devices
		const deviceFeatures = devices.map((device) => ({
			type: 'Feature',
			properties: {
				device_id: device.device_id,
				name: device.name,
				device_type: device.device_type
				// Include other properties as needed
			},
			geometry: {
				type: 'Point',
				coordinates: device.location.coordinates
			}
		}));

		const deviceGeoJSON = {
			type: 'FeatureCollection',
			features: deviceFeatures
		};

		// Add the device source to the map
		map.addSource('devices', {
			type: 'geojson',
			data: deviceGeoJSON
		});

		// Add a layer to display the devices with pulsating dots
		map.addLayer({
			id: 'devices',
			type: 'symbol',
			source: 'devices',
			layout: {
				'icon-image': [
					'match',
					['get', 'device_type'],
					'soil_moisture',
					'pulsing-dot-blue',
					'co2_sensor',
					'pulsing-dot-green',
					/* other */ 'pulsing-dot-blue'
				],
				'icon-allow-overlap': true
			}
		});
	}

	// Add a single global click handler to manage both devices and fields
	function addGlobalClickHandler() {
		map.on('click', (e) => {
			const features = map.queryRenderedFeatures(e.point, { layers: ['devices', 'fields-fill'] });
			if (!features.length) return;

			// Prioritize devices
			const deviceFeature = features.find((f) => f.layer.id === 'devices');
			if (deviceFeature) {
				handleDeviceClick(deviceFeature, e.lngLat);
				return;
			}

			// If no device was clicked, handle field click
			const fieldFeature = features.find((f) => f.layer.id === 'fields-fill');
			if (fieldFeature) {
				handleFieldClick(fieldFeature, e.lngLat);
			}
		});
	}

	// Handle device click
	function handleDeviceClick(feature: any, lngLat: mapboxgl.LngLatLike) {
		const deviceProperties = feature.properties;

		// Update the selected sensor store
		selectedSensorStore.set(deviceProperties);

		// Create a popup
		const popupContent = `
			<strong>${deviceProperties.name || 'Device'}</strong><br/>
			Device ID: ${deviceProperties.device_id}<br/>
			Device Type: ${deviceProperties.device_type || 'N/A'}<br/>
		`;

		new mapboxgl.Popup({ offset: 25 }).setLngLat(lngLat).setHTML(popupContent).addTo(map);
	}

	// Handle field click
	function handleFieldClick(feature: any, lngLat: mapboxgl.LngLatLike) {
		const fieldProperties = feature.properties;
		const fieldName = fieldProperties.name;
		const cropType = fieldProperties.crop_type;
		const sizeHectares = fieldProperties.size_hectares;

		const content = `
			<strong>${fieldName}</strong><br/>
			Crop Type: ${cropType || 'N/A'}<br/>
			Size: ${sizeHectares || 'N/A'} hectares
		`;
		new mapboxgl.Popup().setLngLat(lngLat).setHTML(content).addTo(map);
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
		height: 100%;
		border-radius: 15px;
	}
</style>
