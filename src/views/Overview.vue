<script lang="ts" setup>
import { ref, type Ref, computed } from "vue";

import DewTemChart from "@/components/DewTemChart.vue";
import DewTemIntro from "@/components/DewTemIntro.vue";

import type { Dialog } from "mdui";

import axios from "axios";

// 数据全局变量
const dataTimestamp = ref(0);
const rtData = ref({
	groundTem: 0,
	humidity: 0,
	dewTem: 0,
});
const rangeData = ref([{ time: 0, groundTem: 0, airTem: 0, dewTem: 0 }]);
const forcase = ref("");

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

	axios.get("/forcase", { baseURL: API_PREFIX })
		.then(res => res.data)
		.then(resBody => {
			if (resBody.code != 0) {
				throw new Error(resBody.msg);
			}
			return resBody.data;
		})
		.then(data => {
			forcase.value = data.forcaseData_gz;
		})
		.catch(err => {
			console.error("Failed to fetch forcase.");
			console.error(err);
		});
}
fetchData();

const DewTemDialog: Ref<Dialog | undefined> = ref(undefined);

function openDewTemIntro() {
	if (DewTemDialog.value) DewTemDialog.value.open = true;
}

const temColor = computed(() => {
	let cha = rtData.value.dewTem - rtData.value.groundTem;
	if (cha <= -0.5) return "#1A9900";
	else if (cha <= 2) return "#FE8D59";
	else if (cha > 2) return "#FF0000";
	else return "#aaa";
});
</script>

<template>
	<div id="overview-root" class="root">
		<mdui-dialog close-on-overlay-click ref="DewTemDialog">
			<DewTemIntro />
		</mdui-dialog>

		<mdui-card class="data-stat-card" variant="outlined">
			<table class="stat-table">
				<tr class="stat-table-title">
					<td>地面温度</td>
					<td>相对湿度</td>
					<td>露点温度</td>
					<td @click="openDewTemIntro">露点地温差<mdui-icon name="info" style="font-size: inherit"></mdui-icon></td>
				</tr>
				<tr class="stat-table-value">
					<td>{{ rtData.groundTem.toFixed(0) }} ℃</td>
					<td>{{ rtData.humidity.toFixed(0) }} %</td>
					<td>{{ rtData.dewTem.toFixed(0) }} ℃</td>
					<td @click="openDewTemIntro" :style="{ color: temColor }">{{ (rtData.dewTem - rtData.groundTem).toFixed(0) }} ℃</td>
				</tr>
			</table>
		</mdui-card>
		<div class="right-comment">
			<small class="comment-content" v-if="dataTimestamp">
				数据更新时间：<span>{{ dataTimestamp }}</span>
			</small>
		</div>

		<div id="overview-content" class="content-container">
			<div class="mdui-prose">
				<h4>48小时温度数据</h4>
			</div>
			<DewTemChart :data="rangeData" class="main-chart" />
			<mdui-card variant="outlined" class="content-card mdui-prose">
				<div id="forcase-container">
					<h4>天气实况</h4>
					<div>
						{{ forcase }}
						<div class="right-comment">
							<small class="comment-content"> 数据来源：广州市气象台 </small>
						</div>
					</div>
				</div>
			</mdui-card>
		</div>
	</div>
</template>

<style scoped lang="scss">
.root {
	width: 100%;
	max-width: 63.875rem;
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
		margin: 0 auto;

		.mdui-prose {
			padding: 0.4em 0.6em;
			text-align: left;
		}

		.content-card {
			margin: 1em auto;
			width: 96%;
			padding: 1em;
		}
	}

	.main-chart {
		margin-top: 1em;
		height: 400px;
	}
}

.right-comment {
	text-align: right;
	width: 96%;
	margin-top: 0;

	.comment-content {
		font-size: 80%;
		opacity: 0.8;
	}
}
</style>
