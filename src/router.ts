import { createRouter, createWebHashHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";

const routes: Array<RouteRecordRaw> = [
	{
		path: "",
		redirect: { name: "overview" },
	},
	{
		path: "/overview",
		name: "overview",
		component: () => import("@/views/Overview.vue"),
	},
	{
		path: "/map",
		name: "map",
		component: () => import("@/views/Map.vue"),
	},
	{
		path: "/stats",
		name: "stats",
		component: () => import("@/views/Stats.vue"),
		children: [
			{
				path: "",
				name: "stats.root",
				component: () => import("@/views/StatsRoot.vue"),
			},
			{
				path: "review/:startDate",
				name: "stats.review",
				component: () => import("@/views/HuinanReplay.vue"),
			},
		],
	},
];
const router = createRouter({
	history: createWebHashHistory(),
	routes,
});

export default router;
