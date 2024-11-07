import { vitePreprocess } from '@sveltejs/kit/vite';
import vercel from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    preprocess: [vitePreprocess({ typescript: true })],

    kit: {
        adapter: vercel()
        // Additional configuration options can be added here
    }
};

export default config;