<template>
	<div class="root">
		<div class="mdui-prose">
			<h2>露点地温差</h2>
			<div align="left">
				<samll ><mdui-icon name="circle" style="font-size:10px; color: green;" ></mdui-icon> 绿色：<=-0.5 </samll>
				<span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<small><strong>绿色表示该点无回南天</strong></small></span>
				<br />
				<samll ><mdui-icon name="circle" style="font-size:10px; color: orange;" ></mdui-icon> 橙色：-0.5~2 </samll>
				<span>&nbsp;&nbsp;&nbsp;&nbsp;<small><strong>橙色表示该点出现回南天的可能性很大</strong></small></span>
				<br />
				<samll ><mdui-icon name="circle" style="font-size:10px; color: red;" ></mdui-icon> 红色：>2 </samll>
				<span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<small><strong>红色表示该点出现严重的回南天</strong></small></span>
			</div>
		</div>
	</div>
</template>

<style scoped lang="scss">
.root {
	text-align: left;
}
</style>
·