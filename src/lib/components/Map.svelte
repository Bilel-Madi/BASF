<script lang="ts">
	// Importing necessary components and styles from Mapbox GL JS and other modules
	import mapboxgl from 'mapbox-gl';
	const { Map, Marker, Popup, NavigationControl } = mapboxgl;
	import 'mapbox-gl/dist/mapbox-gl.css';
	import { onMount, onDestroy } from 'svelte';
	import { latestDataStore, type LatestDataEntry } from '$lib/stores/latestDataStore';
	import { fetchLatestData } from '$lib/utils/latestDataFetch';
	import { statusStore } from '$lib/stores/status-updater';
	import selectedDeviceId from '$lib/stores/deviceIdStore';
	import { selectedFieldName } from '$lib/stores/selectedFieldStore';
	import * as turf from '@turf/turf';
	import {
		DEVICES,
		deviceImageMapping,
		deviceHardcodedNames,
		deviceCoordinates,
		deviceDepths
	} from '$lib/devices';

	// Initializing variables
	let map;
	let mapContainer;
	let markers = {};
	let deviceData = {};
	let latestEntries: LatestDataEntry[] = [];
	let fieldsVisible = true;
	let pulsingDotsVisible = true;
	let currentPopup = null; // To keep track of the currently open popup
	let isExploring = false;
	let explorationTimeout;
	let customGeolocateButton;

	// Reactive assignment to subscribe to the latest data store
	$: latestEntries = $latestDataStore;

	// Function to initialize the map and fetch data on component mount
	onMount(() => {
		if (!map) {
			initializeMap();
			fetchLatestData();

			// Create and append the custom geolocate button
			customGeolocateButton = document.createElement('button');
			customGeolocateButton.className = 'custom-geolocate-button';
			customGeolocateButton.textContent = '⌾';
			customGeolocateButton.title = 'Reset View';
			customGeolocateButton.onclick = () => {
				map.flyTo({
					center: deviceData[DEVICES.INITIAL]?.coordinates || [35.5795, 32.2838],
					zoom: 16.3,
					bearing: 0,
					pitch: 0
				});
			};
			document.body.appendChild(customGeolocateButton);
		}
	});

	onDestroy(() => {
		if (map) {
			map.remove();
			map = null;
		}
		if (customGeolocateButton) {
			customGeolocateButton.remove();
			customGeolocateButton = null;
		}
	});

	let originalView = {
		center: deviceData[DEVICES.INITIAL]?.coordinates || [35.5795, 32.2838],
		zoom: 16.3,
		bearing: 0,
		pitch: 0
	};
	function exploreFields() {
		if (isExploring) {
			isExploring = false; // Stop exploration
			if (explorationTimeout) {
				clearTimeout(explorationTimeout);
			}
			map.flyTo({
				center: originalView.center,
				zoom: originalView.zoom,
				bearing: originalView.bearing,
				pitch: originalView.pitch,
				duration: 1000
			});
			return;
		}

		isExploring = true; // Start exploration
		const deviceIds = Object.keys(deviceCoordinates).filter(
			(deviceId) => deviceId !== DEVICES.GATEWAY
		);
		let index = 0;
		let initialDeviceCoordinates;

		function flyToDevice() {
			if (!isExploring) {
				// Stop if exploration is canceled
				map.flyTo({
					center: originalView.center,
					zoom: originalView.zoom,
					bearing: originalView.bearing,
					pitch: originalView.pitch,
					duration: 1000
				});
				return;
			}

			if (index < deviceIds.length) {
				const deviceId = deviceIds[index];
				const coordinates = deviceCoordinates[deviceId];

				// Store the initial device coordinates
				if (index === 0) {
					initialDeviceCoordinates = { coordinates, deviceId };
				}

				// Close the current popup before moving to the next sensor
				if (currentPopup) {
					currentPopup.remove();
					currentPopup = null;
				}

				map.flyTo({
					center: coordinates,
					zoom: 17.7,
					bearing: -4,
					pitch: 20,
					duration: 1000
				});

				map.once('moveend', () => {
					if (!isExploring) return; // Check again if exploring was stopped
					const sensorMarker = markers[deviceId];
					if (sensorMarker) {
						const clickEvent = new Event('click');
						sensorMarker.getElement().dispatchEvent(clickEvent);
					}
					index++;
					explorationTimeout = setTimeout(flyToDevice, 5000); // Wait before moving to the next device
				});
			} else {
				// Return to the initial device coordinates after exploring all fields
				map.flyTo({
					center: initialDeviceCoordinates.coordinates,
					zoom: 17.7,
					bearing: -4,
					pitch: 20,
					duration: 1000
				});

				map.once('moveend', () => {
					const sensorMarker = markers[initialDeviceCoordinates.deviceId];
					const clickEvent = new Event('click');
					sensorMarker.getElement().dispatchEvent(clickEvent);

					// Finally, return to the original view
					setTimeout(() => {
						map.flyTo({
							center: originalView.center,
							zoom: originalView.zoom,
							bearing: originalView.bearing,
							pitch: originalView.pitch,
							duration: 2000
						});
						isExploring = false;
					}, 5000);
				});
			}
		}

		flyToDevice();
	}

	// Function to initialize the Mapbox map
	function initializeMap() {
		map = new Map({
			container: mapContainer,
			accessToken:
				'pk.eyJ1IjoiYmlsZWxtYWRpIiwiYSI6ImNsbmJnM2ZrNTA1cXQybG56N2c0cjJ2bTcifQ.j-O_Igwc-2p3Na-mkusaDg',
			style: 'mapbox://styles/mapbox/satellite-v9',
			center: deviceData[DEVICES.INITIAL]?.coordinates || [35.580036, 32.284375],
			zoom: 12,
			bearing: 30,
			pitch: 50
		});

		// Event listener for when the map is fully loaded
		map.on('load', () => {
			initializeMapLayers();
			initializeControls();

			// Automatically fly to initial device coordinates after 3 seconds
			setTimeout(() => {
				map.flyTo({
					center: deviceData[DEVICES.INITIAL]?.coordinates || [35.5795, 32.2838],
					zoom: 16.3,
					bearing: 0,
					pitch: 0,
					duration: 3000
				});

				// Trigger a click event on a specific sensor marker
				map.once('moveend', () => {
					const sensorMarker = markers[DEVICES.FIELD_SENSOR2];
					const clickEvent = new Event('click');
					sensorMarker.getElement().dispatchEvent(clickEvent);
				});
			}, 3000);
		});

		// Event listener for clicking elsewhere on the map
		map.on('click', (event) => {
			const layersToQuery = [
				'fields-layer',
				...Object.keys(deviceCoordinates).map((id) => `layer-with-pulsing-dots-${id}`)
			];
			const existingLayers = layersToQuery.filter((layerId) => map.getLayer(layerId));

			const features = map.queryRenderedFeatures(event.point, {
				layers: existingLayers
			});

			if (features.length === 0) {
				if (currentPopup) {
					currentPopup.remove();
					currentPopup = null;
				}
			}
		});

		// Event listener for clicking on the fields layer
		map.on('click', 'fields-layer', function (e) {
			if (e.features.length > 0) {
				const clickedFieldName = e.features[0].properties.Name;
				const area = turf.area(e.features[0]) / 10000;

				console.log('Field clicked:', clickedFieldName, 'Area (hectares):', area);
				selectedFieldName.set({ name: clickedFieldName, area: area });
			}
		});
	}

	// Function to initialize map layers
	function initializeMapLayers() {
		if (!map.getSource('myGeoJSONSource')) {
			fetchGeoJSONData();
		} else {
			addFieldsLayer();
			addFieldsBorderLayer();
			addPulsingDotLayer();
			addMarkers(); // Call this after adding the other layers
		}
	}

	// Function to fetch GeoJSON data
	function fetchGeoJSONData() {
		fetch('Fields.geojson')
			.then((response) => response.json())
			.then((data) => {
				addGeoJSONSource(data);
				addFieldsLayer();
				addFieldsBorderLayer();
				addPulsingDotLayer();
				addMarkers(); // Call this after adding the other layers
			});
	}

	// Function to add GeoJSON source to the map
	function addGeoJSONSource(data) {
		map.addSource('myGeoJSONSource', {
			type: 'geojson',
			data: data
		});
	}

	// Function to add fields layer to the map
	function addFieldsLayer() {
		map.addLayer({
			id: 'fields-layer',
			type: 'fill',
			source: 'myGeoJSONSource',
			paint: {
				'fill-color': [
					'match',
					['get', 'Crop Type'],
					'Clementine',
					'#f28cb1',
					'Pomelo',
					'#d1fa07',
					'French Orange',
					'#e67e22',
					'Tangelo',
					'#2ecc71',
					'Navel Orange',
					'#3498db',
					'Watermelon',
					'#9b59b6',
					'#CCCCCC'
				],
				'fill-opacity': 0.5
			}
		});
	}

	// Function to add fields border layer to the map
	function addFieldsBorderLayer() {
		map.addLayer({
			id: 'fields-border',
			type: 'line',
			source: 'myGeoJSONSource',
			paint: {
				'line-color': '#008a53',
				'line-width': 1
			}
		});
	}

	// Function to add pulsing dot layer to the map
	function addPulsingDotLayer() {
		// Add pulsing dots with the correct colors
		Object.keys(deviceCoordinates).forEach((deviceId) => {
			const layerId = `layer-with-pulsing-dots-${deviceId}`;
			const sourceId = `dot-points-${deviceId}`;
			const imageId = `pulsing-dot-${deviceId}`;

			if (map.getLayer(layerId)) {
				map.removeLayer(layerId);
			}
			if (map.getSource(sourceId)) {
				map.removeSource(sourceId);
			}
			if (map.hasImage(imageId)) {
				map.removeImage(imageId);
			}

			const color = getDotColor(deviceId);
			const pulsingDot = createPulsingDot(color);
			map.addImage(imageId, pulsingDot, { pixelRatio: 2 });

			const geojsonData = {
				type: 'FeatureCollection',
				features: [
					{
						type: 'Feature',
						geometry: {
							type: 'Point',
							coordinates: deviceCoordinates[deviceId]
						}
					}
				]
			};

			map.addSource(sourceId, {
				type: 'geojson',
				data: geojsonData
			});

			map.addLayer({
				id: layerId,
				type: 'symbol',
				source: sourceId,
				layout: {
					'icon-image': imageId
				}
			});
		});
	}

	// Function to add markers to the map
	function addMarkers() {
		Object.keys(deviceCoordinates).forEach((deviceId) => {
			if (markers[deviceId]) {
				updateMarker(deviceId);
			} else {
				createMarker(deviceId);
			}
		});
	}

	// Function to update existing markers
	function updateMarker(deviceId) {
		const popupContent = createPopupContent(deviceId);
		markers[deviceId].getPopup().setHTML(popupContent);
	}

	// Function to create new markers
	function createMarker(deviceId) {
		const coordinates = deviceCoordinates[deviceId];
		if (!coordinates) {
			console.error(`No coordinates found for device ${deviceId}`);
			return;
		}

		const popupContent = createPopupContent(deviceId);

		const popup = new Popup({
			className: 'custom-popup',
			anchor: 'bottom', // Set a fixed anchor
			offset: 10 // Disable offset to prevent automatic repositioning
		}).setHTML(popupContent);

		const el = document.createElement('div');
		el.className = 'marker';
		el.style.width = '20px';
		el.style.height = '20px';
		el.style.backgroundSize = '100%';
		el.style.pointerEvents = 'auto'; // Ensure the marker can be clicked

		const marker = new Marker(el).setLngLat(coordinates).setPopup(popup).addTo(map);
		markers[deviceId] = marker;

		el.addEventListener('click', (event) => {
			event.stopPropagation(); // Prevent click event from reaching the fields layer
			selectDevice(deviceId);

			// Close the currently open popup if any
			if (currentPopup) {
				currentPopup.remove();
			}

			// Open the new popup
			popup.addTo(map);
			currentPopup = popup;
		});
	}

	// Function to create popup content for markers
	function createPopupContent(deviceId) {
		if (deviceId === DEVICES.GATEWAY) {
			return `<strong>Gateway</strong><p>Status: Connected</p>`;
		} else if (deviceId === DEVICES.FIELD_CONTROLLER1) {
			return `<strong>Solenoid Valve Controller</strong>`;
		} else {
			const data = deviceData[deviceId] || {};
			return `<strong>Soil Moisture Sensor</strong>`;
		}
	}

	// Function to initialize map controls (navigation and custom buttons)
	function initializeControls() {
		const navControl = new NavigationControl({ showCompass: true, showZoom: true });
		map.addControl(navControl, 'top-left');
	}

	// Function to change the map style
	function changeMapStyle(event) {
		const styleUrl = event.target.value;
		map.setStyle(styleUrl);
		map.on('style.load', () => {
			initializeMapLayers();
		});
	}

	// Subscribe to latest data store and update markers accordingly
	latestDataStore.subscribe((fetchedData) => {
		if (fetchedData.length > 0) {
			fetchedData.forEach((entry) => {
				deviceData[entry.device_id] = entry;
			});
			addMarkers();
		}
	});

	// Reactive statement to handle layer visibility
	$: if (map && map.isStyleLoaded()) {
		toggleLayerVisibility('fields-layer', fieldsVisible);
		toggleLayerVisibility('fields-border', fieldsVisible);

		// Handle pulsing dot layers for each device
		Object.keys(deviceCoordinates).forEach((deviceId) => {
			const layerId = `layer-with-pulsing-dots-${deviceId}`;
			toggleLayerVisibility(layerId, pulsingDotsVisible);
		});
	}

	function toggleLayerVisibility(layerId, isVisible) {
		if (map && map.getLayer(layerId)) {
			map.setLayoutProperty(layerId, 'visibility', isVisible ? 'visible' : 'none');
		} else {
			console.error(`Layer ${layerId} does not exist on the map.`);
		}
	}

	// Function to select a device and update the status store
	function selectDevice(deviceId) {
		const deviceDataEntry = deviceData[deviceId] || {};
		const deviceImageUrl = `/${deviceImageMapping[deviceId]}` || 'default.png';
		const deviceName = deviceHardcodedNames[deviceId] || 'Unknown Device';
		const deviceCoords = deviceCoordinates[deviceId] || [0, 0];
		const deviceDepth = deviceDepths[deviceId] || 'Unknown';
		const ecValue =
			deviceDataEntry.ec != null
				? deviceDataEntry.ec
				: Object.keys(deviceDataEntry).length
				? 'N/A'
				: '';

		statusStore.set({
			temperature: deviceDataEntry.temperature || '',
			ec: ecValue,
			moisture: deviceDataEntry.moisture || '',
			eui: deviceId,
			imageUrl: deviceImageUrl,
			name: deviceName,
			lastMessageReceived: deviceDataEntry.received_at || 'Not Available',
			coordinates: deviceCoords,
			depth: deviceDepth
		});

		selectedDeviceId.set(deviceId); // Update the selected device store
	}

	// Define the pulsating dot for the map
	function createPulsingDot(color) {
		const size = 90;
		return {
			width: size,
			height: size,
			data: new Uint8Array(size * size * 4),
			onAdd() {
				const canvas = document.createElement('canvas');
				canvas.width = this.width;
				canvas.height = this.height;
				this.context = canvas.getContext('2d');
			},
			render() {
				const duration = 2000;
				const t = (performance.now() % duration) / duration;
				const radius = (size / 2) * 0.3;
				const outerRadius = (size / 3) * 0.7 * t + radius;
				const context = this.context;

				context.clearRect(0, 0, this.width, this.height);
				context.beginPath();
				context.arc(this.width / 2, this.height / 2, outerRadius, 0, Math.PI * 2);
				context.fillStyle = `rgba(232, 232, 232, ${1 - t})`;
				context.fill();

				context.beginPath();
				context.arc(this.width / 2, this.height / 2, radius, 0, Math.PI * 2);
				context.fillStyle = color;
				context.strokeStyle = '#F5F5F5';
				context.lineWidth = 2 + 4 * (1 - t);
				context.fill();

				this.data = context.getImageData(0, 0, this.width, this.height).data;
				map.triggerRepaint();

				return true;
			}
		};
	}

	// Function to get the color based on the EUI prefix
	// Function to get the color based on the device ID
	function getDotColor(deviceId) {
		let color;
		if (deviceId.startsWith('24E124126C')) {
			color = 'rgba(67, 0, 250)'; // Blue
		} else if (deviceId.startsWith('18000')) {
			color = 'rgba(103, 7, 237)'; // Another shade of blue
		} else if (deviceId.startsWith('24E124460C4')) {
			color = 'rgba(0, 255, 123)'; // Orange
		} else if (deviceId === DEVICES.GATEWAY) {
			color = 'rgba(254, 255, 250)'; // Green
		} else {
			color = 'rgba(0, 133, 250, 0.9)'; // Default to blue
		}
		console.log(`Device ID: ${deviceId}, Color: ${color}`);
		return color;
	}
