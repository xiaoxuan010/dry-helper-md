<script setup lang="ts">
import { useRouter } from "vue-router";

import history from "@/data/weathers/history.json";

const router = useRouter();

function gotoReview(startDate: string) {
	router.push({ name: "stats.review", params: { startDate } });
}

let historyDatasMetaData = history.map(historyData => {
	let startDateFormatted = new Date(historyData.startDate).toLocaleDateString();
	let days = historyData.days;
	return {
		startDate: startDateFormatted,
		key: historyData.startDate,
		days: days,
	};
});
</script>

<template>
	<div class="stats-root root">
		<div class="container">
			<mdui-list>
				<mdui-list-subheader>往年回南天记录 </mdui-list-subheader>
				<div v-for="huinan in historyDatasMetaData">
					<mdui-list-item end-icon="arrow_right" @click="gotoReview(huinan.key)">
						{{ huinan.startDate }}
						<span slot="description">持续{{ huinan.days }}天</span>
					</mdui-list-item>
				</div>
			</mdui-list>
		</div>
	</div>
</template>

<style scoped lang="scss">
.root {
	.container {
		margin: 0 auto;
		text-align: left;
	}
}
</style>
