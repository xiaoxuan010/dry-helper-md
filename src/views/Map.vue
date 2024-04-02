<script setup lang="ts">
import MapCityToolTip from "@/components/MapCityToolTip.vue";

import { onMounted, onUnmounted, ref, type Ref, createApp, computed } from "vue";

import * as THREE from "three";
import * as d3 from "d3";
import TWEEN from "@tweenjs/tween.js";

import axios from "axios";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { CSS3DObject, CSS3DRenderer } from "three/examples/jsm/Addons.js";

import * as cnGeoJson from "@/data/maps/cn.geo.json";
import * as gdGeoJson from "@/data/maps/gd.geo.json";

const threeMapDiv: Ref<HTMLElement | null> = ref(null);
const cityNameLabelDiv: Ref<HTMLElement | null> = ref(null);

const gdCityWeathers: Ref<{ [key: string]: { temperature: number; humidity: number; range: string; reportTime: string } }> = ref({});

async function fetchGdData() {
	const API_PREFIX = "/api";

	await axios
		.get("/gd", { baseURL: API_PREFIX })
		.then(response => response.data)
		.then(data => {
			for (let key in data) {
				let info = data[key].lives[0];
				let cityName = info.city;
				let weatherFeatures = {
					temperature: info.temperature,
					humidity: info.humidity,
					range: info.range,
					reportTime: info.reporttime,
				};
				gdCityWeathers.value[cityName] = weatherFeatures;
			}
		})
		.catch(error => {
			console.error("Fetch GD Data Error: ", error);
		});
}

// 数据预处理
let cnGeo: GeoJSON.FeatureCollection = {
	...(cnGeoJson as GeoJSON.FeatureCollection),
	features: (cnGeoJson as GeoJSON.FeatureCollection).features.filter(feature => feature.properties?.name != "广东省"),
};
let gdGeo = gdGeoJson as GeoJSON.FeatureCollection;

class ThreeMap {
	// 成员变量
	canvasWidth: number;
	canvasHeight: number;
	renderWidth: number;
	renderHeight: number;
	scene: THREE.Scene;
	camera: THREE.PerspectiveCamera;
	renderer: THREE.WebGLRenderer;
	controller: OrbitControls;
	raycaster: THREE.Raycaster;
	mouse: THREE.Vector2 | undefined = undefined;
	lastPick: THREE.Object3D | null = null;
	cnMap: THREE.Object3D<THREE.Object3DEventMap>;
	gdMap: THREE.Object3D<THREE.Object3DEventMap>;
	gdCityMeshes: THREE.Object3D[];
	cityNameLabels: THREE.Group = new THREE.Group();

	cnMapMaterial: THREE.MeshBasicMaterial[];
	gdMapMaterial: THREE.MeshBasicMaterial[];
	lineMaterial: THREE.LineBasicMaterial;
	gdLineMaterial: THREE.LineBasicMaterial;
	cnMapHeight: number;
	gdMapHeight: number;
	cnCenterTargetPos: THREE.Vector3;
	provinceTargetPos: THREE.Vector3;

	// labelRenderer: CSS2DRenderer;
	controllerConfig: {
		target: THREE.Vector3;
		enableDamping: boolean;
		dampingFactor: number;
		minAzimuthAngle: number;
		maxAzimuthAngle: number;
		minPolarAngle: number;
		maxPolarAngle: number;
		zoomSpeed: number;
	};
	controller2: OrbitControls | undefined;
	projectionFn: Function;
	scene2: THREE.Scene;
	renderCSS3D: CSS3DRenderer;
	cityTooltip: CSS3DObject | null = null;
	hoverCityName: Ref<string> = ref("");
	posTween: any;
	cityTooltipPos: THREE.Vector3 | null = null;

