<!-- src/lib/components/map/MapboxMap.svelte -->
<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import mapboxgl from 'mapbox-gl';
	import centroid from '@turf/centroid';
	import type { Feature, Polygon } from 'geojson';

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
	export let maxZoom: number = 16; // Maximum zoom when fitting bounds
	export let minZoom: number = 5; // Minimum zoom when fitting bounds

	let mapContainer: HTMLElement;
	let map: mapboxgl.Map;
	let marker: mapboxgl.Marker | null = null;

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
		mapboxgl.accessToken = accessToken;

		map = new mapboxgl.Map({
			container: mapContainer,
			style,
			center: calculatedCenter,
			zoom
		});

		if (showControls) {
			map.addControl(new mapboxgl.NavigationControl());
		}

		// If a marker position is provided, add a marker
		if (markerPosition) {
			marker = new mapboxgl.Marker().setLngLat(markerPosition).addTo(map);
		}

		// If polygon data is provided, add it to the map
		if (polygonData) {
			map.on('load', () => {
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
						'fill-color': '#088',
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
			});
		}

		// If marker placement is allowed, set up the click handler
		if (allowMarkerPlacement) {
			map.on('click', onMapClick);
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

	// Method to set the map center
	export function setCenter(center: [number, number]) {
		if (map) {
			map.setCenter(center);
		}
	}
</script>

<div bind:this={mapContainer} style="width: {width}; height: {height};" />

<style>
	/* You can add component-specific styles here */
</style>
