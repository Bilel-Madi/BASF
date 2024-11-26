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
	() => import('./nodes/9'),
	() => import('./nodes/10'),
	() => import('./nodes/11'),
	() => import('./nodes/12'),
	() => import('./nodes/13'),
	() => import('./nodes/14'),
	() => import('./nodes/15'),
	() => import('./nodes/16')
];

export const server_loads = [0];

export const dictionary = {
		"/": [~2],
		"/admin": [~3],
		"/auth/onboarding": [~4],
		"/auth/signup": [~5],
		"/dashboard": [~6],
		"/devices": [~7],
		"/devices/add": [~8],
		"/devices/[eui]": [~9],
		"/organization": [~10],
		"/projects": [11],
		"/projects/add": [12],
		"/projects/[project_id]": [~13],
		"/zones": [~14],
		"/zones/add": [~15],
		"/zones/[zone_id]": [~16]
	};

export const hooks = {
	handleError: (({ error }) => { console.error(error) }),
};

export { default as root } from '../root.svelte';