	constructor(divElement: HTMLElement, cityLabelDivElement: HTMLElement, width: number, height: number) {
		// 新建场景
		this.canvasWidth = width;
		this.canvasHeight = height;
		let deviceDpr = window.devicePixelRatio;
		this.renderWidth = this.canvasWidth * deviceDpr;
		this.renderHeight = this.canvasHeight * deviceDpr;

		// 初始化参数
		this.cnMapMaterial = [
			new THREE.MeshBasicMaterial({
				color: "#006E1C",
				transparent: true,
				opacity: 0.8,
			}),
			new THREE.MeshBasicMaterial({
				color: "#005313",
				transparent: true,
				opacity: 0.3,
			}),
		];
		this.gdMapMaterial = [
			new THREE.MeshBasicMaterial({
				// color: "#006E1C", // 深绿色
				color: "#B1CBB3", // 浅绿色
				transparent: true,
				opacity: 0.8,
			}),
			new THREE.MeshBasicMaterial({
				color: "#005313",
				transparent: true,
				opacity: 0.3,
			}),
		];
		this.lineMaterial = new THREE.LineBasicMaterial({
			color: "#FCFDF6",
			transparent: true,
			opacity: 0.8,
		});
		this.gdLineMaterial = new THREE.LineBasicMaterial({
			color: "#FCFDF6",
			transparent: true,
			opacity: 0,
		});
		this.projectionFn = d3.geoMercator().center([100.82, 38.05]).translate([0, 0]);

		this.cnCenterTargetPos = new THREE.Vector3(8.039, 6.65, 1);
		this.provinceTargetPos = new THREE.Vector3(33, -46, 1);

		// 新建场景
		this.scene = new THREE.Scene();

		// 新建相机
		this.camera = new THREE.PerspectiveCamera(75, this.canvasWidth / this.canvasHeight, 0.1, 3000);
		this.camera.position.z = 250;

		// 设置渲染器
		// CSS3DRenderer
		this.scene2 = new THREE.Scene();
		this.renderCSS3D = new CSS3DRenderer();
		this.renderCSS3D.setSize(this.canvasWidth, this.canvasHeight);
		this.renderCSS3D.domElement.style.position = "absolute";
		this.renderCSS3D.domElement.style.top = "0";
		cityLabelDivElement.appendChild(this.renderCSS3D.domElement);

		this.renderer = new THREE.WebGLRenderer({
			antialias: true,
			alpha: true,
			logarithmicDepthBuffer: true,
		});
		this.renderer.setSize(this.canvasWidth, this.canvasHeight);
		this.renderer.setPixelRatio(deviceDpr);
		divElement.appendChild(this.renderer.domElement);

		// 设置控制器
		this.controllerConfig = {
			target: new THREE.Vector3(this.cnCenterTargetPos.x, this.cnCenterTargetPos.y, this.cnCenterTargetPos.z),
			enableDamping: true,
			dampingFactor: 0.12,
			minAzimuthAngle: 0,
			maxAzimuthAngle: 0,
			minPolarAngle: Math.PI / 2,
			maxPolarAngle: Math.PI,
			zoomSpeed: 1.5,
		};
		this.controller = new OrbitControls(this.camera, this.renderer.domElement);
		this.controller.target.copy(this.controllerConfig.target);
		this.controller.enableDamping = this.controllerConfig.enableDamping;
		this.controller.dampingFactor = this.controllerConfig.dampingFactor;
		this.controller.minAzimuthAngle = this.controllerConfig.minAzimuthAngle;
		this.controller.maxAzimuthAngle = this.controllerConfig.maxAzimuthAngle;
		this.controller.minPolarAngle = this.controllerConfig.minPolarAngle;
		this.controller.maxPolarAngle = this.controllerConfig.maxPolarAngle;
		this.controller.zoomSpeed = this.controllerConfig.zoomSpeed;

		// 生成地图
		this.cnMapHeight = 0.4;
		this.gdMapHeight = 1.2;
		this.cnMap = this.generateMap(cnGeo, this.cnMapHeight, this.cnMapMaterial, this.lineMaterial);
		this.gdMap = this.generateMap(gdGeo, this.gdMapHeight, this.cnMapMaterial, this.gdLineMaterial, true);
		this.gdMap.position.z = this.cnMapHeight - this.gdMapHeight;
		this.gdCityMeshes = [];
		this.gdMap.children.forEach(city => {
			city.children.forEach(object => {
				if (object.type == "Mesh") this.gdCityMeshes.push(object);
			});
		});

		// 设置光线
		this.raycaster = new THREE.Raycaster();
		const onMouseMove = (event: MouseEvent) => {
			this.mouse = new THREE.Vector2((event.offsetX / this.canvasWidth) * 2 - 1, -(event.offsetY / this.canvasHeight) * 2 + 1);
		};

		// 设置点击
		threeMapDiv.value?.addEventListener("mousemove", onMouseMove, false);
		const onMouseClick = (event: MouseEvent) => {
			if (!this.rayCastUpdate()) {
				this.hoverCityName.value = "";
				if (this.cityTooltip) {
					this.scene2.remove(this.cityTooltip);
					this.cityTooltip = null;
				}
			}
		};
		threeMapDiv.value?.addEventListener("click", onMouseClick, false);

		this.zoomInAnimation();
	}

