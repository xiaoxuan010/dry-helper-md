<script lang="ts" setup>
import { ref } from "vue";

import DewTemChart from "@/components/DewTemChart.vue";

import axios from "axios";

// 数据全局变量
const dataTimestamp = ref(0);
const rtData = ref({
	groundTem: 0,
	humidity: 0,
	dewTem: 0,
});
const rangeData = ref([{ time: 0, groundTem: 0, airTem: 0, dewTem: 0 }]);

function fetchData() {
	const API_PREFIX = "/api";

	// 获取本页数据
	axios.get("/gz", {
		baseURL: API_PREFIX,
	})
		.then(res => res.data)
		.then(resBody => {
			if (resBody.code != 0) {
				throw new Error(resBody.msg);
			}
			return resBody.data;
		})
		.then(data => {
			// 调试
			// console.log(data);

			// 更新数据
			dataTimestamp.value = data.timestamp;
			rtData.value = {
				groundTem: parseFloat(data.groundTem),
				humidity: parseFloat(data.humidity),
				dewTem: parseFloat(data.dewTem),
			};
			rangeData.value = data.rangeData;
		})
		.catch(err => {
			console.error("Failed to fetch data.");
			console.error(err);
		});
}
fetchData();
</script>

<template>
	<div id="overview-root" class="root">
		<mdui-card class="data-stat-card" variant="outlined">
			<table class="stat-table">
				<tr class="stat-table-title">
					<td>地面温度</td>
					<td>相对湿度</td>
					<td>露点温度</td>
					<td>露点地温差</td>
				</tr>
				<tr class="stat-table-value">
					<td>{{ rtData.groundTem.toFixed(0) }} ℃</td>
					<td>{{ rtData.humidity.toFixed(0) }} %</td>
					<td>{{ rtData.dewTem.toFixed(0) }} ℃</td>
					<td>{{ (rtData.dewTem - rtData.groundTem).toFixed(0) }} ℃</td>
				</tr>
			</table>
		</mdui-card>

		<div id="overview-content" class="content-container mdui-prose">
			<h4>24小时温度数据</h4>
			<DewTemChart :data="rangeData" class="main-chart" />
		</div>
	</div>
</template>

<style scoped lang="scss">
.root {
	width: 100%;
	text-align: center;
	left: 0;
	right: 0;

	.data-stat-card {
		width: 96%;
		padding: 0.6em 0.4em;
		margin: 0 auto;

		.stat-table {
			width: 100%;
			text-align: center;

			.stat-table-title {
				td {
					width: 25%;
				}
				color: #606266;

				line-height: var(--mdui-typescale-label-medium-line-height);
				font-size: var(--mdui-typescale-label-medium-size);
				font-weight: var(--mdui-typescale-label-medium-weight);
			}

			.stat-table-value {
				line-height: var(--mdui-typescale-headline-small-line-height);
				color: #303133;
				font-size: 20px;
				font-weight: 400;
			}
		}
	}

	.content-container {
		width: 96%;
		margin: 1em auto;
		// padding: 0.6em 0.4em;
		text-align: left;
	}

	.main-chart {
		margin-top: 1em;
		height: 400px;
	}
}
</style>
