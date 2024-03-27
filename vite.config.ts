import { fileURLToPath, URL } from "node:url";

import { defineConfig, splitVendorChunkPlugin } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		vue({
			template: {
				compilerOptions: {
					// 所有以 mdui- 开头的标签名都是 mdui 组件
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
		minify: true,
	},
});