	resize(width: number, height: number) {
		this.canvasWidth = width;
		this.canvasHeight = height;

		this.camera.aspect = width / height;
		this.camera.updateProjectionMatrix();

		this.renderer.setSize(width, height);
		this.renderCSS3D.setSize(width, height);
	}

	render() {
		this.renderer.render(this.scene, this.camera);
		this.renderCSS3D.render(this.scene2, this.camera);
		// this.labelRenderer.render(this.scene, this.camera);
	}

	generateMapFromPolygon(
		coordinates: GeoJSON.Position[],
		mapUnit: THREE.Object3D,
		height: number,
		meshMaterial: THREE.Material[],
		lineMaterial: THREE.Material
	) {
		let mapProjection = this.projectionFn;
		const shape = new THREE.Shape();

		const lineGeometry = new THREE.BufferGeometry();
		const points: Array<THREE.Vector3> = [];

		coordinates.forEach((coodinate: any, index: any) => {
			const result = mapProjection(coodinate);
			if (!result) {
				console.error("Unexpected result from projection: ", result);
			} else {
				const [x, y] = result;
				if (index == 0) {
					shape.moveTo(x, -y);
				}
				shape.lineTo(x, -y);

				points.push(new THREE.Vector3(x, -y, height + 0.1));
			}
		});
		lineGeometry.setFromPoints(points);

		const extrudeSettings = {
			depth: height,
			bevelEnabled: false,
		};

		const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

		const mesh = new THREE.Mesh(geometry, meshMaterial);
		mesh.name = mapUnit.name;
		// mesh.renderOrder = 10;
		const line = new THREE.Line(lineGeometry, lineMaterial);
		// line.renderOrder = 0;

		mapUnit.add(mesh);
		mapUnit.add(line);
	}

	generateMap(
		geoData: GeoJSON.FeatureCollection,
		height: number = 1,
		meshMaterial: THREE.MeshBasicMaterial[] = this.cnMapMaterial,
		lineMaterial: THREE.Material = this.lineMaterial,
		isGdMap: boolean = false
	) {
		// 生成地图的几何体
		let map = new THREE.Object3D();

		geoData.features.forEach(feature => {
			const parentObject = new THREE.Object3D();
			let cityName = feature.properties?.name;
			parentObject.name = cityName;

			let thisMeshMaterial: THREE.MeshBasicMaterial[] = meshMaterial;

			if (isGdMap) {
				let newMeshMaterial = meshMaterial[0].clone();

				thisMeshMaterial = [newMeshMaterial, meshMaterial[1]];
			}

			if (feature.geometry.type === "Polygon") {
				const coordinates = feature.geometry.coordinates as GeoJSON.Position[][];
				coordinates.forEach((polygon: GeoJSON.Position[]) => {
					this.generateMapFromPolygon(polygon, parentObject, height, thisMeshMaterial, lineMaterial);
				});
			} else if (feature.geometry.type === "MultiPolygon") {
				const coordinates = feature.geometry.coordinates as GeoJSON.Position[][][];

				coordinates.forEach((multiPolygon: GeoJSON.Position[][]) => {
					multiPolygon.forEach((polygon: any) => {
						this.generateMapFromPolygon(polygon, parentObject, height, thisMeshMaterial, lineMaterial);
					});
				});
			} else {
				console.error("意外的Feature Geometry Type: ", feature.geometry.type);
				// return undefined;
			}

			map.add(parentObject);
			// console.log(feature.properties?.name, province);
		});
		this.scene.add(map);
		// console.log("Map: ", map);
		return map;
	}