</script>

<div class="map-container">
	<select class="style-switcher" on:change={changeMapStyle}>
		<option value="mapbox://styles/mapbox/satellite-v9">Satellite</option>
		<option value="mapbox://styles/mapbox/outdoors-v9">Outdoors</option>
	</select>

	<div class="layer-controls">
		<label>
			<input type="checkbox" bind:checked={fieldsVisible} />
			<span>Fields</span>
		</label>
		<div class="separator" />
		<label>
			<input type="checkbox" bind:checked={pulsingDotsVisible} />
			<span>Sensors</span>
		</label>
		<div class="separator" />
		<button class="explore-button" on:click={exploreFields}>
			<span>{isExploring ? 'Cancel' : 'Explore Fields'}</span>
			{#if isExploring}
				<span class="loading-spinner" />
			{/if}
		</button>
	</div>

	<div class="map" bind:this={mapContainer} />
	<div class="text-bottom"><p>Citrus Orchard in The Ghor Valley - Jordan</p></div>
	<div class="cutout-bottom" />
	<div class="cutout2-bottom" />
	<div class="cutout3-bottom" />
</div>

<style>
	.explore-button {
		display: flex; /* Use flexbox for alignment */
		align-items: center; /* Center items vertically */
		justify-content: center;
		padding: 0;
		color: #021580;
		border: none;
		cursor: pointer;
		font-size: 0.8rem;
		font-weight: 600;
		width: 90px;
		text-align: center;
		white-space: nowrap;
		transition: background-color 0.3s ease;
		background-color: transparent;
	}

	.explore-button:hover {
		color: #007bff;
	}

	.loading-spinner {
		margin-left: 10px; /* Space between text and spinner */
		width: 10px;
		height: 10px;
		border: 2px solid #021580;
		border-top: 2px solid transparent;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.style-switcher {
		position: absolute;
		top: 10px;
		right: 45px;
		padding: 5px 10px;
		border: 1px solid #ccc;
		border-radius: 6px;
		background-color: #f9f9f9;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		font-size: 0.9rem;
		font-weight: 600;
		color: #0d0c46;
		cursor: pointer;
		transition: background 0.3s ease, border-color 0.3s ease;
		outline: none;
		appearance: none;
		z-index: 99;
	}

	:global(.custom-geolocate-button) {
		position: absolute;
		top: 9.45rem;
		right: 26rem;
		padding: 2px 5px;
		border: none;
		border-radius: 6px;
		background: white;
		color: #021580;
		border: 1px solid #ccc;
		cursor: pointer;
		font-size: 1.2rem;
		font-weight: 500;
		z-index: 99;
		transition: background 0.3s ease, border-color 0.3s ease;
	}

	.layer-controls {
		position: absolute;
		top: 22.1rem;
		left: 6px;
		background-color: #f9f9f9;
		padding: 3px 10px;
		border-radius: 6px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		display: flex;
		flex-direction: row; /* Arrange items in a row */
		align-items: center;
		z-index: 10;
		transition: background 0.3s ease;
	}

	.layer-controls label {
		display: flex;
		align-items: center;
		font-size: 0.8rem;
		color: #0026fd;
		cursor: pointer;
		transition: color 0.3s ease;
		margin-right: 1px;
	}

	.layer-controls input[type='checkbox'] {
		margin-right: 8px;
		width: 15px;
		height: 15px;
		cursor: pointer;
	}

	.layer-controls label span {
		font-weight: 600;
		color: #021580;
	}

	.layer-controls label:hover span {
		color: #007bff;
	}

	.layer-controls .separator {
		width: 1px;
		height: 24px; /* Adjust height as needed */
		background-color: #ccc;
		margin: 0 10px; /* Adjust spacing as needed */
	}

	.map {
		position: relative;
		width: 100%;
		height: 100%;
		border-radius: 15px;
	}

	.map-container {
		position: relative;
		width: 100%;
		height: 100%;
		border-radius: 15px;
	}

	.text-bottom {
		position: absolute;
		bottom: 0.3%;
		right: 1.3%;
		color: var(--text-base);
		z-index: 100;
	}

	.text-bottom p {
		font-weight: 600;
		font-size: 0.9rem;
	}

	:global(.mapboxgl-popup) {
		background-image: linear-gradient(to left, rgb(160, 250, 224), rgb(167, 123, 248));
		width: 11rem;
		border-radius: 15px 5px 15px 15px;
	}
	:global(.mapboxgl-popup-content) {
		background-color: rgb(255, 255, 255);
		border-radius: 15px 5px 15px 15px;
		padding: 0.3em 0.5em 0.5em 0.5em;
		font-size: 0.9rem;
		color: #333333;
	}
	:global(.mapboxgl-popup-content strong) {
		color: var(--text-base);
		display: block;
		margin-bottom: 0.3rem;
		font-weight: 400;
		text-align: left;
	}
	:global(.mapboxgl-popup-content ul) {
		color: var(--text-base);
		padding-left: 0.1em;
		margin: 0;
	}
	:global(.mapboxgl-popup-content li) {
		color: var(--text-base);
		font-weight: normal;
		margin-bottom: 0.1em;
	}
	:global(.mapboxgl-popup-content li span) {
		color: #0045ad;
		font-weight: 700;
	}

	:global(.mapboxgl-popup .mapboxgl-popup-close-button) {
		padding-right: 0.4rem;
		border-radius: 50%;
		outline: none;
	}
	:global(.mapboxgl-popup .mapboxgl-popup-close-button:focus) {
		outline: none; /* Add this line to handle focus state */
	}

	:global(.mapboxgl-ctrl) {
		background-color: #c8ff00;
		border-radius: 6px;
	}

	:global(.mapboxgl-ctrl-group > button) {
		background-color: #ffffff;
		cursor: pointer;
		transition: background-color 0.3s ease, color 0.3s ease;
	}

	.cutout-bottom {
		width: 20rem;
		height: 1.5rem;
		position: absolute;
		bottom: 0;
		right: 0;
		background-color: var(--main-bg-color);
		border-radius: 15px 0px 0px 0px;
		z-index: 10;
	}

	.cutout-bottom::before {
		content: '';
		position: absolute;
		background-color: #0074d900;
		top: -50px;
		right: 0;
		height: 50px;
		width: 25px;
		border-bottom-right-radius: var(--border-radius);
		box-shadow: 0 25px 0 0 var(--main-bg-color);
		z-index: 10;
	}

	.cutout2-bottom {
		width: 19rem;
		height: 3.5rem;
		position: absolute;
		bottom: -3.5rem;
		right: 19.9rem;
		background-color: rgba(0, 0, 255, 0);
		border-radius: 25px 0px 0px 0px;
		z-index: 10;
	}

	.cutout2-bottom::before {
		content: '';
		position: absolute;
		background-color: #0074d900;
		top: -50px;
		right: -2px;
		height: 50px;
		width: 23px;
		border-bottom-right-radius: var(--border-radius);
		box-shadow: 0 10px 0 0 var(--main-bg-color);
		z-index: 10;
	}
</style>
