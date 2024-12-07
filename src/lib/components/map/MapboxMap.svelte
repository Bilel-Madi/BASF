<!-- src/lib/components/map/MapboxMap.svelte -->

<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import mapboxgl from 'mapbox-gl';
	import MapboxDraw from '@mapbox/mapbox-gl-draw';
	import centroid from '@turf/centroid';
	import turfArea from '@turf/area';
	import type { Feature, Polygon, GeoJSON } from 'geojson';
	import * as turf from '@turf/turf';

	// Props
	export let accessToken: string;
	export let center: [number, number] = [0, 0]; // [lng, lat]
	export let zoom: number = 12; // Default zoom level
	export let style: string = 'mapbox://styles/mapbox/satellite-v9';
	export let markerPosition: [number, number] | null = null; // [lng, lat]
	export let polygonData: GeoJSON.Feature<GeoJSON.Polygon> | null = null;
	export let allowMarkerPlacement: boolean = false;
	export let showControls: boolean = true;
	export let height: string = '400px';
	export let width: string = '100%';
	export let maxZoom: number = 22; // Changed from 16 to 22 for maximum satellite zoom
	export let minZoom: number = 5;
	export let mapFeatures: any[] = []; // Existing zones and project boundaries
	export let allowPolygonDrawing: boolean = false;
	export let fillColor: string = '#088'; // Default color
	export let borderRadius: string = '0px'; // Add this new prop
	export let enableGlobeSpinning: boolean = false;
	export let secondsPerRevolution: number = 240;
	export let maxSpinZoom: number = 5;
	export let slowSpinZoom: number = 3;

	let mapContainer: HTMLElement;
	let map: mapboxgl.Map;
	let marker: mapboxgl.Marker | null = null;
	let draw: any; // MapboxDraw instance
	let userInteracting = false;

	const dispatch = createEventDispatcher();

	// Calculate centroid for centering the map
	let calculatedCenter: [number, number] = center;

	if (polygonData && polygonData.geometry.type === 'Polygon') {
		const centerFeature = centroid(polygonData as Feature<Polygon>);
		if (centerFeature && centerFeature.geometry.coordinates.length === 2) {
			calculatedCenter = [
				centerFeature.geometry.coordinates[0],
				centerFeature.geometry.coordinates[1]
			];
		}
	}

	onMount(() => {
		if (!accessToken) {
			console.error('Mapbox access token is missing.');
			return;
		}

		mapboxgl.accessToken = accessToken;

		// Calculate initial bounds and zoom before creating the map
		let initialBounds: mapboxgl.LngLatBounds | null = null;
		if (mapFeatures.length > 0) {
			const projectBoundary = mapFeatures.find(
				(feature) => feature.properties?.type === 'projectBoundary'
			);

			if (projectBoundary && projectBoundary.geometry) {
				initialBounds = new mapboxgl.LngLatBounds();

				if (projectBoundary.geometry.type === 'Polygon') {
					projectBoundary.geometry.coordinates[0].forEach((coord) => {
						initialBounds.extend(coord as [number, number]);
					});
				} else if (projectBoundary.geometry.type === 'MultiPolygon') {
					projectBoundary.geometry.coordinates.forEach((polygon) => {
						polygon[0].forEach((coord) => {
							initialBounds.extend(coord as [number, number]);
						});
					});
				}
			}
		}

		// Create map with calculated bounds
		const mapOptions: mapboxgl.MapboxOptions = {
			container: mapContainer,
			style: style,
			projection: enableGlobeSpinning ? 'globe' : 'mercator',
			maxZoom: maxZoom,
			minZoom: enableGlobeSpinning ? 0 : minZoom
		};

		// Handle initialization differently for globe vs regular view
		if (enableGlobeSpinning) {
			mapOptions.zoom = 1.5; // Start more zoomed out
			mapOptions.center = [0, 20];
		} else if (initialBounds && !initialBounds.isEmpty()) {
			const sw = initialBounds.getSouthWest();
			const ne = initialBounds.getNorthEast();

			// Check if bounds are valid
			if (sw && ne && !isNaN(sw.lng) && !isNaN(sw.lat) && !isNaN(ne.lng) && !isNaN(ne.lat)) {
				mapOptions.bounds = initialBounds;
				mapOptions.fitBoundsOptions = {
					padding: 50,
					maxZoom,
					minZoom
				};
			}
		} else {
			mapOptions.zoom = zoom;
			mapOptions.center = center;
		}

		map = new mapboxgl.Map(mapOptions);

		// Only add fog effect if globe spinning is enabled
		if (enableGlobeSpinning) {
			map.on('style.load', () => {
				map.setFog({
					color: 'rgb(186, 210, 235)', // sky color
					'high-color': 'rgb(36, 92, 223)', // upper atmosphere
					'horizon-blend': 0.22, // horizon blend size
					'space-color': 'rgb(49, 49, 99)', // space color
					'star-intensity': 0.1 // background star brightness
				});
			});
		}

		// Always add navigation controls for globe view
		if (enableGlobeSpinning || showControls) {
			map.addControl(new mapboxgl.NavigationControl());
		}

		// If a marker position is provided, add a marker
		if (markerPosition) {
			marker = new mapboxgl.Marker().setLngLat(markerPosition).addTo(map);
		}

		if (allowPolygonDrawing) {
			draw = new MapboxDraw({
				displayControlsDefault: false,
				controls: {
					polygon: true,
					trash: true
				},
				defaultMode: 'draw_polygon'
			});
			map.addControl(draw);

			// Handle drawing events
			map.on('draw.create', updateGeometry);
			map.on('draw.delete', updateGeometry);
			map.on('draw.update', updateGeometry);
		}

		map.on('load', () => {
			// Add features source
			if (mapFeatures.length > 0) {
				map.addSource('features', {
					type: 'geojson',
					data: {
						type: 'FeatureCollection',
						features: mapFeatures
					}
				});

				// Find project boundary feature
				const projectBoundary = mapFeatures.find(
					(feature) => feature.properties?.type === 'projectBoundary'
				);

				// If project boundary exists, fit the map to it
				if (projectBoundary && projectBoundary.geometry) {
					const bounds = new mapboxgl.LngLatBounds();

					// Handle different geometry types
					if (projectBoundary.geometry.type === 'Polygon') {
						projectBoundary.geometry.coordinates[0].forEach((coord) => {
							bounds.extend(coord);
						});
					} else if (projectBoundary.geometry.type === 'MultiPolygon') {
						projectBoundary.geometry.coordinates.forEach((polygon) => {
							polygon[0].forEach((coord) => {
								bounds.extend(coord);
							});
						});
					}

					// Fit the map to the bounds with padding
					map.fitBounds(bounds, {
						padding: 50, // Adds 50px padding around the boundary
						maxZoom: maxZoom,
						minZoom: minZoom,
						duration: 0 // Disable animation for initial load
					});
				}

				// Add zones layers with dynamic fill colors
				map.addLayer({
					id: 'zones-fill',
					type: 'fill',
					source: 'features',
					filter: ['==', ['get', 'type'], 'zone'],
					paint: {
						'fill-color': ['get', 'color'], // Use the color property from the feature
						'fill-opacity': 0.5
					}
				});

				map.addLayer({
					id: 'zones-outline',
					type: 'line',
					source: 'features',
					filter: ['==', ['get', 'type'], 'zone'],
					paint: {
						'line-color': '#000',
						'line-width': 2
					}
				});

				// Add project boundary layer with dashed lines and no fill
				map.addLayer({
					id: 'project-boundary',
					type: 'line',
					source: 'features',
					filter: ['==', ['get', 'type'], 'projectBoundary'],
					layout: {
						'line-cap': 'round',
						'line-join': 'round'
					},
					paint: {
						'line-color': '#00d87e',
						'line-dasharray': [2, 2],
						'line-width': 2
					}
				});

				// Add devices layer
				map.addLayer({
					id: 'devices',
					type: 'circle',
					source: 'features',
					filter: ['==', ['get', 'type'], 'device'],
					paint: {
						'circle-color': [
							'match',
							['get', 'deviceType'],
							'CO2_SENSOR',
							'#ff0000',
							'SOIL_MOISTURE',
							'#0000ff',
							'LIQUID_LEVEL',
							'#00ffb3', // Light blue color for LIQUID_LEVEL
							/* other */ '#888888'
						],
						'circle-radius': 7
					}
				});

				// Add device interaction handlers
				map.on('click', 'devices', (e) => {
					const features = map.queryRenderedFeatures(e.point, {
						layers: ['devices']
					});
					dispatch('deviceClick', { features });
				});

				map.on('mouseenter', 'devices', () => {
					map.getCanvas().style.cursor = 'pointer';
				});
				map.on('mouseleave', 'devices', () => {
					map.getCanvas().style.cursor = '';
				});
			}

			// If polygon data is provided, add it to the map (additional polygon, likely not needed)
			if (polygonData) {
				// Add the polygon as a source
				map.addSource('polygon', {
					type: 'geojson',
					data: polygonData
				});

				// Add fill layer
				map.addLayer({
					id: 'polygon-fill',
					type: 'fill',
					source: 'polygon',
					layout: {},
					paint: {
						'fill-color': ['get', 'color'], // Use the color from properties
						'fill-opacity': 0.5
					}
				});

				// Add outline layer
				map.addLayer({
					id: 'polygon-outline',
					type: 'line',
					source: 'polygon',
					layout: {},
					paint: {
						'line-color': '#000',
						'line-width': 2
					}
				});

				// Fit map to the polygon bounds with maxZoom and minZoom
				const coordinates = polygonData.geometry.coordinates[0];
				const bounds = coordinates.reduce((bounds, coord) => {
					return bounds.extend(coord);
				}, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

				map.fitBounds(bounds, { padding: 20, maxZoom, minZoom });

				// Debugging: Log successful map setup
				console.log('MapboxMap successfully added polygon and fitted bounds.');
			} else {
				console.warn('No polygonData provided to MapboxMap.');
			}

			// Update the polygon fill color if it exists
			if (polygonData) {
				map.setPaintProperty('polygon-fill', 'fill-color', fillColor);
			}
		});

		// If marker placement is allowed, set up the click handler
		if (allowMarkerPlacement) {
			map.on('click', onMapClick);
		}

		// Add globe spinning functionality
		if (enableGlobeSpinning) {
			function spinGlobe() {
				const zoom = map.getZoom();
				if (!userInteracting && zoom < maxSpinZoom) {
					let distancePerSecond = 360 / secondsPerRevolution;
					if (zoom > slowSpinZoom) {
						const zoomDif = (maxSpinZoom - zoom) / (maxSpinZoom - slowSpinZoom);
						distancePerSecond *= zoomDif;
					}
					const center = map.getCenter();
					center.lng -= distancePerSecond;
					map.easeTo({ center, duration: 1000, easing: (n) => n });
				}
			}

			// Update interaction handlers
			map.on('mousedown', () => {
				userInteracting = true;
			});
			map.on('dragstart', () => {
				userInteracting = true;
			});

			// Add global document handlers to catch interaction end
			document.addEventListener('mouseup', () => {
				userInteracting = false;
				spinGlobe();
			});
			document.addEventListener('touchend', () => {
				userInteracting = false;
				spinGlobe();
			});

			// When animation is complete, start spinning if there is no ongoing interaction
			map.on('moveend', () => {
				// Add a small delay before checking interaction state
				setTimeout(() => {
					if (!userInteracting) {
						spinGlobe();
					}
				}, 200);
			});

			// Start the initial spinning
			spinGlobe();
		}
	});

	onDestroy(() => {
		if (map) map.remove();
	});

	function onMapClick(e: mapboxgl.MapMouseEvent & mapboxgl.EventData) {
		const { lng, lat } = e.lngLat;

		// Remove existing marker
		if (marker) marker.remove();

		// Add new marker
		marker = new mapboxgl.Marker().setLngLat([lng, lat]).addTo(map);

		// Dispatch an event with the selected location
		dispatch('locationSelected', { longitude: lng, latitude: lat });
	}

	// Method to clear the marker
	export function clearMarker() {
		if (marker) {
			marker.remove();
			marker = null;
		}
	}

	// Method to set the marker position
	export function setMarkerPosition(position: [number, number]) {
		if (marker) {
			marker.setLngLat(position);
		} else {
			marker = new mapboxgl.Marker().setLngLat(position).addTo(map);
		}
	}

	// Method to set the map center with zoom
	export function setCenter(center: [number, number], newZoom: number = 14) {
		if (map) {
			map.flyTo({
				center: center,
				zoom: newZoom,
				essential: true
			});
		}
	}

	// Add function to handle drawing updates
	function updateGeometry() {
		const features = draw.getAll();
		if (features.features.length > 0) {
			const polygon = features.features[0];
			const polygonArea = turfArea(polygon);
			const polygonCentroid = centroid(polygon);

			dispatch('geometryChanged', {
				geometry: polygon.geometry,
				area: polygonArea,
				center: polygonCentroid.geometry
			});
		} else {
			dispatch('geometryChanged', {
				geometry: null,
				area: 0,
				center: null
			});
		}
	}

	// Add method to update fill color
	export function updateFillColor(color: string) {
		if (map) {
			// Update zones-fill layer to use the color property from each feature
			map.setPaintProperty('zones-fill', 'fill-color', ['get', 'color']);

			// Update draw polygon fill color if drawing is active
			if (draw) {
				const features = draw.getAll();
				if (features.features.length > 0) {
					map.setPaintProperty('gl-draw-polygon-fill-active', 'fill-color', color);
					map.setPaintProperty('gl-draw-polygon-fill-active', 'fill-opacity', 0.5);
				}
			}
		}
	}
</script>

<div class="map-container" style="border-radius: {borderRadius};">
	<div
		bind:this={mapContainer}
		style="width: {width}; height: {height}; border-radius: {borderRadius};"
	/>
</div>

<style>
	.map-container {
		width: 100%;
		height: 100%;
		overflow: hidden; /* Add this to ensure border-radius clips the content */
	}

	/* Ensure the map container fills its parent */
	div {
		width: 100%;
		height: 100%;
	}
</style>