	rayCastUpdate(): boolean {
		if (!this.mouse) return false;

		this.raycaster.setFromCamera(this.mouse, this.camera);
		const intersects = this.raycaster.intersectObjects(this.gdCityMeshes, true);

		if (this.lastPick) {
			this.lastPick.children
				.filter(obj => obj.type == "Mesh")
				.forEach(obj => {
					((obj as THREE.Mesh).material as THREE.MeshBasicMaterial[])[0].opacity = this.gdMapMaterial[0].opacity;
				});
		}

		if (!intersects[0]) {
			return false;
		} else {
			this.lastPick = intersects[0].object.parent;

			// console.log(intersects);
			if (!this.lastPick) {
				return false;
			} else {
				this.lastPick.children.forEach(object => {
					if (object.type === "Mesh") {
						((object as THREE.Mesh).material as THREE.MeshBasicMaterial[])[0].opacity = 1;
					}
				});
				let cityName = this.lastPick.name;
				this.hoverCityName.value = cityName;

				// let cityPos = this.projectionFn(gdGeo.features.find(feature => feature.properties?.name == cityName)?.properties?.centroid);
				// console.log("市坐标: ", cityPos);
				// let labelPos = new THREE.Vector3(cityPos[0] + 1, -cityPos[1] - 0.5, this.gdMapHeight + 3);
				let labelPos = new THREE.Vector3(intersects[0]?.point.x + 1, intersects[0]?.point.y - 1, intersects[0]?.point.z);
				if (!this.cityTooltipPos) this.cityTooltipPos = labelPos;
				else this.cityTooltipPos.copy(labelPos);

				if (!this.cityTooltip) {
					this.cityTooltip = this.createCSSLabel(labelPos);
				}
			}
		}
		return true;
	}

	createCSSLabel(initPos: THREE.Vector3) {
		let title = this.hoverCityName;

		let labelDiv = document.createElement("div");
		const tooltip = createApp(MapCityToolTip, {
			title,
			params: this.getTooltipContent,
		}).mount(labelDiv);
		let label = new CSS3DObject(labelDiv);
		label.rotateX(Math.PI / 4);
		label.rotateY(-Math.PI / 15);
		label.scale.set(0.05, 0.05, 0.05);
		label.position.copy(initPos);

		this.scene2.add(label);

		return label;
	}

	getTooltipContent = computed(() => {
		return [
			{ key: "气温", value: gdCityWeathers.value[this.hoverCityName.value].temperature + "℃" },
			{ key: "湿度", value: gdCityWeathers.value[this.hoverCityName.value].humidity + "%" },
			{ key: "回南天", value: gdCityWeathers.value[this.hoverCityName.value].range },
		];
	});

	updateCSSLabel() {
		if (this.cityTooltip && this.cityTooltipPos) {
			const speed = 2;

			const dx = this.cityTooltipPos.x - this.cityTooltip.position.x;
			const dy = this.cityTooltipPos.y - this.cityTooltip.position.y;
			const distance = Math.sqrt(dx * dx + dy * dy);
			const velocity = Math.min(0.4, distance * speed);
			// console.log(distance / speed < 0.4 ? "slow" : "fast");

			this.cityTooltip.position.x += dx * velocity;
			this.cityTooltip.position.y += dy * velocity;
		}
	}

	animate() {
		requestAnimationFrame(this.animate.bind(this));
		this.rayCastUpdate();

		TWEEN.update();
		this.updateCSSLabel();

		if (this.controller2) this.controller2.update();
		if (this.controller) this.controller.update();
		this.render();
	}

