<script lang="ts">
	export let data: { devices: DeviceWithZone[] };

	interface DeviceWithZone extends Device {
		zone: Zone;
	}
</script>

<h1>Your Devices</h1>

<a href="/devices/add">Add New Device</a>

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
					<a href={`/devices/${device.id}`}>Edit</a>
				</td>
			</tr>
		{/each}
	</tbody>
</table>
