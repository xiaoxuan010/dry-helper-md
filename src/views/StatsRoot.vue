<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

function gotoReview(id: string) {
	router.push({ name: "stats.review" });
}
</script>

<template>
	<div class="stats-root">
		<mdui-list>
			<mdui-list-subheader>往年回南天记录 </mdui-list-subheader>
			<mdui-list-item end-icon="arrow_right" description="持续3天" @click="gotoReview('1')">2024/03/05 </mdui-list-item>
			<mdui-list-item end-icon="arrow_right" description="持续1天">2024/03/16</mdui-list-item>
		</mdui-list>
	</div>
</template>
