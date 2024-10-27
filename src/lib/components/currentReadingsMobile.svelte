<script lang="ts">
	import { statusStore } from '$lib/stores/status-updater';

	// Data subscriptions and computations
	$: moisture = $statusStore.moisture;
	$: conductivity = $statusStore.ec;
	$: temperature = $statusStore.temperature;

	function getBarColor(value, min, max) {
		if (value === undefined || value === null) {
			return '#c2c2c2';
		}
		if (value >= min && value < max) {
			if (min === 0) return '#ed6b6b';
			if (min === 15) return '#edd76b';
			if (min === 30) return '#00ff95';
			if (min === 50) return '#edd76b';
		}
		return '#c2c2c2';
	}

	function getMoisturePointerPosition(value) {
		const ranges = [
			{ min: 0, max: 15, flex: 15 },
			{ min: 15, max: 30, flex: 15 },
			{ min: 30, max: 50, flex: 20 },
			{ min: 50, max: 100, flex: 50 }
		];
		return getPointerPosition(value, ranges);
	}

	function getECPointerPosition(value) {
		const ranges = [
			{ min: 0, max: 200, flex: 20 },
			{ min: 200, max: 400, flex: 20 },
			{ min: 400, max: 1500, flex: 45 },
			{ min: 1500, max: 3000, flex: 15 }
		];
		return getPointerPosition(value, ranges);
	}

	function getTempPointerPosition(value) {
		const ranges = [
			{ min: 0, max: 13, flex: 26 },
			{ min: 13, max: 20, flex: 14 },
			{ min: 20, max: 30, flex: 20 },
			{ min: 30, max: 35, flex: 10 },
			{ min: 35, max: 40, flex: 10 }
		];
		return getPointerPosition(value, ranges);
	}

	function getPointerPosition(value, ranges) {
		let totalFlex = 0;
		let position = 0;

		for (const range of ranges) {
			if (value >= range.min && value < range.max) {
				const rangeFlex = (range.flex * (value - range.min)) / (range.max - range.min);
				position += rangeFlex;
				break;
			}
			totalFlex += range.flex;
			position = totalFlex;
		}

		return position;
	}

	function getECBarColor(value, min, max) {
		if (value === undefined || value === null) {
			return '#c2c2c2';
		}
		if (value >= min && value < max) {
			if (min === 0) return '#ed6b6b';
			if (min === 200) return '#edd76b';
			if (min === 400) return '#00ff95';
			if (min === 1500) return '#edd76b';
		}
		return '#c2c2c2';
	}

	function getTempBarColor(value, min, max) {
		if (value === undefined || value === null) {
			return '#c2c2c2';
		}
		if (value >= min && value < max) {
			if (min === 0) return '#ed6b6b';
			if (min === 13) return '#edd76b';
			if (min === 20) return '#00ff95';
			if (min === 30) return '#edd76b';
			if (min === 35) return '#ed6b6b';
		}
		return '#c2c2c2';
	}
</script>

<!-- <div class="current-readings-title">
	<h5>Current Values</h5>
</div> -->

<div class="main_overview">
	<div class="overview_card">
		<div class="overview_card-info">
			<div class="status-box soil-moisture">
				<p>VWC</p>
				<p>{moisture || ''}%</p>
			</div>
		</div>
		<div class="moisture-bars">
			<div class="bar" style="flex: 15; background-color: {getBarColor(moisture, 0, 15)};" />
			<div class="bar" style="flex: 15; background-color: {getBarColor(moisture, 15, 30)};" />
			<div class="bar" style="flex: 20; background-color: {getBarColor(moisture, 30, 50)};" />
			<div class="bar" style="flex: 50; background-color: {getBarColor(moisture, 50, 100)};" />
			<div
				class="pointer"
				style="left: calc({getMoisturePointerPosition(moisture)}%); visibility: {moisture
					? 'visible'
					: 'hidden'};"
			/>
		</div>
	</div>

	<div class="overview_card">
		<div class="overview_card-info">
			<div class="status-box soil-conductivity">
				<p>EC</p>
				<p>{conductivity || ''} µS/cm</p>
			</div>
		</div>
		<div class="ec-bars">
			<div class="bar" style="flex: 20; background-color: {getECBarColor(conductivity, 0, 200)};" />
			<div
				class="bar"
				style="flex: 20; background-color: {getECBarColor(conductivity, 200, 400)};"
			/>
			<div
				class="bar"
				style="flex: 45; background-color: {getECBarColor(conductivity, 400, 1500)};"
			/>
			<div
				class="bar"
				style="flex: 15; background-color: {getECBarColor(conductivity, 1500, 3000)};"
			/>
			<div
				class="pointer"
				style="left: calc({getECPointerPosition(conductivity)}%); visibility: {conductivity
					? 'visible'
					: 'hidden'};"
			/>
		</div>
	</div>

	<div class="overview_card">
		<div class="overview_card-info">
			<div class="status-box soil-temp">
				<p>Temp</p>
				<p>{temperature || ''}°C</p>
			</div>
		</div>
		<div class="temp-bars">
			<div class="bar" style="flex: 13; background-color: {getTempBarColor(temperature, 0, 13)};" />
			<div class="bar" style="flex: 7; background-color: {getTempBarColor(temperature, 13, 20)};" />
			<div
				class="bar"
				style="flex: 10; background-color: {getTempBarColor(temperature, 20, 30)};"
			/>
			<div class="bar" style="flex: 5; background-color: {getTempBarColor(temperature, 30, 35)};" />
			<div class="bar" style="flex: 5; background-color: {getTempBarColor(temperature, 35, 40)};" />
			<div
				class="pointer"
				style="left: calc({getTempPointerPosition(temperature)}%); visibility: {temperature
					? 'visible'
					: 'hidden'};"
			/>
		</div>
	</div>
</div>

<style>
	.current-readings-title {
		margin-bottom: 0.8rem;
	}
	.main_overview {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		width: 100%;
		margin-top: -0.1rem;
	}

	.overview_card {
		position: relative;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		padding: 2px;

		gap: 0.5rem;
		border: 0px solid var(--border-base);
		border-radius: 0px;
		color: var(--text-base);

		width: 100%;
		box-sizing: border-box;
	}

	.overview_card-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
	}

	.overview_card p {
		font-size: 0.8rem;
		opacity: 1;
		margin-top: 0.5rem;
		margin-bottom: -0.3rem;
		font-weight: 500;
		color: #0d0c46;
	}

	.overview_card-icon {
		margin-left: auto;
	}

	.status-box {
		display: flex;
		justify-content: space-between;
		width: 100%;
	}

	.status-box p:first-child {
		margin-right: auto;
		font-weight: normal; /* Keep label normal weight */
	}

	.status-box p:last-child {
		margin-left: auto;
		font-weight: bold; /* Make value bold */
		color: #1e07ec;
	}

	.moisture-bars,
	.ec-bars,
	.temp-bars {
		display: flex;
		position: relative;
		width: 100%;
		height: 2px;
		gap: 2px;
		margin-top: -1px;
	}

	.bar {
		background-color: #c2c2c2; /* Default color */
		border-radius: 3px;
		position: relative;
	}

	.pointer {
		position: absolute;
		width: 0;
		height: 0;
		border-left: 4px solid transparent;
		border-right: 4px solid transparent;
		border-bottom: 4px solid #0906c4;
		border-bottom-left-radius: 2px;
		border-bottom-right-radius: 2px;
		top: 4px; /* Adjust this value to position the pointer correctly */
		transform: translateX(-50%); /* Center the triangle */
		visibility: hidden; /* Hide by default */
	}
</style>
