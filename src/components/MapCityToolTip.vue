<template>
	<div class="tooltip-container mdui-prose" id="map-city-tool-tip">
		<div class="tooltip-content">
			<div class="tooltip-line tooltip-title">
				<span>{{ title.value }}</span>
			</div>
			<div class="tooltip-line" v-for="(item, index) in params?.value" :key="index">
				<span class="line-subtitle">{{ item.key }}</span>
				<span class="line-value">{{ item.value }}</span>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import type { PropType, Ref, ComputedRef } from "vue";

const props = defineProps({
	title: {
		type: Object as PropType<Ref<String>>,
		required: true,
	},
	params: {
		type: Object as PropType<ComputedRef>,
	},
});
</script>

<style scoped lang="scss">
div.tooltip-container {
	padding: 0.2em 0.4em;
	position: absolute;
	display: block;
	border-style: solid;
	white-space: nowrap;
	z-index: 9999999;
	box-shadow: rgba(0, 0, 0, 0.2) 1px 2px 10px;
	transition: opacity 0.2s cubic-bezier(0.23, 1, 0.32, 1) 0s, visibility 0.2s cubic-bezier(0.23, 1, 0.32, 1) 0s,
		transform 0.4s cubic-bezier(0.23, 1, 0.32, 1) 0s;
	background-color: rgb(255, 255, 255);
	border-width: 1px;
	border-radius: 4px;
	color: rgb(102, 102, 102);
	border-color: rgb(255, 255, 255);
	pointer-events: none;

	div.tooltip-content {
		font-size: 80%;

		div.tooltip-title {
			text-align: center;
		}

		div.tooltip-line {
			height: 1.4em;
			span {
				display: inline-block;
				margin-bottom: 0;
			}

			span.line-subtitle {
				width: 3em;
				text-align: left;
			}

			span.line-value {
				width: 4em;
				text-align: right;
				font-weight: bold;
			}
		}
	}
}
</style>
