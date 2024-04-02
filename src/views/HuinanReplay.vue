<template>
	<div class="huinan-replay-root root">
		<div class="main-content mdui-prose">
			<!-- <mdui-card class="summary-card" variant="outlined"> -->
			<h2>概览</h2>

			<p>
				本次回南过程开始于 {{ startDateFormatted }}
				<span v-if="days"
					>，共持续 <strong>{{ days }}</strong> 天</span
				>。本次回南天过程中，气温介于 <strong> {{ minTem }}℃</strong> 和 <strong>{{ maxTem }}℃</strong> 之间，最高相对湿度达到
				<strong>{{ maxHum }}%</strong> 。
			</p>

			<HistoryWeatherChart :data="historyData.datas" />
			<!-- </mdui-card> -->
		</div>
	</div>
</template>

<style scoped lang="scss">
.root {
	width: 100%;
	text-align: center;
	left: 0;
	right: 0;

	.main-content {
		text-align: left;
		position: relative;
		left: 0;

		padding: 1em;

		margin: 0 auto;
		padding: 1em;
	}
}
</style>

<script setup>
import { useRoute } from "vue-router";

import history from "@/data/weathers/history.json";
import HistoryWeatherChart from "@/components/HistoryWeatherChart.vue";

const $route = useRoute();

let historyData = history.find(huinan => huinan.startDate === $route.params.startDate);

let date = new Date($route.params.startDate);
const startDateFormatted = date.getFullYear() + " 年 " + (date.getMonth() + 1) + " 月 " + date.getDate() + " 日 ";

const days = historyData?.days;
const maxTem = historyData.datas.reduce((max, data) => Math.max(max, data.highTem), -Infinity);
const minTem = historyData.datas.reduce((min, data) => Math.min(min, data.lowTem), Infinity);
const maxHum = historyData.datas.reduce((max, data) => Math.max(max, data.highHum), -Infinity);
</script>
