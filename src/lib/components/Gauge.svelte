<script>
	import { onMount } from 'svelte';
	import GaugeLibrary from 'svg-gauge';

	let gaugeElement;
	let gaugeInstance;
	let currentGaugeValue = 0;

	export let value = 0; // initialize as a number

	onMount(() => {
		const options = {
			min: 0,
			max: 50,
			dialStartAngle: 180,
			dialEndAngle: 0,
			label: function (val) {
				return Math.round(val) + '/' + this.max;
			},
			value: value,
			color: function (value) {
				if (value < -25) {
					return '#ef4655'; // was previously '#5ee432'
				} else if (value < 0) {
					return '#f7aa38'; // was previously '#fffa50'
				} else if (value < 25) {
					return '#fffa50'; // was previously '#f7aa38'
				} else {
					return '#0367fc'; // was previously '#ef4655'
				}
			}
		};
		gaugeInstance = GaugeLibrary(gaugeElement, options);
		gaugeInstance.setValue(value);
	});

	// Reactive statement to update the gauge when 'value' changes
	$: if (gaugeInstance) {
		gaugeInstance.setValue(Number(value)); // ensure value is a number
		gaugeInstance.setValueAnimated(value, 1);
	}
</script>

<div class="wrapper">
	<div bind:this={gaugeElement} id="gauge2" class="gauge-container two" />
</div>

<style>
	/* Make the container round with a subtle shadow and soft background for a modern look */
	.gauge-container {
		width: 150px;
		height: 150px;
	}

	/* Adjustments specific to the "two" variant of the gauge */
	.gauge-container.two {
		width: 130px;
		height: 130px;
	}

	/* Style the dial with a neutral muted color, make it thinner for a sleek look, and round the line ends */
	:global(.gauge-container.two .gauge .dial) {
		stroke: #bbb;
		stroke-width: 8;
		stroke-linecap: round;
	}

	/* Dynamic stroke color for the value indicator, with rounded line ends for a modern look */
	:global(.gauge-container.two .gauge .value) {
		stroke: currentColor;
		stroke-dasharray: none;
		stroke-width: 10;
		stroke-linecap: round;
	}

	/* Darker text with normal weight, centered both vertically and horizontally */
	:global(.gauge-container.two .gauge .value-text) {
		fill: #777;
		font-weight: 400;
		font-size: 1em;
		display: none; /* Slight adjustment for better visual alignment */
	}

	/* Wrapper styling */
</style>
