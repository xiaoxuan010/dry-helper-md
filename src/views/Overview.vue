<script lang="ts" setup>
import { ref } from "vue";

import DewTemChart from "@/components/DewTemChart.vue";
// import dew24h from "@/data/dew24h";

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
			console.log(data);

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
		<div id="overview-content" class="content-container mdui-prose">
			<mdui-card class="data-stat-card" variant="outlined">
				<el-row>
					<el-col :span="6">
						<el-statistic title="地面温度" :value="rtData.groundTem" suffix="℃" />
					</el-col>
					<el-col :span="6">
						<el-statistic title="相对湿度" :value="rtData.humidity" suffix="%"> </el-statistic>
					</el-col>
					<el-col :span="6">
						<el-statistic title="露点温度" :value="rtData.dewTem" suffix="℃" />
					</el-col>
					<el-col :span="6">
						<el-statistic title="露点地温差" :value="rtData.dewTem - rtData.groundTem" suffix="℃" />
					</el-col>
				</el-row>
			</mdui-card>

			<h4>24小时温度数据</h4>

			<DewTemChart :data="rangeData" class="main-chart" />
		</div>
	</div>
</template>

<style scoped lang="scss">
.content-container {
	width: 98%;
	margin: 0 auto;
	/* text-align: center; */
}

.data-stat-card {
	width: 100%;
	padding: 0.8rem 0.4rem;

	.el-col {
		text-align: center;
	}
}

.main-chart {
	margin-top: 1rem;
	height: 400px;
}
</style>
