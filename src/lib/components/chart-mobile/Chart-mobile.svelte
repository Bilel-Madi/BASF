<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import selectedDeviceId from '$lib/stores/deviceIdStore';
	import { datastore, updateDatastore } from '$lib/stores/datastore';
	import flatpickr from 'flatpickr';
	import 'flatpickr/dist/flatpickr.css';
	import type { DataEntry } from '$lib/utils/dataFetch';
	import Chart from '$lib/components/chart/ChartGraphMobile.svelte';
	import crosshairPlugin from 'chartjs-plugin-crosshair';

	let startDate: string = '';
	let endDate: string = '';
	let deviceId: string | null = null;

	let dataEntries: DataEntry[] = [];
	let filteredIrrigationData: any[] = [];
	let irrigationData: any[] = [];
	let weatherData: any[] = [];
	let precipitationData: { datetime: string; precip: number }[] = [];
	let filteredPrecipitationData: { datetime: string; precip: number }[] = [];
	let dateRangePicker: HTMLElement;
	let pickerInstance;
	let activePeriod = '2w';

	const deviceToFieldMap = {
		'24E124126C486081': 'Navel 2',
		'24E124126C486336': 'Pomelo 2',
		'24E124126C486225': 'Tangelo 2',
		'24E124126C486305': 'Clementine 1',
		'24E124126C486532': 'French 1',
		'24E124126C486094': 'Watermelon 1'
	};

	const unsubscribe = selectedDeviceId.subscribe((value) => {
		deviceId = value;
		if (deviceId !== null) {
			fetchFilteredData();
		}
	});

	const unsubscribeDatastore = datastore.subscribe((data) => {
		dataEntries = data;
	});

	async function fetchIrrigationData() {
		const response = await fetch('/Irrigation.json');
		if (response.ok) {
			irrigationData = await response.json();
			filterIrrigationData();
		} else {
			console.error('Failed to load irrigation data');
		}
	}

	async function fetchWeatherData() {
		const response = await fetch('/weatherdata.json');
		if (response.ok) {
			weatherData = await response.json();
			processWeatherData();
			filterPrecipitationData();
		} else {
			console.error('Failed to load weather data');
		}
	}

	function formatDateToISO(dateString) {
		return `${dateString}T00:00:00Z`;
	}

	function processWeatherData() {
		precipitationData = weatherData.days.map((day) => ({
			datetime: formatDateToISO(day.datetime),
			precip: day.precip
		}));
		console.log('Processed Precipitation Data:', precipitationData);
	}

	function filterIrrigationData() {
		if (!startDate || !endDate || !deviceId) {
			return;
		}

		const start = new Date(startDate).getTime();
		const end = new Date(endDate).getTime();
		const field = deviceToFieldMap[deviceId];

		filteredIrrigationData = irrigationData.filter((entry) => {
			const entryTime = new Date(entry.startTime).getTime();
			return entry.field === field && entryTime >= start && entryTime <= end;
		});
	}

	function filterPrecipitationData() {
		if (!startDate || !endDate) {
			return;
		}

		const start = new Date(startDate).getTime();
		const end = new Date(endDate).getTime();

		filteredPrecipitationData = precipitationData.filter((entry) => {
			const entryTime = new Date(entry.datetime).getTime();
			return entryTime >= start && entryTime <= end;
		});
		console.log('Filtered Precipitation Data:', filteredPrecipitationData);
	}

	function downloadCSV() {
		const headers = ['device_id', 'received_at', 'moisture', 'temperature', 'ec'];
		const csvRows = [headers.join(',')];

		dataEntries.forEach((entry) => {
			const values = headers.map((header) => JSON.stringify(entry[header]));
			csvRows.push(values.join(','));
		});

		const csvString = csvRows.join('\n');
		const blob = new Blob([csvString], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');

		const formattedStartDate = new Date(startDate).toISOString().slice(0, 10);
		const formattedEndDate = new Date(endDate).toISOString().slice(0, 10);
		const filename = `Sensor_${deviceId}_${formattedStartDate}_to_${formattedEndDate}.csv`;

		link.href = url;
		link.download = filename;
		link.click();
		URL.revokeObjectURL(url);
	}

	onDestroy(() => {
		unsubscribe();
		unsubscribeDatastore();
	});

	function initializeDefaultDates() {
		if (!startDate) {
			startDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
		}
		if (!endDate) {
			endDate = new Date().toISOString();
		}
	}

	async function fetchFilteredData() {
		initializeDefaultDates();
		await updateDatastore(deviceId, startDate, endDate);
		filterIrrigationData();
		filterPrecipitationData();
	}

	onMount(() => {
		initializeDefaultDates();
		fetchIrrigationData();
		fetchWeatherData();
		pickerInstance = flatpickr(dateRangePicker, {
			mode: 'range',
			dateFormat: 'Y-m-d',
			onChange: function (selectedDates) {
				if (selectedDates.length === 2) {
					startDate = selectedDates[0].toISOString().split('T')[0];
					endDate = selectedDates[1].toISOString().split('T')[0];
					fetchFilteredData();
				}
			}
		});
	});

	function setRange(daysBack: number, period: string) {
		activePeriod = period;
		const start = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
		startDate = start.toISOString().split('T')[0];
		endDate = new Date().toISOString();
		syncRangePicker();
		fetchFilteredData();
	}

	function setMonthsBack(monthsBack: number, period: string) {
		activePeriod = period;
		const start = new Date();
		start.setMonth(start.getMonth() - monthsBack);
		startDate = start.toISOString().split('T')[0];
		endDate = new Date().toISOString();
		syncRangePicker();
		fetchFilteredData();
	}

	function setYearsBack(yearsBack: number, period: string) {
		activePeriod = period;
		const start = new Date();
		start.setFullYear(start.getFullYear() - yearsBack);
		startDate = start.toISOString().split('T')[0];
		endDate = new Date().toISOString();
		syncRangePicker();
		fetchFilteredData();
	}

	function syncRangePicker() {
		if (pickerInstance) {
			pickerInstance.setDate([startDate, endDate], true);
		}
	}

	$: {
		console.log('Passing to Chart: Start Date:', startDate, 'End Date:', endDate);
		console.log('Passed Filtered Precipitation Data:');
	}
</script>

<div class="title"><h5>Device Data</h5></div>
<div class="container">
	<div class="date-range-container">
		<input type="text" bind:this={dateRangePicker} placeholder="Select Range" />
		<button class="apply" on:click={fetchFilteredData}>Apply</button>
	</div>
	<div class="button-group">
		<button on:click={() => setRange(1, '24h')} class:active={activePeriod === '24h'}>24h</button>
		<button on:click={() => setRange(3, '3d')} class:active={activePeriod === '3d'}>3d</button>
		<button on:click={() => setRange(7, '1w')} class:active={activePeriod === '1w'}>1w</button>
		<button on:click={() => setRange(14, '2w')} class:active={activePeriod === '2w'}>2w</button>
		<button on:click={() => setMonthsBack(1, '1m')} class:active={activePeriod === '1m'}>1m</button>
		<button on:click={() => setMonthsBack(3, '3m')} class:active={activePeriod === '3m'}>3m</button>
		<button on:click={() => setMonthsBack(6, '6m')} class:active={activePeriod === '6m'}>6m</button>
		<button on:click={() => setYearsBack(1, '1yr')} class:active={activePeriod === '1yr'}
			>1yr</button
		>
	</div>

	<div class="chart-container">
		<Chart {startDate} {endDate} {dataEntries} {filteredIrrigationData} />
	</div>
</div>

<style>
	.date-range-container {
		margin-top: 50px;
	}
	.title h5 {
		position: absolute;
	}

	.container {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
	}

	.button-group {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-bottom: 10px;
		margin-top: 10px;
		justify-content: flex-end;
		width: 100%;
	}

	.button-group button {
		padding: 3px 6px;
		margin: 1px;
		background-color: #f5f5f5;
		border: 1px solid #ccc;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.9rem;
	}

	.button-group button:hover {
		background-color: #e8e8e8;
	}

	.button-group button.active {
		background-color: #1b0ab1;
		color: white;
		border-color: #1b0ab1;
	}

	.date-range-container {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	input[type='text'] {
		width: 210px;
		padding: 4px 8px;
		border: 2px solid #ccc;
		border-radius: 10px;
		font-size: 16px;
	}

	.apply {
		padding: 0.4rem 0.9rem;
		border-radius: 10px;
		background-color: #1b0ab1;
		color: white;
		border: none;
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.3s, box-shadow 0.3s;
	}

	.apply:hover,
	.apply:focus {
		background-color: #1b0ab1;
		outline: none;
	}

	.apply:active {
		background-color: #1b0ab1;
	}

	.chart-container {
		margin-top: 20px;
	}

	:global(.flatpickr-calendar) {
		font-family: Arial, sans-serif;
		background-color: #fff;
		border-color: #ccc;
		width: 340px;
		overflow: hidden;
	}

	:global(.flatpickr-days) {
		display: flex;
		justify-content: space-between;
	}

	:global(.flatpickr-day) {
		color: #333;
		min-width: 40px;
		padding: 0 5px;
		box-sizing: border-box;
	}

	:global(.flatpickr-day.today) {
		background-color: #1b0ab1;
		color: white;
	}

	:global(.flatpickr-day.selected),
	:global(.flatpickr-day.startRange),
	:global(.flatpickr-day.endRange) {
		background-color: #1b0ab1;
		color: white;
	}

	:global(.flatpickr-day:hover) {
		background-color: #e8e8e8;
		cursor: pointer;
	}
</style>
