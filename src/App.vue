<script lang="ts">
export default {
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
	},
	methods: {
		// getTransitionName(to, from) {},
	},
};
</script>

<template>
	<div class="app-root" id="app-root">
		<!-- <mdui-top-app-bar variant="small">
		<mdui-button-icon icon="menu"></mdui-button-icon>
		<mdui-top-app-bar-title>{{ $route.name }}</mdui-top-app-bar-title>
		<div style="flex-grow: 1"></div>
		<mdui-button-icon icon="more_vert"></mdui-button-icon>
	</mdui-top-app-bar> -->

		<!-- <KeepAlive>
		<RouterView />
	</KeepAlive> -->

		<RouterView v-slot="{ Component, route }" class="main-router-view">
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
.main-router-view {
	position: absolute;
	width: 98%;
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
