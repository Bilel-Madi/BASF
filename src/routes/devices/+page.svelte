<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	export let data: { devices: DeviceWithZone[] };

	interface DeviceWithZone extends Device {
		zone: Zone;
	}
</script>

<div class="page-container">
	<div class="header">
		<h1 class="title">Your Devices</h1>
		<a href="/devices/add">
			<Button text="Add New Device" />
		</a>
	</div>

	<div class="table-container">
		<table>
			<thead>
				<tr>
					<th>Name</th>
					<th>EUI</th>
					<th>Type</th>
					<th>Zone</th>
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each data.devices as device}
					<tr>
						<td>{device.name}</td>
						<td>{device.eui}</td>
						<td>{device.type}</td>
						<td>{device.zone.name}</td>
						<td>
							<Button text="Edit" variant="google" href={`/devices/${device.id}`} />
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<style>
	.page-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 4rem;
	}

	.title {
		font-size: 1.8rem;
		color: #333;
		margin: 0;
	}

	.table-container {
		background: white;
		border-radius: 10px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
	}

	th {
		text-align: left;
		padding: 1rem;
		background: #f8f8f8;
		color: #666;
		font-weight: 600;
		border-bottom: 2px solid #ebebeb;
	}

	td {
		padding: 1rem;
		border-bottom: 1px solid #ebebeb;
		color: #333;
	}

	tr:last-child td {
		border-bottom: none;
	}

	tr:hover {
		background-color: rgb(243, 255, 250);
	}

	/* Make the EUI column text slightly smaller and monospace */
	td:nth-child(2) {
		font-family: monospace;
		font-size: 0.85rem;
	}

	/* Style the type column */
	td:nth-child(3) {
		text-transform: capitalize;
	}

	/* Ensure the action column button doesn't stretch */
	td:last-child {
		width: 100px;
	}

	@media (max-width: 768px) {
		.header {
			flex-direction: column;
			gap: 1rem;
			align-items: flex-start;
		}

		th,
		td {
			padding: 0.75rem;
		}
	}
</style>
