import { fileURLToPath, URL } from "node:url";

import { defineConfig, splitVendorChunkPlugin } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		vue({
			template: {
				compilerOptions: {
					isCustomElement: tag => tag.startsWith("mdui-"),
				},
			},
		}),
		splitVendorChunkPlugin(),
	],
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
	server: {
		proxy: {
			"/api": "http://106.55.3.212:12102",
		},
	},
	build: {
		rollupOptions: {
			output: {
				manualChunks(id) {
					if (id.includes("node_modules")) {
						const chunkName = id.toString().split("node_modules/")[1].split("/")[0];
						if (chunkName.startsWith("d3")) return "d3";
						if (chunkName.startsWith("lit") || chunkName.startsWith("@lit")) return "lit";
						if (chunkName.startsWith("mdui") || chunkName.startsWith("@material") || chunkName.startsWith("@mdui"))
							return "mdui";
						if (chunkName.startsWith("three")) return "three";
						return "vendor";
						// return chunkName;
					}
				},
			},
		},
	},
});
