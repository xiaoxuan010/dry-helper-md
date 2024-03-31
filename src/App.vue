<script lang="ts">
import type { Dialog, Dropdown } from "mdui";
import AppBarMoreDialog from "@/components/AppBarMoreDialog.vue";

let appBarTitles = {
	map: "全省天气观察",
	overview: "回南天气总览",
	stats: "回南天气统计",
	default: "雾霭图谱",
};

export default {
	components: {
		AppBarMoreDialog,
	},
	data() {
		return {};
	},
	mounted() {},
	computed: {
		mainRouterID: {
			get() {
				return this.$route.name?.toString().split(".")[0];
			},
			set(val: string) {
				this.$router.push({ path: "/" + val });
			},
		},
		appBarTitle() {
			switch (this.mainRouterID) {
				case "map":
				case "overview":
				case "stats":
					return appBarTitles[this.mainRouterID];
				default:
					return appBarTitles.default;
			}
		},
	},
	methods: {
		openAppBarDropdown() {
			(this.$refs.appBarDialog as Dialog).open = true;
		},
	},
};
</script>

<template>
	<div class="app-root" id="app-root">
		<mdui-top-app-bar variant="small">
			<mdui-button-icon icon="water_drop" href="/#/overview"></mdui-button-icon>
			<mdui-top-app-bar-title>{{ appBarTitle }}</mdui-top-app-bar-title>
			<div style="flex-grow: 1"></div>
			<mdui-button-icon icon="more_vert" ref="appBarMoreBtn" @click="openAppBarDropdown"></mdui-button-icon>
		</mdui-top-app-bar>

		<mdui-dialog close-on-overlay-click ref="appBarDialog">
			<AppBarMoreDialog ref="appBarDropdown" />
		</mdui-dialog>

		<RouterView v-slot="{ Component }" class="main-router-view">
			<transition name="fade">
				<KeepAlive>
					<component :is="Component" />
				</KeepAlive>
			</transition>
		</RouterView>

		<mdui-navigation-bar label-visibility="selected" :value="mainRouterID" @change="mainRouterID = $event.target.value">
			<mdui-navigation-bar-item value="map" icon="place">地图</mdui-navigation-bar-item>
			<mdui-navigation-bar-item value="overview" icon="filter_center_focus">总览</mdui-navigation-bar-item>
			<mdui-navigation-bar-item value="stats" icon="bar_chart">统计</mdui-navigation-bar-item>
		</mdui-navigation-bar>
	</div>
</template>

<style lang="scss" scoped>
#appBarDropdown {
	position: fixed;
	width: 100vh;
	right: 0;
}

.main-router-view {
	position: absolute;
	width: 100%;
}

.fade-enter-active,
.fade-leave-active {
	transition: opacity 100ms ease;
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}
</style>
