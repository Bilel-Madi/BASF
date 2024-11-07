<!-- src/lib/components/MapboxMap.svelte -->

<script lang="ts">
	import { onMount, createEventDispatcher, onDestroy } from 'svelte';
	import mapboxgl from 'mapbox-gl';
	import MapboxDraw from '@mapbox/mapbox-gl-draw';
	import * as turf from '@turf/turf';
	import { browser } from '$app/environment';

	export let initialGeometry: GeoJSON.Geometry | null = null;

	const dispatch = createEventDispatcher();
	let map: mapboxgl.Map | undefined;
	let draw: MapboxDraw;

	onMount(() => {
		if (!browser) return; // Don't try to create map during SSR

		mapboxgl.accessToken =
			'pk.eyJ1IjoiYmlsZWxtYWRpIiwiYSI6ImNsbmJnM2ZrNTA1cXQybG56N2c0cjJ2bTcifQ.j-O_Igwc-2p3Na-mkusaDg'; // Replace with your Mapbox token

		map = new mapboxgl.Map({
			container: 'map',
			style: 'mapbox://styles/mapbox/satellite-v9',
			center: [0, 0], // Default center
			zoom: 2
		});

		draw = new MapboxDraw({
			displayControlsDefault: false,
			controls: {
				polygon: true,
				trash: true
			},
			defaultMode: 'draw_polygon'
		});

		map.addControl(draw);

		if (initialGeometry) {
			const feature = {
				type: 'Feature',
				properties: {},
				geometry: initialGeometry
			};
			draw.add(feature);
			map.fitBounds(turf.bbox(feature));
			const calculatedArea = turf.area(feature);
			dispatch('geometryChange', { geometry: initialGeometry, area: calculatedArea });
		}

		const updateArea = () => {
			const data = draw.getAll();
			if (data.features.length > 0) {
				const feature = data.features[0];
				const area = turf.area(feature);
				dispatch('geometryChange', { geometry: feature.geometry, area });
			} else {
				dispatch('geometryChange', { geometry: null, area: 0 });
			}
		};

		map.on('draw.create', updateArea);
		map.on('draw.update', updateArea);
		map.on('draw.delete', updateArea);
	});

	onDestroy(() => {
		if (browser && map) {
			map.remove();
		}
	});
</script>

<div id="map" />

<style>
	#map {
		width: 100%;
		height: 400px;
	}
</style>
