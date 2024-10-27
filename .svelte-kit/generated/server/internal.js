
import root from '../root.svelte';
import { set_building } from '__sveltekit/environment';
import { set_assets } from '__sveltekit/paths';
import { set_private_env, set_public_env } from '../../../node_modules/@sveltejs/kit/src/runtime/shared-server.js';

export const options = {
	app_template_contains_nonce: false,
	csp: {"mode":"auto","directives":{"upgrade-insecure-requests":false,"block-all-mixed-content":false},"reportOnly":{"upgrade-insecure-requests":false,"block-all-mixed-content":false}},
	csrf_check_origin: true,
	track_server_fetches: false,
	embedded: false,
	env_public_prefix: 'PUBLIC_',
	env_private_prefix: '',
	hooks: null, // added lazily, via `get_hooks`
	preload_strategy: "modulepreload",
	root,
	service_worker: true,
	templates: {
		app: ({ head, body, assets, nonce, env }) => "<!DOCTYPE html>\n<html lang=\"en\">\n\n<head>\n\t<meta charset=\"utf-8\" />\n\t<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n\t<meta name=\"theme-color\" content=\"#1b0ab1\">\n\t<meta name=\"description\" content=\"A brief description of your webpage.\" />\n\t<link rel=\"icon\" href=\"/favicon.png\" sizes=\"32x32\" />\n\t<link rel=\"icon\" href=\"/favicon.png\" sizes=\"192x192\" />\n\n\t<link rel=\"apple-touch-icon\" href=\"" + assets + "/favicon.png\" />\n\t<meta name=\"msapplication-TileImage\" content=\"/exfavicon.png\" />\n\t<link rel=\"canonical\" href=\"https://www.yourwebsite.com/page-url\" />\n\t<meta property=\"og:title\" content=\"Arddata™ — Jordan's #1 IoT Precision Agriculture Solution\" />\n\t<meta property=\"og:description\" content=\"Arddata™ — Jordan's #1 IoT Precision Agriculture Solution\" />\n\t<meta property=\"og:image\" content=\"https://www.yourwebsite.com/image.jpg\" />\n\t<meta name=\"twitter:card\" content=\"summary_large_image\" />\n\t<link rel=\"manifest\" href=\"/manifest.json\">\n\t<title>Arddata™ — </title>\n\t<meta name=\"robots\" content=\"index, follow\" />\n\t" + head + "\n\n\t<!-- Include Material Symbols Outlined CSS -->\n\t<link href=\"https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined\" rel=\"stylesheet\" />\n</head>\n\n<body data-sveltekit-preload-data=\"hover\">\n\t<div style=\"display: contents\">" + body + "</div>\n</body>\n\n</html>\n\n<style>\n\t@font-face {\n\t\tfont-family: 'Matter';\n\t\tsrc: url('Matter.ttf') format('truetype');\n\t\t/* Adjusted path, assuming the font is in the static folder */\n\t\tfont-display: swap;\n\t}\n\n\tbody {\n\t\tfont-family: 'Matter', sans-serif;\n\t\tcolor: var(--text-base);\n\t\t/* Ensure text color is applied globally */\n\t\tbackground-color: var(--main-bg-color);\n\t}\n\n\t.splash-screen {\n\t\tfont-family: 'Matter', sans-serif;\n\t\tcolor: var(--text-base);\n\t\t/* Ensure text color is applied globally */\n\t\tbackground-color: var(--main-bg-color);\n\t}\n\n\t:root {\n\t\t--border-base: #e8e8e8;\n\t\t--text-base: #0d0c46;\n\t\t--header-base: #1b0ab1;\n\t\t--main-bg-color: #fdfdfd;\n\t\t--main-div-color: #252525;\n\t\t--width: 100%;\n\t\t--max-width: none;\n\t\t--border-radius: 25px;\n\t\t--button-border-radius: 15px;\n\t\t--button-bg-color: #0ff0c3;\n\t\t--button-hover-bg-color: #0ff0c3;\n\t\t--button-text-color: #ffff;\n\n\t\t/* Mobile-specific variables */\n\t\t--mobile-width: 100%;\n\t\t--mobile-max-width: 868px;\n\t\t--mobile-border-radius: 10px;\n\t\t--mobile-button-border-radius: 10px;\n\t}\n\n\t* {\n\t\tmargin: 0;\n\t\tpadding: 0;\n\t\tbox-sizing: border-box;\n\t\tfont-family: 'Matter', sans-serif;\n\t\tfont-weight: 400;\n\t\tletter-spacing: -.02em;\n\t\t-webkit-font-smoothing: antialiased;\n\t\t-moz-osx-font-smoothing: grayscale;\n\t\t/* Ensures smooth fonts on macOS */\n\t\tlist-style: none;\n\t\tline-height: 110%;\n\t\tcolor: var(--text-base);\n\t\t/* Ensure all text elements inherit the text color */\n\t}\n\n\t@media only screen and (max-width: 750px) {\n\n\t\tbody,\n\t\thtml {\n\t\t\toverflow-x: hidden;\n\t\t}\n\t}\n</style>",
		error: ({ status, message }) => "<!DOCTYPE html>\n<html lang=\"en\">\n\t<head>\n\t\t<meta charset=\"utf-8\" />\n\t\t<title>" + message + "</title>\n\n\t\t<style>\n\t\t\tbody {\n\t\t\t\t--bg: white;\n\t\t\t\t--fg: #222;\n\t\t\t\t--divider: #ccc;\n\t\t\t\tbackground: var(--bg);\n\t\t\t\tcolor: var(--fg);\n\t\t\t\tfont-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,\n\t\t\t\t\tUbuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;\n\t\t\t\tdisplay: flex;\n\t\t\t\talign-items: center;\n\t\t\t\tjustify-content: center;\n\t\t\t\theight: 100vh;\n\t\t\t\tmargin: 0;\n\t\t\t}\n\n\t\t\t.error {\n\t\t\t\tdisplay: flex;\n\t\t\t\talign-items: center;\n\t\t\t\tmax-width: 32rem;\n\t\t\t\tmargin: 0 1rem;\n\t\t\t}\n\n\t\t\t.status {\n\t\t\t\tfont-weight: 200;\n\t\t\t\tfont-size: 3rem;\n\t\t\t\tline-height: 1;\n\t\t\t\tposition: relative;\n\t\t\t\ttop: -0.05rem;\n\t\t\t}\n\n\t\t\t.message {\n\t\t\t\tborder-left: 1px solid var(--divider);\n\t\t\t\tpadding: 0 0 0 1rem;\n\t\t\t\tmargin: 0 0 0 1rem;\n\t\t\t\tmin-height: 2.5rem;\n\t\t\t\tdisplay: flex;\n\t\t\t\talign-items: center;\n\t\t\t}\n\n\t\t\t.message h1 {\n\t\t\t\tfont-weight: 400;\n\t\t\t\tfont-size: 1em;\n\t\t\t\tmargin: 0;\n\t\t\t}\n\n\t\t\t@media (prefers-color-scheme: dark) {\n\t\t\t\tbody {\n\t\t\t\t\t--bg: #222;\n\t\t\t\t\t--fg: #ddd;\n\t\t\t\t\t--divider: #666;\n\t\t\t\t}\n\t\t\t}\n\t\t</style>\n\t</head>\n\t<body>\n\t\t<div class=\"error\">\n\t\t\t<span class=\"status\">" + status + "</span>\n\t\t\t<div class=\"message\">\n\t\t\t\t<h1>" + message + "</h1>\n\t\t\t</div>\n\t\t</div>\n\t</body>\n</html>\n"
	},
	version_hash: "1yd7ut6"
};

export function get_hooks() {
	return import("../../../src/hooks.server.ts");
}

export { set_assets, set_building, set_private_env, set_public_env };
