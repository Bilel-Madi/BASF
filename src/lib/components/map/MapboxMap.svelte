<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import MapboxGL from 'mapbox-gl';

	// Props
	export let accessToken: string;
	export let center: [number, number] = [0, 0]; // [lng, lat]
	export let zoom: number = 2;
	export let style: string = 'mapbox://styles/mapbox/satellite-v9';
	export let markerPosition: [number, number] | null = null; // [lng, lat]
	export let allowMarkerPlacement: boolean = false;
	export let showControls: boolean = true;
	export let height: string = '400px';
	export let width: string = '100%';

	let mapContainer;
	let map: MapboxGL.Map;
	let marker: MapboxGL.Marker | null = null;

	const dispatch = createEventDispatcher();

	onMount(() => {
		MapboxGL.accessToken = accessToken;

		map = new MapboxGL.Map({
			container: mapContainer,
			style,
			center,
			zoom
		});

		if (showControls) {
			map.addControl(new MapboxGL.NavigationControl());
		}

		// If a marker position is provided, add a marker
		if (markerPosition) {
			marker = new MapboxGL.Marker().setLngLat(markerPosition).addTo(map);
		}

		// If marker placement is allowed, set up the click handler
		if (allowMarkerPlacement) {
			map.on('click', onMapClick);
		}
	});

	onDestroy(() => {
		if (map) map.remove();
	});

	function onMapClick(e: MapboxGL.MapMouseEvent & MapboxGL.EventData) {
		const { lng, lat } = e.lngLat;

		// Remove existing marker
		if (marker) marker.remove();

		// Add new marker
		marker = new MapboxGL.Marker().setLngLat([lng, lat]).addTo(map);

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
</script>

<div bind:this={mapContainer} style="width: {width}; height: {height};" />

<style>
	/* You can add component-specific styles here */
</style>
