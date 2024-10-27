<script>
	import { scheduleStore } from '$lib/stores/scheduleStore';
	import { get } from 'svelte/store';

	let valveStatus = false; // false for closed, true for open
	let showModal = false;
	let modalStage = 0; // 0: initial options, 1: confirm manual, 2: processing, 3: done, 4: schedule
	let scheduleDuration = 0; // Duration in minutes
	let selectedDays = []; // Selected days for the schedule
	let scheduleStartTime = ''; // Start time for the schedule

	function toggleValve() {
		// Open the modal to choose the action
		showModal = true;
		modalStage = 0; // Reset to initial options stage
	}

	function confirmAction() {
		if (modalStage === 0) {
			// Move to confirmation for manual control
			modalStage = 1;
		} else if (modalStage === 1) {
			// Move to processing stage
			modalStage = 2;
			setTimeout(() => {
				valveStatus = !valveStatus; // Simulate changing the valve status
				modalStage = 3; // Done stage
			}, 3000); // Simulate operation delay
		} else if (modalStage === 3) {
			// Close modal when in done stage
			showModal = false;
		}
	}

	function confirmManualAction() {
		modalStage = 2;
		setTimeout(() => {
			valveStatus = !valveStatus; // Simulate changing the valve status
			modalStage = 3; // Done stage
		}, 3000); // Simulate operation delay
	}

	function cancelAction() {
		showModal = false;
	}

	function setSchedule() {
		modalStage = 4; // Move to scheduling stage
	}

	function confirmSchedule() {
		// Update the schedule store
		scheduleStore.set({
			duration: scheduleDuration,
			startTime: scheduleStartTime,
			days: selectedDays
		});
		showModal = false;
	}

	function toggleDay(day) {
		if (selectedDays.includes(day)) {
			selectedDays = selectedDays.filter((d) => d !== day);
		} else {
			selectedDays.push(day);
		}
	}
</script>

<div style="display: flex; align-items: center; margin-bottom: 0px;">
	<span style="margin-right: 10px; font-size :0.9rem;">Control Valve 1:</span>
	<div class="switch" on:click={toggleValve} class:on={valveStatus}>
		<div class="slider" />
	</div>
</div>

