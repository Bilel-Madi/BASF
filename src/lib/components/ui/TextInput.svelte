<script lang="ts">
	export let type: string;
	export let id: string;
	export let name: string;
	export let value: string = '';
	export let required: boolean = false;
	export let placeholder: string = '';
	export let label: string = '';
	export let minlength: string | undefined = undefined;
</script>

<div class="text-input">
	<label for={id}>{label}</label>
	<input
		{type}
		{id}
		{name}
		{value}
		on:input={(e) => (value = e.currentTarget.value)}
		{required}
		{placeholder}
		{minlength}
	/>
</div>

<style>
	.text-input {
		width: 100%;
		position: relative;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 600;
		font-size: 0.87rem;
	}

	input {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid #ebebeb;
		border-radius: 10px;
		font-size: 1rem;
		transition: all 0.2s ease;
	}

	input:-webkit-autofill,
	input:-webkit-autofill:hover,
	input:-webkit-autofill:focus {
		-webkit-box-shadow: 0 0 0px 1000px rgb(248, 248, 248) inset;
		transition: background-color 5000s ease-in-out 0s;
	}

	input:hover {
		background-color: rgb(243, 255, 250);
		border: 2px solid #a9f5e2;
	}

	input:focus {
		outline: none;
		border-color: #15fdb7;
		box-shadow: 0 0 0 1px rgba(21, 253, 183, 0.5);
		background-color: rgb(243, 255, 250);
	}
</style>
