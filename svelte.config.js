import { vitePreprocess } from '@sveltejs/kit/vite';
import vercel from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    preprocess: [vitePreprocess({ typescript: true })],

    kit: {
        adapter: vercel({
            runtime: 'nodejs20.x', // Specify the Node.js runtime version here
        })
        // Additional configuration options can be added here
    }
};

export default config;