<script lang="ts">
	import { onMount } from 'svelte';
	import Breadcrumbs from '$lib/ui/breadcrumbs.svelte';
	import { goto } from '$app/navigation';

	// Define the structure of a field for better TypeScript support
	interface Field {
		_id: string;
		name: string;
		crop_type?: string;
		soil_type?: string;
		size_hectares?: number;
	}

	let fields: Field[] = [];

	onMount(async () => {
		try {
			const res = await fetch('/api/fields');
			if (res.ok) {
				fields = await res.json();
			} else {
				const error = await res.json();
				alert('Error fetching fields: ' + error.message);
			}
		} catch (err) {
			console.error('Fetch error:', err);
			alert('An unexpected error occurred while fetching fields.');
		}
	});

	const crumbs = [
		{ name: 'Home', href: '/' },
		{ name: 'Fields', href: '/fields' }
	];

	// Handle field deletion
	async function deleteField(field_id: string) {
		if (confirm('Are you sure you want to delete this field?')) {
			try {
				const res = await fetch(`/api/fields/${field_id}`, {
					method: 'DELETE'
				});
				if (res.ok) {
					alert('Field deleted successfully.');
					// Refresh the fields list
					fields = fields.filter((field) => field._id !== field_id);
				} else {
					const error = await res.json();
					alert('Error deleting field: ' + error.message);
				}
			} catch (err) {
				console.error('Delete error:', err);
				alert('An unexpected error occurred while deleting the field.');
			}
		}
	}
</script>

<main>
	<Breadcrumbs {crumbs} />
	<header>
		<h1>Fields</h1>
		<a class="add-button" href="/fields/new/edit">Add New Field</a>
	</header>

	{#if fields.length > 0}
		<ul class="field-list">
			{#each fields as field}
				<li class="field-item">
					<div class="field-info">
						<a class="field-link" href="/fields/{field._id}">
							<span class="field-name">{field.name}</span>
							<span class="field-details">
								{#if field.crop_type}
									Crop: {field.crop_type}
								{/if}
								{#if field.soil_type}
									| Soil: {field.soil_type}
								{/if}
								{#if field.size_hectares}
									| Size: {field.size_hectares} ha
								{/if}
							</span>
						</a>
					</div>
					<div class="field-actions">
						<a class="edit-link" href="/fields/{field._id}/edit">Edit</a>
						<button class="delete-button" on:click={() => deleteField(field._id)}>Delete</button>
					</div>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="no-fields">No fields found. <a href="/fields/new/edit">Add a new field</a>.</p>
	{/if}
</main>

<style>
	/* Reset some default styles for consistency across browsers */
	* {
		box-sizing: border-box;
		margin: 0;
		padding: 0;
	}

	/* Base styles for the main container */
	main {
		max-width: 900px;
		margin: 50px auto;
		padding: 0 20px;
		font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
		color: #333;
	}

	/* Header styling */
	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 40px;
	}

	h1 {
		font-size: 2.5rem;
		font-weight: 600;
		color: #2c3e50;
	}

	/* Add button styling */
	.add-button {
		background-color: #3498db;
		color: #fff;
		padding: 10px 20px;
		text-decoration: none;
		border-radius: 5px;
		font-size: 1rem;
		transition: background-color 0.3s ease;
	}

	.add-button:hover {
		background-color: #2980b9;
	}

	/* Field list styling */
	.field-list {
		list-style: none;
	}

	.field-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 15px 20px;
		background-color: #f9f9f9;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		margin-bottom: 15px;
		transition: background-color 0.3s ease, box-shadow 0.3s ease;
	}

	.field-item:hover {
		background-color: #f1f1f1;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
	}

	.field-info {
		flex: 1;
	}

	.field-link {
		text-decoration: none;
		color: #34495e;
		display: flex;
		flex-direction: column;
	}

	.field-name {
		font-weight: bold;
		font-size: 1.1rem;
		margin-bottom: 5px;
	}

	.field-details {
		font-size: 0.95rem;
		color: #7f8c8d;
	}

	.field-actions {
		margin-left: 20px;
		display: flex;
		gap: 10px;
	}

	.edit-link,
	.delete-button {
		background-color: #2ecc71;
		color: #fff;
		padding: 8px 16px;
		text-decoration: none;
		border: none;
		border-radius: 5px;
		font-size: 0.9rem;
		cursor: pointer;
		transition: background-color 0.3s ease;
	}

	.edit-link:hover {
		background-color: #27ae60;
	}

	.delete-button {
		background-color: #e74c3c;
	}

	.delete-button:hover {
		background-color: #c0392b;
	}

	.no-fields {
		font-size: 1rem;
		color: #7f8c8d;
		text-align: center;
		margin-top: 20px;
	}

	.no-fields a {
		color: #3498db;
		text-decoration: none;
		font-weight: bold;
	}

	.no-fields a:hover {
		text-decoration: underline;
	}

	/* Responsive design */
	@media (max-width: 600px) {
		header {
			flex-direction: column;
			align-items: flex-start;
		}

		.add-button {
			margin-top: 15px;
			width: 100%;
			text-align: center;
		}

		.field-item {
			flex-direction: column;
			align-items: flex-start;
		}

		.field-actions {
			margin-left: 0;
			margin-top: 10px;
		}
	}
</style>
