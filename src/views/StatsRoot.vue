<script setup lang="ts">
import { useRouter } from "vue-router";

import history from "@/data/weathers/history.json";

const router = useRouter();

function gotoReview(startDate: string) {
	router.push({ name: "stats.review", params: { startDate } });
}
</script>

<template>
	<div class="stats-root">
		<mdui-list>
			<mdui-list-subheader>往年回南天记录 </mdui-list-subheader>
			<div v-for="huinan in history">
				<mdui-list-item end-icon="arrow_right" @click="gotoReview(huinan.startDate)">
					{{ huinan.startDate }}
					<span slot="description">持续{{ huinan.days }}天</span>
				</mdui-list-item>
			</div>
		</mdui-list>
	</div>
</template>