	zoomInAnimation() {
		// 动画1：相机移动、全国地图淡出
		let ease1 = {
			cameraPos: this.camera.position,
			cnMapOpacity: this.cnMapMaterial[0].opacity,
			orbitCenter: this.controllerConfig.target,
		};
		let tween1 = new TWEEN.Tween(ease1)
			.to(
				{
					cameraPos: new THREE.Vector3(33, -65, 25),
					cnMapOpacity: 0.1,
					orbitCenter: this.provinceTargetPos,
				},
				4000
				// 500
			)
			.onUpdate(() => {
				this.controller.target.copy(ease1.orbitCenter);
				this.controller2?.target.copy(ease1.orbitCenter);

				this.cnMapMaterial[0].opacity = ease1.cnMapOpacity;
			})
			.easing(TWEEN.Easing.Quartic.InOut);

		// 动画2：广东地图上升
		let ease2 = {
			z: this.cnMapHeight - this.gdMapHeight,
		};
		let tween2 = new TWEEN.Tween(ease2)
			.to(
				{
					z: 0,
				},
				1500
			)
			.easing(TWEEN.Easing.Quartic.Out)
			.onUpdate(() => {
				this.gdMap.position.z = ease2.z;
			});

		// 动画3：广东地图线条、城市名标签淡入
		let ease3 = {
			gdLineOpacity: this.gdLineMaterial.opacity,
			cityNameLabelOpacity: -1,
		};
		let tween3 = new TWEEN.Tween(ease3)
			.to(
				{
					gdLineOpacity: 0.8,
					cityNameLabelOpacity: 0.8,
				},
				5000
			)
			.easing(TWEEN.Easing.Quartic.Out)
			.onUpdate(() => {
				this.gdLineMaterial.opacity = ease3.gdLineOpacity;
				this.cityNameLabels.children.forEach(sprite => {
					(sprite as THREE.Sprite).material.opacity = Math.max(0, ease3.cityNameLabelOpacity);
				});
			});

		// 动画4：广东地图城市颜色渐变
		let cityMapColorEase = new Object() as { [key: string]: THREE.Color };
		this.gdMap.children.forEach(city => {
			cityMapColorEase[city.name] = (
				(city.children.find(obj => obj.type == "Mesh") as THREE.Mesh).material as THREE.MeshBasicMaterial[]
			)[0].color;
		});
		let cityMapColorTarget = new Object() as { [key: string]: THREE.Color };
		let cityMapTween = new TWEEN.Tween(cityMapColorEase).to(cityMapColorTarget, 2000).easing(TWEEN.Easing.Quartic.Out);
		for (let key in cityMapColorEase) {
			cityMapColorTarget[key] = cityMapColorEase[key];
			let weatherInfo = gdCityWeathers.value[key];
			if (weatherInfo) {
				let h = Math.pow(weatherInfo.humidity / 100, 10);
				let c2 = new THREE.Color("#619A7F"); // 浅绿
				// let c2 = new THREE.Color("#006E1C"); // 深绿

				cityMapColorTarget[key] = cityMapColorTarget[key].clone();
				cityMapColorTarget[key].lerp(c2, h);
			}
		}

		// 动画开始
		tween1.start();
		tween2.delay(3200).start();
		tween3.delay(3000).start();
		cityMapTween.delay(4000).start();
	}
}

let threeMap: ThreeMap | undefined = undefined;

onMounted(() => {
	let widthNum = parseFloat(window.getComputedStyle(threeMapDiv.value!).width.replace("px", ""));
	let heightNum = parseFloat(window.getComputedStyle(threeMapDiv.value!).height.replace("px", ""));

	window.addEventListener("resize", () => {
		let widthNum = parseFloat(window.getComputedStyle(threeMapDiv.value!).width.replace("px", ""));
		let heightNum = parseFloat(window.getComputedStyle(threeMapDiv.value!).height.replace("px", ""));
		threeMap?.resize(widthNum, heightNum);
	});

	fetchGdData().finally(() => {
		threeMap = new ThreeMap(threeMapDiv.value!, cityNameLabelDiv.value!, widthNum, heightNum);
		threeMap.animate();
	});
});

onUnmounted(() => {
	if (threeMap) {
		threeMap = undefined;
	}
});
</script>

<template>
	<div class="root" id="map-root">
		<div class="map-div" id="three-map-div" ref="threeMapDiv"></div>
		<div class="name-label-div" id="city-name-label-div" ref="cityNameLabelDiv"></div>
	</div>
</template>

<style scoped>
.root {
	position: absolute;
	left: 0;
	right: 0;
	/* width: 100%; */
	height: calc(100vh - 9rem);
}

.map-div,
.name-label-div {
	position: absolute;
	width: 100%;
	height: 100%;
}

#city-name-label-div {
	pointer-events: none;
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
