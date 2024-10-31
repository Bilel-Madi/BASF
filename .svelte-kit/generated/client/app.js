export { matchers } from './matchers.js';

export const nodes = [
	() => import('./nodes/0'),
	() => import('./nodes/1'),
	() => import('./nodes/2'),
	() => import('./nodes/3'),
	() => import('./nodes/4'),
	() => import('./nodes/5'),
	() => import('./nodes/6'),
	() => import('./nodes/7'),
	() => import('./nodes/8'),
	() => import('./nodes/9')
];

export const server_loads = [0];

export const dictionary = {
		"/": [2],
		"/devices": [3],
		"/devices/[device_id]": [4],
		"/devices/[device_id]/edit": [5],
		"/fields": [6],
		"/fields/new/edit": [7],
		"/fields/[field_id]": [8],
		"/fields/[field_id]/edit": [9]
	};

export const hooks = {
	handleError: (({ error }) => { console.error(error) }),
};

export { default as root } from '../root.svelte';