{#if showModal}
	<div class="backdrop" on:click={cancelAction} />
	<div class="modal">
		{#if modalStage === 0}
			<p>
				<strong>Select Action:</strong> Do you wish to {valveStatus ? 'close' : 'open'} Valve 1?
			</p>
			<div class="button-container">
				<button on:click={confirmAction}>Manual</button>
				{#if !valveStatus}
					<button on:click={setSchedule}>Set Schedule</button>
				{/if}
				<button on:click={cancelAction}>Cancel</button>
			</div>
		{:else if modalStage === 1}
			<p>
				<strong>Confirm Action:</strong> Are you sure you want to {valveStatus ? 'close' : 'open'} Valve
				1?
			</p>
			<div class="button-container">
				<button on:click={confirmManualAction}>{valveStatus ? 'Close' : 'Open'}</button>
				<button on:click={cancelAction}>Cancel</button>
			</div>
		{:else if modalStage === 2}
			<p>
				{valveStatus ? 'Closing' : 'Opening'} Valve 1. Please wait<span class="dot">.</span><span
					class="dot">.</span
				><span class="dot">.</span>
			</p>
		{:else if modalStage === 3}
			<p>Valve 1 is now {valveStatus ? 'open' : 'closed'}.</p>
			<div class="button-container">
				<button class="exit-button" on:click={confirmAction}>Close</button>
			</div>
		{:else if modalStage === 4}
			<p>
				<strong>Set Schedule:</strong> Configure the valve opening schedule
			</p>
			<div class="schedule-inputs">
				<div class="input-group">
					<label>Enter the start time:</label>
					<input type="time" bind:value={scheduleStartTime} />
				</div>
				<div class="input-group">
					<label>Duration (minutes):</label>
					<input type="number" min="1" bind:value={scheduleDuration} />
				</div>
				<div class="input-group">
					<label>Select Days:</label>
					<div class="days-container">
						<button
							class:active={selectedDays.includes('Sunday')}
							on:click={() => toggleDay('Sunday')}>Sun</button
						>
						<button
							class:active={selectedDays.includes('Monday')}
							on:click={() => toggleDay('Monday')}>Mon</button
						>
						<button
							class:active={selectedDays.includes('Tuesday')}
							on:click={() => toggleDay('Tuesday')}>Tue</button
						>
						<button
							class:active={selectedDays.includes('Wednesday')}
							on:click={() => toggleDay('Wednesday')}>Wed</button
						>
						<button
							class:active={selectedDays.includes('Thursday')}
							on:click={() => toggleDay('Thursday')}>Thu</button
						>
						<button
							class:active={selectedDays.includes('Friday')}
							on:click={() => toggleDay('Friday')}>Fri</button
						>
						<button
							class:active={selectedDays.includes('Saturday')}
							on:click={() => toggleDay('Saturday')}>Sat</button
						>
					</div>
				</div>
			</div>
			<div class="button-container">
				<button on:click={confirmSchedule}>Confirm</button>
				<button on:click={cancelAction}>Cancel</button>
			</div>
		{/if}
	</div>
{/if}

<style>
	@keyframes bounce {
		0%,
		80%,
		100% {
			transform: scale(0);
		}
		40% {
			transform: scale(1);
		}
	}

	.dot {
		animation: bounce 1.4s infinite ease-in-out both;
		display: inline-block;
	}

	.dot:nth-child(1) {
		animation-delay: -0.32s;
	}
	.dot:nth-child(2) {
		animation-delay: -0.16s;
	}

	.modal {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 500px;
		padding: 20px;
		background-color: #fff;
		border-radius: 15px;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
		display: flex;
		flex-direction: column;
		align-items: center;
		z-index: 999;
		border: 1px solid #e3e3e3;
		transition: transform 0.3s ease-out;
	}

	.backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.4);
		z-index: 888;
		animation: fadeIn 0.5s;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	p {
		font-size: 16px;
		color: #333;
		margin: 20px 0;
		text-align: center;
	}

	.button-container {
		display: flex;
		justify-content: center;
		gap: 20px;
	}

	.switch {
		position: relative;
		display: inline-block;
		width: 55px;
		height: 28px;
		margin: 0;
	}

	.switch input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	.slider {
		position: absolute;
		cursor: pointer;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: #ccc;
		transition: 0.4s;
		border-radius: 34px;
	}

	.slider:before {
		position: absolute;
		content: '';
		height: 20px;
		width: 20px;
		left: 4px;
		bottom: 4px;
		background-color: white;
		transition: 0.4s;
		border-radius: 50%;
	}

	.switch.on .slider {
		background-color: #1b0ab1;
	}

	.switch.on .slider:before {
		transform: translateX(26px);
	}

	button {
		border: none;
		outline: none;
		cursor: pointer;
		font-size: 16px;
		padding: 10px 25px;
		border-radius: 10px;
		transition: all 0.3s ease;
		font-weight: 600;
	}

	button:not(.exit-button) {
		background-color: #1b0ab1;
		color: #ffffff;
	}

	button:hover:not(.exit-button) {
		background-color: #1b0ab1;
	}

	.exit-button {
		background-color: #35dc8e;
		color: #ffffff;
	}

	.exit-button:hover {
		background-color: #27af6f;
	}

	button:active {
		transform: scale(0.98);
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.days-container {
		display: flex;
		gap: 5px;
		margin-top: 10px;
	}

	.days-container button {
		padding: 5px 10px;
		border-radius: 5px;
		background-color: #ddd;
		cursor: pointer;
		transition: background-color 0.3s ease;
	}

	.days-container button.active {
		background-color: #1b0ab1;
		color: #ffffff;
	}

	.schedule-inputs {
		width: 100%;
	}

	.input-group {
		margin-bottom: 10px;
		width: 100%;
	}

	input[type='number'],
	input[type='time'] {
		border: 1px solid #ccc;
		border-radius: 5px;
		padding: 8px 10px;
		font-size: 16px;
		width: calc(100% - 20px); /* Ensures the inputs are the same width */
		margin-top: 5px;
		box-sizing: border-box;
		transition: border-color 0.3s ease;
	}

	input[type='number']:focus,
	input[type='time']:focus {
		border-color: #1b0ab1;
		outline: none;
		box-shadow: 0 0 5px rgba(0, 123, 255, 0.5);
	}

	/* Media queries for mobile view */
	@media (max-width: 768px) {
		.modal {
			width: 90%;
			padding: 15px;
		}

		p {
			font-size: 14px;
		}

		button {
			padding: 10px 30px;
			font-size: 0.9rem;
			font-weight: 400;
		}

		.input-group label,
		input[type='number'],
		input[type='time'] {
		}

		.days-container button {
			padding: 5px 8px;
		}

		.button-container {
			gap: 10px;
		}
	}

	@media (max-width: 480px) {
		.modal {
			width: 95%;
			padding: 10px;
		}

		p {
		}

		button {
			padding: 8px 20px;
			font-size: 0.9rem;
			font-weight: 400;
		}

		.input-group label,
		input[type='number'],
		input[type='time'] {
		}

		.days-container button {
			padding: 4px 6px;
		}

		.button-container {
			gap: 5px;
		}
	}
</style>
