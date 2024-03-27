<script>
export default {
	props: {
		data: {
			type: Object,
		},
	},
};
</script>

<template>
	<div class="tooltip-content">
		<div class="tooltip-line tooltip-title">
			<span>{{ day }} {{ hour }}:00</span>
		</div>

		<div v-for="item in params" :key="item.seriesName" class="tooltip-line">
			<span class="line-subtitle">{{ item.marker }}{{ item.seriesName }}</span>
			<span class="line-value">{{ item.value[item.seriesIndex + 1] }}℃</span>
		</div>
	</div>
</template>

<style scoped lang="scss">
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
