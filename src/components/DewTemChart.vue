<script setup lang="ts">
import { ref, computed, createApp } from "vue";

import { use } from "echarts/core";

import { SVGRenderer } from "echarts/renderers";
import { LineChart, BarChart } from "echarts/charts";
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent, DatasetComponent } from "echarts/components";

import type { EChartsOption } from "echarts";

import VChart from "vue-echarts";

use([SVGRenderer, LineChart, BarChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent, DatasetComponent]);

const props = defineProps<{
	data: Array<{ time: number; groundTem: number; airTem: number; dewTem: number }>;
}>();

function tooltipFormatter(params: any) {
	let datetime = new Date(params[0].name).toLocaleString();
	let res = `<div class="tooltip-content"><div class="tooltip-line tooltip-title"><span> ` + datetime + "</span></div>";

	res += `<div class="tooltip-line"><span class="line-subtitle">${params[0].marker}地面温度</span><span class="line-value">${params[0].value.groundTem}℃</span></div>`;
	res += `<div class="tooltip-line"><span class="line-subtitle">${params[1].marker}空气温度</span><span class="line-value">${params[1].value.airTem}℃</span></div>`;
	res += `<div class="tooltip-line"><span class="line-subtitle">${params[2].marker}露点温度</span><span class="line-value">${params[2].value.dewTem}℃</span></div>`;

	res += "</div>";

	return res;
}

const option = computed<EChartsOption>(() => ({
	legend: {
		top: "bottom",
	},
	grid: {
		left: 20,
		right: 20,
		bottom: 40,
		top: 20,
		containLabel: true,
	},
	tooltip: {
		trigger: "axis",
		confine: true,
		formatter: tooltipFormatter,
	},
	dataset: {
		source: props.data,
	},
	xAxis: {
		type: "category",
		boundaryGap: false,
	},
	yAxis: {
		type: "value",
	},
	series: [
		{ type: "line", name: "地面温度", smooth: true, symbol: "circle", showSymbol: false, encode: { x: 0, y: 1 } },
		{ type: "line", name: "空气温度", smooth: true, symbol: "circle", showSymbol: false, encode: { x: 0, y: 2 } },
		{ type: "line", name: "露点温度", smooth: true, symbol: "circle", showSymbol: false, encode: { x: 0, y: 3 } },
	],
}));
</script>

<template>
	<v-chart class="chart" id="chart" ref="chart" :option="option" :autoresize="true" />
</template>

<style scoped>
#chart {
	width: 100%;
	height: 300px;
}
</style>

<style lang="scss">
div.tooltip-content {
	padding: 0 0.4rem;

	div.tooltip-title {
		text-align: center;
		margin-bottom: 0.2rem;
	}

	div.tooltip-line {
		height: 1.4rem;
		span {
			display: inline-block;
			margin-bottom: 0;
		}

		span.line-subtitle {
			width: 5rem;
			text-align: left;
		}

		span.line-value {
			width: 3rem;
			text-align: right;
			font-weight: bold;
		}
	}
}
</style>
