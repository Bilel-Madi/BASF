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
	import WeatherOnMap from './WeatherOnMap.svelte';
	import currentReadingsMobile from '$lib/components/currentReadingsMobile.svelte';
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
	let isPaused = false;

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
					center: deviceData[DEVICES.INITIAL]?.coordinates || [35.5795, 32.284],
					zoom: 15.5,
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
		center: deviceData[DEVICES.INITIAL]?.coordinates || [35.5795, 32.284],
		zoom: 15.5,
		bearing: 0,
		pitch: 0
	};
	// Define variables outside of exploreFields function to maintain state
	let index = 0;
	let initialDeviceCoordinates;
	let deviceIds = [];

	function exploreFields() {
		if (isExploring) {
			if (isPaused) {
				isPaused = false;
				flyToDevice(); // Resume flying to the next device
				return;
			}

			isExploring = false; // Stop exploration
			isPaused = false;
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

			// Close the currently open popup if any
			if (currentPopup) {
				currentPopup.remove();
				currentPopup = null;
			}

			return;
		}

		isExploring = true; // Start exploration
		isPaused = false;
		index = 0; // Reset index
		deviceIds = Object.keys(deviceCoordinates).filter((deviceId) => deviceId !== DEVICES.GATEWAY);

		function flyToDevice() {
			if (!isExploring || isPaused) return; // Stop if exploration is canceled or paused

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
					if (!isExploring || isPaused) return; // Check again if exploring was stopped or paused
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

						// Close the currently open popup if any
						if (currentPopup) {
							currentPopup.remove();
							currentPopup = null;
						}

						isExploring = false;
					}, 5000);
				});
			}
		}

		flyToDevice();
	}
	// Pause button event handler
	function pauseExploration() {
		if (isPaused) {
			return; // Do nothing if already paused
		}

		isPaused = !isPaused;
		if (isPaused) {
			if (explorationTimeout) {
				clearTimeout(explorationTimeout);
			}
			document.querySelector('.loading-spinner').style.animationPlayState = 'paused';
		} else {
			flyToDevice();
			document.querySelector('.loading-spinner').style.animationPlayState = 'running';
		}
	}

	// Function to initialize the Mapbox map
	function initializeMap() {
		map = new Map({
			container: mapContainer,
			accessToken:
				'pk.eyJ1IjoiYmlsZWxtYWRpIiwiYSI6ImNsbmJnM2ZrNTA1cXQybG56N2c0cjJ2bTcifQ.j-O_Igwc-2p3Na-mkusaDg',
			style: 'mapbox://styles/mapbox/satellite-v9',
			center: deviceData[DEVICES.INITIAL]?.coordinates || [35.580036, 32.284375],
			zoom: 13,
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
					center: deviceData[DEVICES.INITIAL]?.coordinates || [35.5795, 32.284],
					zoom: 15.5,
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
			if (!markers[deviceId]) {
				createMarker(deviceId); // Create the marker if it doesn't exist
			} else {
				updateMarker(deviceId); // Update the marker if it exists
			}
		});
	}

	// Function to update existing markers
	function updateMarker(deviceId) {
		// Check if the marker exists
		if (!markers[deviceId]) {
			console.warn(`Marker for device ${deviceId} does not exist.`);
			createMarker(deviceId); // Create the marker if it doesn't exist
		}

		const marker = markers[deviceId];

		// Check if the marker has a popup
		if (!marker.getPopup()) {
			console.warn(`Popup for marker ${deviceId} does not exist.`);
			const popupContent = createPopupContent(deviceId);
			const popup = new mapboxgl.Popup({
				className: 'custom-popup',
				anchor: 'bottom',
				offset: 10
			}).setHTML(popupContent);
			marker.setPopup(popup);
		} else {
			// Update the existing popup content
			const popupContent = createPopupContent(deviceId);
			marker.getPopup().setHTML(popupContent);
		}
	}

	// Function to create new markers
	// Function to create new markers
	function createMarker(deviceId) {
		const coordinates = deviceCoordinates[deviceId];
		if (!coordinates) {
			console.error(`No coordinates found for device ${deviceId}`);
			return;
		}

		const el = document.createElement('div');
		el.className = 'marker';
		el.style.width = '20px';
		el.style.height = '20px';
		el.style.backgroundSize = '100%';
		el.style.pointerEvents = 'auto'; // Ensure the marker can be clicked

		const marker = new mapboxgl.Marker(el).setLngLat(coordinates).addTo(map);
		markers[deviceId] = marker;

		el.addEventListener('click', (event) => {
			event.stopPropagation(); // Prevent click event from reaching the fields layer
			selectDevice(deviceId);

			// Close the currently open popup if any
			if (currentPopup) {
				currentPopup.remove();
				currentPopup = null;
			}

			let popupContent;
			let isSpecialDevice = false;

			if (deviceId === DEVICES.GATEWAY || deviceId === DEVICES.FIELD_CONTROLLER1) {
				// Use createPopupContent for gateway and field controller
				popupContent = createPopupContent(deviceId);
				isSpecialDevice = true;
			} else {
				// Create a container for the Svelte component
				const popupContainer = document.createElement('div');

				// Mount the Svelte component with deviceId as a prop
				new currentReadingsMobile({
					target: popupContainer,
					props: {
						deviceId: deviceId // Pass the deviceId as a prop
					}
				});
				popupContent = popupContainer;
			}

			// Create and set the popup
			const popup = new mapboxgl.Popup({
				className: 'custom-popup',
				anchor: 'bottom',
				offset: 10
			});

			if (isSpecialDevice) {
				popup.setHTML(popupContent);
			} else {
				popup.setDOMContent(popupContent);
			}

			// Open the new popup
			marker.setPopup(popup).togglePopup();
			currentPopup = popup;
		});
	}

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
		const navControl = new NavigationControl({ showCompass: false, showZoom: false });
		map.addControl(navControl, 'top-left');
	}

	let dialogVisible = false;
	let currentStyle = 'mapbox://styles/mapbox/satellite-v9'; // Default style

	function openDialog() {
		dialogVisible = true;
	}

	function closeDialog() {
		dialogVisible = false;
	}

	function changeMapStyle(styleUrl) {
		currentStyle = styleUrl; // Update the current style
		map.setStyle(styleUrl);
		map.on('style.load', () => {
			initializeMapLayers();
		});
		dialogVisible = false;
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
	<button class="style-switcher-button" on:click={openDialog}>
		<img src="layers.png" alt="Layers Icon" />
	</button>

	{#if dialogVisible}
		<div class="dialog-overlay">
			<div class="dialog-box">
				<h2>Select Map Style</h2>
				<button
					class:selected={currentStyle === 'mapbox://styles/mapbox/satellite-v9'}
					on:click={() => changeMapStyle('mapbox://styles/mapbox/satellite-v9')}
					disabled={currentStyle === 'mapbox://styles/mapbox/satellite-v9'}
				>
					Satellite
				</button>
				<button
					class:selected={currentStyle === 'mapbox://styles/mapbox/outdoors-v9'}
					on:click={() => changeMapStyle('mapbox://styles/mapbox/outdoors-v9')}
					disabled={currentStyle === 'mapbox://styles/mapbox/outdoors-v9'}
				>
					Outdoors
				</button>
				<button class="close-button" on:click={closeDialog}>Close</button>
			</div>
		</div>
	{/if}

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
			<span>{isExploring ? (isPaused ? 'Resume' : 'Cancel') : 'Explore Fields'}</span>
			{#if isExploring && !isPaused}
				<span class="loading-spinner" />
			{/if}
		</button>
	</div>

	{#if isExploring}
		<button class="pause-button" on:click={pauseExploration} title="Pause">
			<img src={isPaused ? 'play.png' : 'pause.png'} alt="Pause/Play" />
		</button>
	{/if}

	<div class="map" bind:this={mapContainer} />
	<div class="weather"><WeatherOnMap /></div>
	<button
		class="custom-geolocate-button"
		on:click={() => {
			map.flyTo({
				center: deviceData[DEVICES.INITIAL]?.coordinates || [35.5795, 32.284],
				zoom: 15.5,
				bearing: 0,
				pitch: 0
			});

			// Close the currently open popup if any
			if (currentPopup) {
				currentPopup.remove();
				currentPopup = null;
			}
		}}
	>
		<img src="locate.png" alt="Locate" />
	</button>
</div>

<style>
	.weather {
		position: absolute;
		top: 70.5%;
		right: -1.3%;
	}
	.explore-button {
		display: flex; /* Use flexbox for alignment */
		align-items: center; /* Center items vertically */
		justify-content: center;
		padding: 0;
		color: #0026fd;
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

	.explore-button span {
		color: #021580;
	}

	.explore-button:hover {
		color: #0026fd;
	}

	.loading-spinner {
		margin-left: 10px; /* Space between text and spinner */
		width: 10px;
		height: 10px;
		border: 2px solid #021580;
		border-top: 2px solid transparent;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		animation-play-state: running; /* Default to running */
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.pause-button {
		position: absolute;
		top: 92%;
		right: 16%;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 5px 10px;
		border: 1px solid #ccc;
		border-radius: 6px;
		background-color: #f9f9f9;
		cursor: pointer;
		width: 30px; /* Adjust width for icon */
		height: 30px; /* Adjust height for icon */
		text-align: center;
		white-space: nowrap;
		transition: background-color 0.3s ease;
		margin-left: 0.5rem;
		z-index: 1999;
	}

	.pause-button img {
		width: 18px; /* Adjust the size of the icon */
		height: 18px; /* Adjust the size of the icon */
	}

	.style-switcher-button {
		position: absolute;
		top: 83.5%; /* Adjust to place it over the geolocate button */
		right: -0.7%; /* Adjust as needed */
		padding: 5px 10px;
		border: none;
		border-radius: 6px;
		background-color: #f9f9f9;
		color: #021580;
		border: 1px solid #ccc;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 500;
		z-index: 99;
		transition: background 0.3s ease, border-color 0.3s ease;
		width: 30px; /* Match the size of the geolocate button */
		height: 30px; /* Match the size of the geolocate button */
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.style-switcher-button img {
		width: 20px; /* Adjust size as needed */
		height: 20px; /* Adjust size as needed */
	}

	.dialog-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 100;
	}

	.dialog-box {
		background: white;
		padding: 20px;
		border-radius: 10px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		text-align: left; /* Align text to the left */
	}

	.dialog-box h2 {
		margin-bottom: 20px;
		font-size: 1rem;
		text-align: left; /* Align text to the left */
	}

	.dialog-box button {
		margin: 5px;
		padding: 10px 20px;
		border: none;
		border-radius: 10px;
		background: #1b0ab1;
		color: white;
		cursor: pointer;
		transition: background 0.3s ease;
		text-align: left; /* Align text to the left */
	}

	.dialog-box button:hover {
		background: #1b0ab1;
	}

	.dialog-box .close-button {
		background: #ccc;
		color: #333;
	}

	.dialog-box .close-button:hover {
		background: #999;
	}

	.dialog-box button.selected {
		background: #1b0ab1; /* Highlight the selected button */
		color: white;
		border: 2px solid rgb(241, 237, 3);
	}
	.layer-controls {
		position: absolute;
		top: 25.1rem;
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
		width: 103%;
		height: 100%;
		border-radius: 0px 0px 15px 15px;
	}

	.map-container {
		position: relative;
		width: 100%;
		height: 95%;
		border-radius: 15px;
		margin-top: -0.3rem;
		margin-left: -0.3rem;
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

	.custom-geolocate-button {
		position: absolute;
		padding: 20px;
		border: none;
		border-radius: 6px;
		background-color: #f9f9f9;
		border: 1px solid #ccc;
		cursor: pointer;
		width: 30px; /* Adjust the width to fit the image */
		height: 30px; /* Adjust the height to fit the image */
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 99;
		transition: background 0.3s ease, border-color 0.3s ease;
	}

	.custom-geolocate-button img {
		width: 18px; /* Adjust the size of the image */
		height: 18px; /* Adjust the size of the image */
	}

	@media only screen and (max-width: 750px) {
		.custom-geolocate-button {
			top: 25.1rem; /* Adjust the position for mobile view */
			right: -0.15rem; /* Adjust the position for mobile view */
			padding: 4px 7px;
			font-size: 1rem;
		}
	}
</style>
