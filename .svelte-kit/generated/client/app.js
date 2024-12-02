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
	() => import('./nodes/16'),
	() => import('./nodes/17'),
	() => import('./nodes/18'),
	() => import('./nodes/19')
];

export const server_loads = [0];

export const dictionary = {
		"/": [~2],
		"/admin": [~3],
		"/auth/onboarding": [~4],
		"/auth/signup": [~5],
		"/dashboard": [~6],
		"/demo/[slug]": [~7],
		"/devices": [~8],
		"/devices/add": [~9],
		"/devices/[eui]": [~10],
		"/organization": [~11],
		"/projects": [12],
		"/projects/add": [~13],
		"/projects/[project_id]": [~14],
		"/projects/[project_id]/settings": [~15],
		"/zones": [~16],
		"/zones/add": [~17],
		"/zones/[zone_id]": [~18],
		"/zones/[zone_id]/edit": [~19]
	};

export const hooks = {
	handleError: (({ error }) => { console.error(error) }),
};

export { default as root } from '../root.svelte';