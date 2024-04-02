<script setup lang="ts">
import { ref, computed, provide } from "vue";

import { use, registerTheme } from "echarts/core";

import { SVGRenderer } from "echarts/renderers";
import { LineChart, BarChart } from "echarts/charts";
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent, DatasetComponent } from "echarts/components";

import type { EChartsOption } from "echarts";

import VChart from "vue-echarts";

import vintage from "@/config/vintage.json";

import { THEME_KEY } from "vue-echarts";

registerTheme("vintage", vintage);
// provide(THEME_KEY, "vintage");

use([SVGRenderer, LineChart, BarChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent, DatasetComponent]);

const props = defineProps<{
	data: Array<{ time: number; groundTem: number; airTem: number; dewTem: number }>;
}>();

let seriesName = {
	datetime: "时间",
	highTem: "最高温度",
	lowTem: "最低温度",
	highHum: "最高湿度",
	lowHum: "最低湿度",
};

function tooltipFormatter(params: any) {
	let datetime = new Date(params[0].name).toLocaleString();
	let res = `<div class="tooltip-content"><div class="tooltip-line tooltip-title"><span> ` + datetime + "</span></div>";

	if (params[0].value.highTem)
		res += `<div class="tooltip-line"><span class="line-subtitle">${params[0].marker} ${params[0].seriesName}</span><span class="line-value">${params[0].value.highTem}℃</span></div>`;

	if (params[1].value.lowTem)
		res += `<div class="tooltip-line"><span class="line-subtitle">${params[1].marker} ${params[1].seriesName}</span><span class="line-value">${params[1].value.lowTem}℃</span></div>`;

	if (params[2].value.highHum)
		res += `<div class="tooltip-line"><span class="line-subtitle">${params[2].marker} ${params[2].seriesName}</span><span class="line-value">${params[2].value.highHum}℃</span></div>`;

	if (params[3].value.lowHum)
		res += `<div class="tooltip-line"><span class="line-subtitle">${params[3].marker} ${params[3].seriesName}</span><span class="line-value">${params[3].value.lowHum}℃</span></div>`;

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
	yAxis: [
		{
			type: "value",
			axisLabel: {
				formatter: "{value}℃",
			},
		},
		{
			type: "value",
			axisLabel: {
				formatter: "{value}%",
			},
		},
	],
	series: [
		{ type: "line", name: seriesName.highTem, smooth: 1, symbol: "circle", showSymbol: false, encode: { x: 0, y: 1 }, yAxisIndex: 0 },
		{ type: "line", name: seriesName.lowTem, smooth: 1, symbol: "circle", showSymbol: false, encode: { x: 0, y: 2 }, yAxisIndex: 0 },
		{ type: "line", name: seriesName.highHum, smooth: 1, symbol: "circle", showSymbol: false, encode: { x: 0, y: 3 }, yAxisIndex: 1 },
		{ type: "line", name: seriesName.lowHum, smooth: 1, symbol: "circle", showSymbol: false, encode: { x: 0, y: 4 }, yAxisIndex: 1 },
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
